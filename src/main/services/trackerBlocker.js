const TRACKER_DOMAINS = new Set([
  'google-analytics.com',
  'googletagmanager.com',
  'hotjar.com',
  'mixpanel.com',
  'segment.io',
  'segment.com',
  'amplitude.com',
  'heap.io',
  'fullstory.com',
  'mouseflow.com',
  'crazyegg.com',
  'optimizely.com',
  'newrelic.com',
  'nr-data.net',
  'bugsnag.com',
  'sentry.io',
  'loggly.com',
  'kissmetrics.com',
  'chartbeat.com',
  'parsely.com',
  'quantcast.com',
  'scorecardresearch.com',
  'comscore.com',
  'nielsen.com',
  'demdex.net',
  'bluekai.com',
  'krxd.net',
  'exelator.com',
  'mathtag.com',
  'rlcdn.com',
  'tapad.com',
  'adobe.com',
  'omtrdc.net',
  '2o7.net',
  'everesttech.net',
  'facebook.com/tr',
  'connect.facebook.net',
  'pixel.facebook.com',
  'twitter.com/i/adsct',
  'analytics.twitter.com',
  'linkedin.com/px',
  'snap.licdn.com',
  'pinterest.com/ct',
  'ct.pinterest.com',
  'bat.bing.com',
  'clarity.ms',
  'yandex.ru/metrika',
  'mc.yandex.ru'
]);

const { isTrackerFromFilterList } = require('./filterLists');
const { recordBlocked } = require('./privacyStatsService');

function isTrackerUrl(url) {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace(/^www\./, '');

    for (const domain of TRACKER_DOMAINS) {
      if (hostname === domain || hostname.endsWith('.' + domain)) {
        return true;
      }
    }
    return isTrackerFromFilterList(url);
  } catch {
    return false;
  }
}

function recordBlockedTracker(domain, requestId, resourceType) {
  recordBlocked({ requestId, domain, type: 'tracker', resourceType });
}

let trackerBlockerEnabled = true;

function setupTrackerBlocker(sess) {
  sess.webRequest.onBeforeRequest({ urls: ['<all_urls>'] }, (details, callback) => {
    if (!trackerBlockerEnabled || details.resourceType === 'mainFrame') {
      callback({ cancel: false });
      return;
    }
    if (isTrackerUrl(details.url)) {
      try {
        const hostname = new URL(details.url).hostname;
        recordBlockedTracker(hostname, details.id, details.resourceType);
      } catch {}
      callback({ cancel: true });
    } else {
      callback({ cancel: false });
    }
  });
}

function setTrackerBlockerEnabled(enabled) {
  trackerBlockerEnabled = enabled;
}

function isTrackerBlockerEnabled() {
  return trackerBlockerEnabled;
}

function getTrackerStats() {
  const { getPrivacyStats } = require('./privacyStatsService');
  const stats = getPrivacyStats();
  return {
    totalBlocked: stats.totalBlocked,
    trackersBlocked: stats.trackersBlocked,
    adsBlocked: stats.adsBlocked,
    bytesSaved: stats.bytesSaved,
    bandwidthSaved: stats.bandwidthSaved,
    trackers: stats.trackers
  };
}

module.exports = {
  setupTrackerBlocker,
  setTrackerBlockerEnabled,
  isTrackerBlockerEnabled,
  isTrackerUrl,
  getTrackerStats,
  TRACKER_DOMAINS
};
