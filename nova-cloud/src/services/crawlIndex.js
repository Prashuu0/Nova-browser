const fs = require('fs');
const path = require('path');
const { query, isSqlite } = require('../db/pool');

const CRAWL_FILE = path.join(__dirname, '../../../nova-crawler/crawl_index.jsonl');

let cachedIndex = null;
let cachedMtime = 0;

function loadJsonlIndex() {
  try {
    if (!fs.existsSync(CRAWL_FILE)) return [];
    const stat = fs.statSync(CRAWL_FILE);
    if (cachedIndex && stat.mtimeMs === cachedMtime) return cachedIndex;
    const lines = fs.readFileSync(CRAWL_FILE, 'utf8').trim().split('\n').filter(Boolean);
    cachedIndex = lines.map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    }).filter(Boolean);
    cachedMtime = stat.mtimeMs;
    return cachedIndex;
  } catch {
    return [];
  }
}

async function loadDbIndex(queryText) {
  if (!isSqlite) return [];
  try {
    const q = `%${queryText.toLowerCase().trim()}%`;
    const { rows } = await query(
      `SELECT url, title, snippet FROM search_index
       WHERE LOWER(title || ' ' || snippet || ' ' || url || ' ' || COALESCE(keywords, '')) LIKE $1
       ORDER BY crawled_at DESC LIMIT 12`,
      [q]
    );
    return rows;
  } catch {
    return [];
  }
}

async function mergeCrawlResults(queryText, webResults) {
  const q = queryText.toLowerCase().trim();
  if (!q) return webResults;

  const dbHits = await loadDbIndex(q);
  const jsonlHits = loadJsonlIndex().filter((item) => {
    const hay = `${item.title || ''} ${item.snippet || ''} ${item.url || ''}`.toLowerCase();
    return hay.includes(q);
  });

  const allHits = [...dbHits, ...jsonlHits];
  const crawlHits = allHits
    .slice(0, 8)
    .map((item) => ({
      title: item.title || item.url,
      url: item.url,
      snippet: item.snippet || '',
      type: 'crawl',
      source: 'nova-index'
    }));

  if (!crawlHits.length) return webResults;

  const seen = new Set(webResults.map((r) => r.url));
  const merged = [...crawlHits.filter((r) => r.url && !seen.has(r.url)), ...webResults];
  return merged.slice(0, 24);
}

async function ingestItems(items = []) {
  let count = 0;
  for (const item of items) {
    if (!item.url) continue;
    const { v4: uuidv4 } = require('uuid');
    const keywords = (item.keywords || item.title || '').toLowerCase();
    await query(
      `INSERT INTO search_index (id, url, title, snippet, keywords, crawled_at)
       VALUES ($1, $2, $3, $4, $5, datetime('now'))
       ON CONFLICT(url) DO UPDATE SET
         title = excluded.title,
         snippet = excluded.snippet,
         keywords = excluded.keywords,
         crawled_at = datetime('now')`,
      [uuidv4(), item.url, item.title || '', item.snippet || '', keywords]
    );
    count++;
  }
  return count;
}

module.exports = { loadJsonlIndex, mergeCrawlResults, ingestItems };
