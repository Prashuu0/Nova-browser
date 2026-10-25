const FILTER_LIST_URLS = {
  easylist: 'https://easylist.to/easylist/easylist.txt',
  easyprivacy: 'https://easylist.to/easylist/easyprivacy.txt'
};

let adDomainsFromLists = new Set();
let trackerDomainsFromLists = new Set();
let lastUpdated = null;
let isLoading = false;

function parseEasyListDomains(text) {
  const domains = new Set();
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('!') || trimmed.startsWith('[')) continue;

    const pipeMatch = trimmed.match(/^\|\|([a-z0-9.-]+)\^/i);
    if (pipeMatch) {
      domains.add(pipeMatch[1].replace(/^www\./, '').toLowerCase());
      continue;
    }

    const domainMatch = trimmed.match(/^([a-z0-9.-]+\.[a-z]{2,})\$/i);
    if (domainMatch) {
      domains.add(domainMatch[1].replace(/^www\./, '').toLowerCase());
    }
  }
  return domains;
}

async function fetchFilterList(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'NovaBrowser/1.0' }
  });
  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`);
  return response.text();
}

async function loadFilterLists() {
  if (isLoading) return getStats();
  isLoading = true;

  try {
    const [easylistText, privacyText] = await Promise.all([
      fetchFilterList(FILTER_LIST_URLS.easylist),
      fetchFilterList(FILTER_LIST_URLS.easyprivacy)
    ]);

    adDomainsFromLists = parseEasyListDomains(easylistText);
    trackerDomainsFromLists = parseEasyListDomains(privacyText);
    lastUpdated = Date.now();

    return getStats();
  } finally {
    isLoading = false;
  }
}

function getAdDomainsFromLists() {
  return adDomainsFromLists;
}

function getTrackerDomainsFromLists() {
  return trackerDomainsFromLists;
}

function getStats() {
  return {
    adDomains: adDomainsFromLists.size,
    trackerDomains: trackerDomainsFromLists.size,
    lastUpdated,
    isLoading
  };
}

function isDomainInList(hostname, domainSet) {
  const host = hostname.replace(/^www\./, '').toLowerCase();
  for (const domain of domainSet) {
    if (host === domain || host.endsWith('.' + domain)) return true;
  }
  return false;
}

function isAdFromFilterList(url) {
  try {
    const hostname = new URL(url).hostname;
    return isDomainInList(hostname, adDomainsFromLists);
  } catch {
    return false;
  }
}

function isTrackerFromFilterList(url) {
  try {
    const hostname = new URL(url).hostname;
    return isDomainInList(hostname, trackerDomainsFromLists);
  } catch {
    return false;
  }
}

module.exports = {
  loadFilterLists,
  getStats,
  getAdDomainsFromLists,
  getTrackerDomainsFromLists,
  isAdFromFilterList,
  isTrackerFromFilterList,
  FILTER_LIST_URLS
};
