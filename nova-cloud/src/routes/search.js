const express = require('express');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../db/pool');
const { optionalAuth } = require('../middleware/auth');
const config = require('../config');
const { cacheGet, cacheSet } = require('../services/redis');
const { loadJsonlIndex, mergeCrawlResults, ingestItems } = require('../services/crawlIndex');

const router = express.Router();

const SEARCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml',
  'Accept-Language': 'en-US,en;q=0.9'
};

function queryHash(q, type) {
  return crypto.createHash('sha256').update(`${q.toLowerCase().trim()}:${type}`).digest('hex');
}

function decodeDdgUrl(href) {
  if (!href) return null;
  try {
    let url = href.trim();
    if (url.includes('uddg=')) {
      const match = url.match(/uddg=([^&]+)/);
      if (match) url = decodeURIComponent(match[1]);
    }
    if (url.startsWith('//')) url = 'https:' + url;
    if (url.startsWith('/')) {
      const uddg = url.match(/uddg=([^&]+)/);
      if (uddg) url = decodeURIComponent(uddg[1]);
      else return null;
    }
    if (!url.startsWith('http')) {
      if (url.includes('.')) url = 'https://' + url;
      else return null;
    }
    new URL(url);
    return url;
  } catch {
    return null;
  }
}

function parseResults(html) {
  const results = [];
  const linkRegex = /class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = linkRegex.exec(html)) !== null && results.length < 24) {
    const url = decodeDdgUrl(m[1]);
    const title = m[2].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim();
    if (url && title && !url.includes('duckduckgo.com')) {
      results.push({ title, url, snippet: '', type: 'web' });
    }
  }
  return results;
}

async function fetchDdg(query, type) {
  const start = Date.now();
  const encoded = encodeURIComponent(query.trim());
  const urls = [
    `https://html.duckduckgo.com/html/?q=${encoded}`,
    `https://lite.duckduckgo.com/lite/?q=${encoded}`
  ];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  for (const url of urls) {
    try {
      const response = await fetch(url, {
        method: url.includes('html.duckduckgo') ? 'POST' : 'GET',
        headers: SEARCH_HEADERS,
        signal: controller.signal,
        ...(url.includes('html.duckduckgo') && {
          body: `q=${encoded}`,
          headers: { ...SEARCH_HEADERS, 'Content-Type': 'application/x-www-form-urlencoded' }
        })
      });
      if (!response.ok) continue;
      const html = await response.text();
      const results = parseResults(html);
      if (results.length) {
        clearTimeout(timeout);
        return { results, searchTime: (Date.now() - start) / 1000 };
      }
    } catch {}
  }
  clearTimeout(timeout);
  return { results: [], searchTime: (Date.now() - start) / 1000 };
}

// POST /api/search/query
router.post('/query', optionalAuth, async (req, res, next) => {
  try {
    const { query: q, type = 'all' } = req.body;
    if (!q?.trim()) return res.status(400).json({ error: 'Query required' });

    const hash = queryHash(q, type);
    const redisKey = `search:${hash}`;

    const redisCached = await cacheGet(redisKey);
    if (redisCached) {
      return res.json({ results: redisCached, searchTime: 0, cached: true, source: 'nova-redis' });
    }

    const cached = await query(
      'SELECT results FROM search_cache WHERE query_hash = $1 AND search_type = $2 AND expires_at > NOW()',
      [hash, type]
    );

    if (cached.rows.length) {
      await query('UPDATE search_cache SET hit_count = hit_count + 1 WHERE query_hash = $1', [hash]);
      return res.json({ results: cached.rows[0].results, searchTime: 0, cached: true, source: 'nova-cache' });
    }

    const start = Date.now();
    let { results, searchTime } = await fetchDdg(q, type);
    results = await mergeCrawlResults(q, results);
    const latency = Date.now() - start;

    const expiresAt = new Date(Date.now() + config.searchCacheTtl * 1000);
    await cacheSet(redisKey, results, config.searchCacheTtl);
    await query(
      `INSERT INTO search_cache (id, query_hash, query, search_type, results, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (query_hash, search_type) DO UPDATE SET results = EXCLUDED.results, expires_at = EXCLUDED.expires_at, hit_count = search_cache.hit_count + 1`,
      [uuidv4(), hash, q.trim(), type, JSON.stringify(results), expiresAt]
    );

    await query(
      `INSERT INTO trending_searches (query, search_count, recorded_at)
       VALUES ($1, 1, CURRENT_DATE)
       ON CONFLICT (query, region, period, recorded_at) DO UPDATE SET search_count = trending_searches.search_count + 1`,
      [q.trim().toLowerCase()]
    );

    if (req.user) {
      await query(
        'INSERT INTO search_analytics (id, user_id, query, search_type, result_count, latency_ms) VALUES ($1, $2, $3, $4, $5, $6)',
        [uuidv4(), req.user.id, q.trim(), type, results.length, latency]
      );
    }

    res.json({ results, searchTime, cached: false, source: 'nova-api' });
  } catch (err) {
    next(err);
  }
});

router.post('/index/ingest', optionalAuth, async (req, res, next) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ error: 'items array required' });
    }
    const ingested = await ingestItems(items);
    res.json({ success: true, ingested });
  } catch (err) {
    next(err);
  }
});

router.post('/index/sync-file', optionalAuth, async (req, res, next) => {
  try {
    const items = loadJsonlIndex();
    const ingested = await ingestItems(items);
    res.json({ success: true, ingested, total: items.length });
  } catch (err) {
    next(err);
  }
});

// GET /api/search/trending
router.get('/trending', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT query, search_count FROM trending_searches
       WHERE recorded_at = CURRENT_DATE AND period = 'daily'
       ORDER BY search_count DESC LIMIT 20`
    );
    res.json({ trending: result.rows });
  } catch (err) {
    next(err);
  }
});

// GET /api/search/suggestions?q=
router.get('/suggestions', async (req, res, next) => {
  try {
    const q = req.query.q;
    if (!q || q.length < 2) return res.json({ suggestions: [] });
    const response = await fetch(
      `https://duckduckgo.com/ac/?q=${encodeURIComponent(q)}&type=list`,
      { headers: SEARCH_HEADERS }
    );
    const data = await response.json();
    res.json({ suggestions: (data[1] || []).slice(0, 8).map((s) => s.phrase || s) });
  } catch {
    res.json({ suggestions: [] });
  }
});

module.exports = router;
