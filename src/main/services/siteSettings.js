const { getDatabase } = require('../database');

function getOrigin(url) {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

function getSiteSettings(origin) {
  if (!origin) return null;
  const db = getDatabase();
  const row = db.prepare('SELECT * FROM site_settings WHERE origin = ?').get(origin);
  if (!row) {
    return { origin, adsEnabled: true, trackersEnabled: true, fingerprintEnabled: true, httpsOnly: false };
  }
  return {
    origin: row.origin,
    adsEnabled: !!row.ads_enabled,
    trackersEnabled: !!row.trackers_enabled,
    fingerprintEnabled: !!row.fingerprint_enabled,
    httpsOnly: !!row.https_only
  };
}

function setSiteSettings(origin, settings) {
  const db = getDatabase();
  const now = Date.now();
  db.prepare(`
    INSERT OR REPLACE INTO site_settings (origin, ads_enabled, trackers_enabled, fingerprint_enabled, https_only, updated_at)
    VALUES (@origin, @ads_enabled, @trackers_enabled, @fingerprint_enabled, @https_only, @updated_at)
  `).run({
    origin,
    ads_enabled: settings.adsEnabled !== false ? 1 : 0,
    trackers_enabled: settings.trackersEnabled !== false ? 1 : 0,
    fingerprint_enabled: settings.fingerprintEnabled !== false ? 1 : 0,
    https_only: settings.httpsOnly ? 1 : 0,
    updated_at: now
  });
  return getSiteSettings(origin);
}

function getAllSiteSettings() {
  const db = getDatabase();
  return db.prepare('SELECT * FROM site_settings ORDER BY updated_at DESC').all().map((row) => ({
    origin: row.origin,
    adsEnabled: !!row.ads_enabled,
    trackersEnabled: !!row.trackers_enabled,
    fingerprintEnabled: !!row.fingerprint_enabled,
    httpsOnly: !!row.https_only
  }));
}

function shouldBlockForSite(url, type) {
  const origin = getOrigin(url);
  if (!origin) return true;
  const settings = getSiteSettings(origin);
  if (type === 'ad') return settings.adsEnabled;
  if (type === 'tracker') return settings.trackersEnabled;
  return true;
}

module.exports = { getSiteSettings, setSiteSettings, getAllSiteSettings, shouldBlockForSite, getOrigin };
