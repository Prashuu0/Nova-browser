const DANGEROUS_PROTOCOLS = ['javascript:', 'data:', 'vbscript:', 'file:'];

const EXTERNAL_SEARCH_HOSTS = [
  'google.com',
  'bing.com',
  'duckduckgo.com',
  'search.brave.com',
  'yahoo.com',
  'ecosia.org'
];

function isValidUrl(string) {
  try {
    const url = new URL(string);
    if (DANGEROUS_PROTOCOLS.some((p) => url.protocol === p)) {
      return false;
    }
    return ['http:', 'https:', 'nova:'].includes(url.protocol);
  } catch {
    return false;
  }
}

function looksLikeUrl(input) {
  const trimmed = input.trim();
  if (/^https?:\/\//i.test(trimmed)) return true;
  if (/^nova:\/\//i.test(trimmed)) return true;
  if (/^localhost(:\d+)?/i.test(trimmed)) return true;
  if (/^[\w-]+(\.[\w-]+)+/.test(trimmed) && !trimmed.includes(' ')) return true;
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(trimmed)) return true;
  return false;
}

function normalizeUrl(input) {
  let url = input.trim();
  if (url.startsWith('nova://')) return url;
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  return url;
}

function buildNovaSearchUrl(query, type = 'all') {
  const q = encodeURIComponent(query.trim());
  const t = type && type !== 'all' ? `&type=${encodeURIComponent(type)}` : '';
  return `nova://search?q=${q}${t}`;
}

function parseNovaSearchUrl(url) {
  if (!url) return { query: '', type: 'all' };
  try {
    let parsed;
    if (url.startsWith('nova://search')) {
      parsed = new URL(url.replace('nova://', 'https://nova.local/'));
    } else {
      const u = url.startsWith('http') ? url : `https://${url}`;
      parsed = new URL(u);
      const host = parsed.hostname.replace(/^www\./, '');
      if (host !== 'search.nova') return { query: '', type: 'all' };
    }
    return {
      query: decodeURIComponent(parsed.searchParams.get('q') || ''),
      type: parsed.searchParams.get('type') || 'all'
    };
  } catch {
    const match = url.match(/[?&]q=([^&]+)/);
    return { query: match ? decodeURIComponent(match[1]) : '', type: 'all' };
  }
}

function parseNovaSearchQuery(url) {
  return parseNovaSearchUrl(url).query;
}

function isNovaSearchUrl(url) {
  if (!url) return false;
  if (url.startsWith('nova://search')) return true;
  try {
    const host = new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace(/^www\./, '');
    return host === 'search.nova';
  } catch {
    return false;
  }
}

function displayUrlToNova(input) {
  return parseNovaSearchUrl(input).query ? buildNovaSearchUrl(
    parseNovaSearchUrl(input.startsWith('http') ? input : `https://${input}`).query,
    parseNovaSearchUrl(input.startsWith('http') ? input : `https://${input}`).type
  ) : null;
}

function getPageType(url) {
  if (!url || url === 'nova://newtab' || url === 'about:newtab') return 'newtab';
  if (isNovaSearchUrl(url)) return 'search';
  return 'web';
}

function convertExternalSearchToNova(input) {
  if (!input || typeof input !== 'string') return null;
  try {
    const raw = input.trim();
    const urlStr = raw.startsWith('http') ? raw : `https://${raw}`;
    const u = new URL(urlStr);
    const host = u.hostname.replace(/^www\./, '');

    const isSearchHost = EXTERNAL_SEARCH_HOSTS.some(
      (h) => host === h || host.endsWith(`.${h}`)
    );
    if (!isSearchHost) return null;

    const q =
      u.searchParams.get('q') ||
      u.searchParams.get('query') ||
      u.searchParams.get('p') ||
      u.searchParams.get('text');

    if (q) return buildNovaSearchUrl(q);
    return null;
  } catch {
    return null;
  }
}

function sanitizeUrl(url) {
  if (!url) return url;
  if (url.startsWith('nova://')) return url;
  const converted = convertExternalSearchToNova(url);
  return converted || url;
}

function resolveSearchQuery(input) {
  const trimmed = input.trim();
  if (!trimmed) return { url: 'nova://newtab', type: 'newtab', pageType: 'newtab' };

  if (trimmed === 'nova://newtab' || trimmed === 'about:newtab') {
    return { url: 'nova://newtab', type: 'newtab', pageType: 'newtab' };
  }

  if (trimmed.startsWith('nova://search')) {
    const { query, type } = parseNovaSearchUrl(trimmed);
    return { url: trimmed, type: 'search', query, searchType: type, pageType: 'search' };
  }

  if (isNovaSearchUrl(trimmed) || trimmed.includes('search.nova')) {
    const url = normalizeUrl(trimmed);
    const { query, type } = parseNovaSearchUrl(url);
    if (query) {
      const novaUrl = buildNovaSearchUrl(query, type);
      return { url: novaUrl, type: 'search', query, searchType: type, pageType: 'search' };
    }
  }

  const externalSearch = convertExternalSearchToNova(trimmed);
  if (externalSearch) {
    const query = parseNovaSearchQuery(externalSearch);
    return { url: externalSearch, type: 'search', query, pageType: 'search' };
  }

  if (looksLikeUrl(trimmed)) {
    const url = normalizeUrl(trimmed);
    const novaFromUrl = convertExternalSearchToNova(url);
    if (novaFromUrl) {
      const query = parseNovaSearchQuery(novaFromUrl);
      return { url: novaFromUrl, type: 'search', query, pageType: 'search' };
    }
    if (isValidUrl(url)) {
      return { url, type: 'url', pageType: 'web' };
    }
    return { url: null, type: 'error', error: 'Invalid or blocked URL' };
  }

  const searchUrl = buildNovaSearchUrl(trimmed);
  return { url: searchUrl, type: 'search', query: trimmed, pageType: 'search' };
}

function validateUrl(url) {
  if (!url) return { valid: false, error: 'Empty URL' };
  if (url === 'nova://newtab' || url.startsWith('nova://search')) return { valid: true };
  const sanitized = sanitizeUrl(url);
  if (sanitized.startsWith('nova://search')) return { valid: true };
  if (!isValidUrl(sanitized)) return { valid: false, error: 'Invalid or dangerous URL protocol' };
  return { valid: true };
}

module.exports = {
  validateUrl,
  resolveSearchQuery,
  isValidUrl,
  looksLikeUrl,
  normalizeUrl,
  buildNovaSearchUrl,
  parseNovaSearchQuery,
  getPageType,
  convertExternalSearchToNova,
  sanitizeUrl
};
