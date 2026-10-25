const SEARCH_URL = 'https://html.duckduckgo.com/html/';
const SEARCH_URL_LITE = 'https://lite.duckduckgo.com/lite/';
const SEARCH_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 NovaBrowser/1.0',
  Accept: 'text/html,application/xhtml+xml,application/json',
  'Accept-Language': 'en-US,en;q=0.9'
};

const TYPE_MODIFIERS = {
  all: (q) => q,
  ai: (q) => q,
  shopping: (q) => `${q} buy shop price`,
  news: (q) => `${q} news`,
  videos: (q) => `${q} video youtube`,
  forums: (q) => `${q} forum reddit discussion`,
  images: (q) => q,
  books: (q) => `${q} book`,
  maps: (q) => `${q} map location`,
  flights: (q) => `${q} flights`
};

let cachedFetch = null;

function getFetch() {
  if (cachedFetch) return cachedFetch;
  try {
    const { net } = require('electron');
    if (net?.fetch) {
      cachedFetch = net.fetch.bind(net);
      return cachedFetch;
    }
  } catch {}
  cachedFetch = globalThis.fetch.bind(globalThis);
  return cachedFetch;
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
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      if (url.includes('.')) url = 'https://' + url;
      else return null;
    }
    new URL(url);
    return url;
  } catch {
    return null;
  }
}

function stripHtml(text) {
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function parseSearchResults(html, searchType = 'all') {
  const results = [];
  const blockRegex = /<div class="result[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/gi;
  let blockMatch;

  while ((blockMatch = blockRegex.exec(html)) !== null && results.length < 24) {
    const block = blockMatch[1];
    const titleMatch = block.match(/class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/i);
    const snippetMatch = block.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/a>/i);

    if (titleMatch) {
      const url = decodeDdgUrl(titleMatch[1]);
      const title = stripHtml(titleMatch[2]);
      const snippet = snippetMatch ? stripHtml(snippetMatch[1]) : '';
      if (url && title && !url.includes('duckduckgo.com')) {
        results.push({ title, url, snippet, type: 'web' });
      }
    }
  }

  if (results.length === 0) {
    const linkRegex = /class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
    let linkMatch;
    while ((linkMatch = linkRegex.exec(html)) !== null && results.length < 24) {
      const url = decodeDdgUrl(linkMatch[1]);
      const title = stripHtml(linkMatch[2]);
      if (url && title && !url.includes('duckduckgo.com/y.js')) {
        results.push({ title, url, snippet: '', type: 'web' });
      }
    }
  }

  if (results.length === 0) {
    const liteRegex = /<a[^>]*class="result-link"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
    let liteMatch;
    while ((liteMatch = liteRegex.exec(html)) !== null && results.length < 24) {
      const url = decodeDdgUrl(liteMatch[1]);
      const title = stripHtml(liteMatch[2]);
      if (url && title) results.push({ title, url, snippet: '', type: 'web' });
    }
  }

  return filterByType(results, searchType);
}

function filterByType(results, searchType) {
  if (!searchType || searchType === 'all' || searchType === 'ai') return results;

  const filters = {
    shopping: (r) => /shop|store|buy|amazon|flipkart|price|cart/i.test(r.url + r.title),
    news: (r) => /news|times|bbc|cnn|reuters|article|ndtv|india/i.test(r.url + r.title),
    videos: (r) => /youtube|youtu\.be|vimeo|tiktok|video|shorts/i.test(r.url),
    forums: (r) => /reddit|quora|stackoverflow|forum|community|discuss/i.test(r.url),
    images: (r) => /\.(jpg|jpeg|png|gif|webp)|imgur|flickr|images/i.test(r.url),
    books: (r) => /book|goodreads|amazon.*\/dp/i.test(r.url + r.title),
    maps: (r) => /maps\.google|openstreetmap|map/i.test(r.url),
    flights: (r) => /flight|airline|skyscanner|makemytrip|goibibo/i.test(r.url + r.title)
  };

  const fn = filters[searchType];
  if (!fn) return results;
  const filtered = results.filter(fn);
  return filtered.length > 0 ? filtered : results.slice(0, 8);
}

async function fetchHtmlGet(url) {
  const doFetch = getFetch();
  const response = await doFetch(url, { headers: SEARCH_HEADERS });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const html = await response.text();
  if (!html || html.length < 100) throw new Error('Empty response');
  return html;
}

async function fetchHtmlPost(url, query) {
  const doFetch = getFetch();
  const response = await doFetch(url, {
    method: 'POST',
    headers: {
      ...SEARCH_HEADERS,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: `q=${encodeURIComponent(query.trim())}`
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const html = await response.text();
  if (!html || html.length < 100) throw new Error('Empty response');
  return html;
}

async function fetchSearchHtml(query, searchType = 'all') {
  const modifier = TYPE_MODIFIERS[searchType] || TYPE_MODIFIERS.all;
  const searchQuery = modifier(query);
  const encoded = encodeURIComponent(searchQuery.trim());
  const attempts = [
    () => fetchHtmlGet(`${SEARCH_URL}?q=${encoded}`),
    () => fetchHtmlPost(SEARCH_URL_LITE, searchQuery),
    () => fetchHtmlGet(`${SEARCH_URL_LITE}?q=${encoded}`)
  ];

  let lastError = null;
  for (const attempt of attempts) {
    try {
      return await attempt();
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error('Search service unavailable');
}

async function fetchImageResults(query) {
  const doFetch = getFetch();
  const q = query.trim();
  const landing = await doFetch(
    `https://duckduckgo.com/?q=${encodeURIComponent(q)}&iax=images&ia=images`,
    { headers: SEARCH_HEADERS }
  );
  if (!landing.ok) throw new Error('Image search unavailable');
  const landingHtml = await landing.text();
  const vqdMatch = landingHtml.match(/vqd=([^&"']+)/);
  if (!vqdMatch) throw new Error('Image search token missing');

  const imgRes = await doFetch(
    `https://duckduckgo.com/i.js?l=us-en&o=json&q=${encodeURIComponent(q)}&vqd=${vqdMatch[1]}`,
    { headers: { ...SEARCH_HEADERS, Referer: 'https://duckduckgo.com/' } }
  );
  if (!imgRes.ok) throw new Error('Image results unavailable');
  const data = await imgRes.json();
  return (data.results || []).slice(0, 30).map((item) => ({
    title: item.title || q,
    url: item.url || item.image,
    snippet: item.source || '',
    type: 'image',
    imageUrl: item.image,
    thumbnail: item.thumbnail
  }));
}

async function performNovaSearch(query, searchType = 'all') {
  const startTime = Date.now();
  if (!query || !query.trim()) {
    return { query: '', searchType, results: [], totalResults: 0, searchTime: 0 };
  }

  try {
    let results = [];

    if (searchType === 'images') {
      try {
        results = await fetchImageResults(query);
      } catch (imgErr) {
        console.warn('Image API fallback:', imgErr.message);
        const html = await fetchSearchHtml(query, searchType);
        results = parseSearchResults(html, searchType).map((r) => ({
          ...r,
          type: 'image',
          imageUrl: r.url
        }));
      }
    } else {
      const html = await fetchSearchHtml(query, searchType);
      results = parseSearchResults(html, searchType);

      if (results.length === 0) {
        const linkRegex = /href="([^"]*uddg=[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
        let linkMatch;
        while ((linkMatch = linkRegex.exec(html)) !== null && results.length < 24) {
          const url = decodeDdgUrl(linkMatch[1]);
          const title = stripHtml(linkMatch[2]);
          if (url && title) results.push({ title, url, snippet: '', type: 'web' });
        }
        results = filterByType(results, searchType);
      }
    }

    const searchTime = ((Date.now() - startTime) / 1000).toFixed(2);
    return {
      query: query.trim(),
      searchType,
      results,
      totalResults: results.length,
      searchTime
    };
  } catch (error) {
    console.error('Nova Search error:', error);
    return {
      query: query.trim(),
      searchType,
      results: [],
      totalResults: 0,
      searchTime: 0,
      error: error.message || 'Search failed. Check your internet connection.'
    };
  }
}

async function getSearchSuggestions(query) {
  if (!query || query.length < 2) return [];
  try {
    const doFetch = getFetch();
    const response = await doFetch(
      `https://duckduckgo.com/ac/?q=${encodeURIComponent(query)}&type=list`
    );
    const data = await response.json();
    return (data[1] || []).slice(0, 8);
  } catch {
    return [];
  }
}

module.exports = { performNovaSearch, getSearchSuggestions };
