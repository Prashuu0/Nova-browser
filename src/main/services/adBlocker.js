const { isAdFromFilterList } = require('./filterLists');
const { recordBlocked } = require('./privacyStatsService');

const BLOCKED_DOMAINS = new Set([
  'doubleclick.net',  'googlesyndication.com',
  'googleadservices.com',
  'adservice.google.com',
  'facebook.net',
  'connect.facebook.net',
  'analytics.google.com',
  'google-analytics.com',
  'scorecardresearch.com',
  'taboola.com',
  'outbrain.com',
  'adnxs.com',
  'rubiconproject.com',
  'pubmatic.com',
  'openx.net',
  'criteo.com',
  'amazon-adsystem.com',
  'moatads.com',
  'adsafeprotected.com',
  'advertising.com',
  'adform.net',
  'casalemedia.com',
  'contextweb.com',
  'exelator.com',
  'mathtag.com',
  'rlcdn.com',
  'quantserve.com',
  'bidswitch.net',
  'smartadserver.com',
  'yieldmo.com',
  'sharethrough.com',
  'spotxchange.com',
  'teads.tv',
  'tremorhub.com',
  'adtech.de',
  'adtechus.com',
  'adition.com',
  'adroll.com',
  'adsrvr.org',
  'adtech.com',
  'bluekai.com',
  'demdex.net',
  'everesttech.net',
  'krxd.net',
  'lijit.com',
  'media.net',
  'mediamath.com',
  'nexage.com',
  'openx.com',
  'pubmatic.com',
  'rubiconproject.com',
  'serving-sys.com',
  'turn.com',
  'yldbt.com',
  'zedo.com'
]);

const AD_PATTERNS = [
  /\/ads?\//i,
  /\/adserver\//i,
  /\/advert/i,
  /\/banner/i,
  /\/popup/i,
  /\/sponsor/i,
  /\/tracking/i,
  /\/pixel/i,
  /\/beacon/i,
  /[?&]ad[_=]/i,
  /[?&]ads[_=]/i,
  /googlesyndication/i,
  /doubleclick/i
];

function isAdUrl(url) {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace(/^www\./, '');

    for (const domain of BLOCKED_DOMAINS) {
      if (hostname === domain || hostname.endsWith('.' + domain)) {
        return true;
      }
    }

    const fullUrl = url.toLowerCase();
    if (AD_PATTERNS.some((pattern) => pattern.test(fullUrl))) return true;
    return isAdFromFilterList(url);
  } catch {
    return false;
  }
}
let adBlockerEnabled = true;

function setupAdBlocker(sess) {
  sess.webRequest.onBeforeRequest({ urls: ['<all_urls>'] }, (details, callback) => {
    if (!adBlockerEnabled || details.resourceType === 'mainFrame') {
      callback({ cancel: false });
      return;
    }
    try {
      const { shouldBlockForSite } = require('./siteSettings');
      if (!shouldBlockForSite(details.url, 'ad')) {
        callback({ cancel: false });
        return;
      }
    } catch {}
    if (isAdUrl(details.url)) {
      try {
        const hostname = new URL(details.url).hostname;
        recordBlocked({
          requestId: details.id,
          domain: hostname,
          type: 'ad',
          resourceType: details.resourceType
        });
      } catch {}
      callback({ cancel: true });
    } else {
      callback({ cancel: false });
    }
  });
}

function setAdBlockerEnabled(enabled) {
  adBlockerEnabled = enabled;
}

function isAdBlockerEnabled() {
  return adBlockerEnabled;
}

module.exports = { setupAdBlocker, setAdBlockerEnabled, isAdBlockerEnabled, isAdUrl, BLOCKED_DOMAINS };
