const { BrowserWindow } = require('electron');
const { getDatabase } = require('../database');

const recentRequestIds = new Set();

const BYTES_BY_TYPE = {
  script: 48000,
  image: 28000,
  stylesheet: 18000,
  xhr: 14000,
  fetch: 14000,
  media: 120000,
  font: 35000,
  subFrame: 8000,
  ping: 500,
  other: 22000
};

function estimateBytes(resourceType) {
  return BYTES_BY_TYPE[resourceType] || BYTES_BY_TYPE.other;
}

function formatBandwidth(bytes) {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

function broadcastStats() {
  const stats = getPrivacyStats();
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      win.webContents.send('privacy:stats-updated', stats);
    }
  }
  return stats;
}

function recordBlocked({ requestId, domain, type, resourceType }) {
  if (!domain) return;
  if (requestId != null) {
    const key = String(requestId);
    if (recentRequestIds.has(key)) return;
    recentRequestIds.add(key);
    setTimeout(() => recentRequestIds.delete(key), 8000);
  }

  try {
    const db = getDatabase();
    const now = Date.now();
    const bytes = estimateBytes(resourceType);
    const table = type === 'ad' ? 'blocked_ads' : 'blocked_trackers';

    db.prepare(`
      INSERT INTO ${table} (domain, blocked_count, last_blocked)
      VALUES (?, 1, ?)
      ON CONFLICT(domain) DO UPDATE SET
        blocked_count = blocked_count + 1,
        last_blocked = ?
    `).run(domain, now, now);

    db.prepare(`
      INSERT INTO privacy_bandwidth (id, bytes_saved) VALUES (1, ?)
      ON CONFLICT(id) DO UPDATE SET bytes_saved = bytes_saved + ?
    `).run(bytes, bytes);

    broadcastStats();
  } catch (err) {
    console.error('[Nova] Failed to record blocked resource:', err.message);
  }
}

function getPrivacyStats() {
  try {
    const db = getDatabase();
    const trackers = db.prepare('SELECT SUM(blocked_count) as total FROM blocked_trackers').get();
    const ads = db.prepare('SELECT SUM(blocked_count) as total FROM blocked_ads').get();
    const bandwidth = db.prepare('SELECT bytes_saved FROM privacy_bandwidth WHERE id = 1').get();
    const recentTrackers = db.prepare(
      'SELECT domain, blocked_count, last_blocked FROM blocked_trackers ORDER BY blocked_count DESC LIMIT 50'
    ).all();
    const recentAds = db.prepare(
      'SELECT domain, blocked_count, last_blocked FROM blocked_ads ORDER BY blocked_count DESC LIMIT 50'
    ).all();

    const trackersBlocked = trackers?.total || 0;
    const adsBlocked = ads?.total || 0;
    const bytesSaved = bandwidth?.bytes_saved || 0;

    return {
      totalBlocked: trackersBlocked + adsBlocked,
      trackersBlocked,
      adsBlocked,
      bytesSaved,
      bandwidthSaved: formatBandwidth(bytesSaved),
      trackers: recentTrackers,
      ads: recentAds
    };
  } catch {
    return {
      totalBlocked: 0,
      trackersBlocked: 0,
      adsBlocked: 0,
      bytesSaved: 0,
      bandwidthSaved: '0 B',
      trackers: [],
      ads: []
    };
  }
}

module.exports = {
  recordBlocked,
  getPrivacyStats,
  broadcastStats,
  formatBandwidth
};
