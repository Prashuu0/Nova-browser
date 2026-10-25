export const NOVA_SEARCH_HOST = 'search.nova';

export function getPageType(url) {
  if (!url || url === 'nova://newtab' || url === 'about:newtab') return 'newtab';
  if (isNovaSearchUrl(url)) return 'search';
  return 'web';
}

export function isNovaSearchUrl(url) {
  if (!url) return false;
  if (url.startsWith('nova://search')) return true;
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    return u.hostname === NOVA_SEARCH_HOST || u.hostname === `www.${NOVA_SEARCH_HOST}`;
  } catch {
    return false;
  }
}

export function isExternalSearchUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    const hosts = ['google.com', 'bing.com', 'duckduckgo.com', 'search.brave.com', 'yahoo.com'];
    const isHost = hosts.some((h) => host === h || host.endsWith(`.${h}`));
    const hasQuery = u.searchParams.get('q') || u.searchParams.get('query') || u.searchParams.get('p');
    return isHost && !!hasQuery;
  } catch {
    return false;
  }
}

export function externalSearchToNova(url) {
  if (!isExternalSearchUrl(url)) return null;
  try {
    const u = new URL(url);
    const q = u.searchParams.get('q') || u.searchParams.get('query') || u.searchParams.get('p');
    const type = u.searchParams.get('tbm') === 'isch' ? 'images' : u.searchParams.get('type') || 'all';
    if (q) return buildNovaSearchUrl(q, type);
  } catch {}
  return null;
}

export function parseNovaSearchUrl(url) {
  if (!url) return { query: '', type: 'all' };
  try {
    let parsed;
    if (url.startsWith('nova://search')) {
      parsed = new URL(url.replace('nova://', 'https://nova.local/'));
    } else if (isNovaSearchUrl(url)) {
      parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    } else {
      return { query: '', type: 'all' };
    }
    return {
      query: decodeURIComponent(parsed.searchParams.get('q') || ''),
      type: parsed.searchParams.get('type') || 'all'
    };
  } catch {
    const match = url.match(/[?&]q=([^&]+)/);
    return {
      query: match ? decodeURIComponent(match[1]) : '',
      type: 'all'
    };
  }
}

export function parseNovaSearchQuery(url) {
  return parseNovaSearchUrl(url).query;
}

export function parseNovaSearchType(url) {
  return parseNovaSearchUrl(url).type;
}

export function buildNovaSearchUrl(query, type = 'all') {
  const q = encodeURIComponent(query.trim());
  const t = type && type !== 'all' ? `&type=${encodeURIComponent(type)}` : '';
  return `nova://search?q=${q}${t}`;
}

export function buildDisplaySearchUrl(query, type = 'all') {
  const q = encodeURIComponent(query.trim());
  const t = type && type !== 'all' ? `&type=${encodeURIComponent(type)}` : '';
  return `https://${NOVA_SEARCH_HOST}/search?q=${q}${t}`;
}

export function displayUrlToNova(url) {
  if (!url) return null;
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    if (u.hostname.replace(/^www\./, '') !== NOVA_SEARCH_HOST) return null;
    const q = u.searchParams.get('q');
    if (!q) return null;
    const type = u.searchParams.get('type') || 'all';
    return buildNovaSearchUrl(decodeURIComponent(q), type);
  } catch {
    return null;
  }
}

export function formatAddressBarUrl(url) {
  if (!url || url === 'nova://newtab') return '';
  if (isNovaSearchUrl(url)) {
    const { query, type } = parseNovaSearchUrl(url);
    return buildDisplaySearchUrl(query, type);
  }
  const nova = externalSearchToNova(url);
  if (nova) {
    const { query, type } = parseNovaSearchUrl(nova);
    return buildDisplaySearchUrl(query, type);
  }
  return url;
}

export function isWebUrl(url) {
  return url && (url.startsWith('http://') || url.startsWith('https://')) && !isNovaSearchUrl(url) && !isExternalSearchUrl(url);
}

/** Single source of truth — derive page type from URL, not stale tab.pageType */
export function resolveTabPageType(tab) {
  const url = tab?.url;
  if (!url || url === 'nova://newtab' || url === 'about:newtab') return 'newtab';
  if (isNovaSearchUrl(url)) return 'search';
  if (url.startsWith('http://') || url.startsWith('https://')) return 'web';
  return tab?.pageType || 'newtab';
}

export function isWebTab(tab) {
  return resolveTabPageType(tab) === 'web';
}
