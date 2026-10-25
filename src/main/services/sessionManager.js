const { session } = require('electron');
const Store = require('electron-store');

const NOVA_PARTITION = 'persist:nova';
const INCOGNITO_PARTITION = 'nova-private';
const settingsStore = new Store({ name: 'nova-settings' });

let novaSession = null;
let incognitoSession = null;

function getNovaSession() {
  if (!novaSession) {
    novaSession = session.fromPartition(NOVA_PARTITION);
  }
  return novaSession;
}

function getIncognitoSession() {
  if (!incognitoSession) {
    incognitoSession = session.fromPartition(INCOGNITO_PARTITION);
  }
  return incognitoSession;
}

function getSessionForPartition(partition) {
  if (partition === INCOGNITO_PARTITION || partition === 'incognito') {
    return getIncognitoSession();
  }
  return getNovaSession();
}

function setupHttpsUpgrade(sess) {
  sess.webRequest.onBeforeRequest({ urls: ['http://*/*'] }, (details, callback) => {
    const strictHttps = settingsStore.get('httpsOnlyMode', false);
    const resourceType = details.resourceType;

    if (strictHttps) {
      try {
        const httpsUrl = details.url.replace(/^http:/i, 'https:');
        callback({ redirectURL: httpsUrl });
      } catch {
        callback({ cancel: true });
      }
      return;
    }

    if (resourceType !== 'mainFrame') {
      callback({ cancel: false });
      return;
    }
    try {
      const httpsUrl = details.url.replace(/^http:/i, 'https:');
      callback({ redirectURL: httpsUrl });
    } catch {
      callback({ cancel: false });
    }
  });

  sess.webRequest.onBeforeRequest({ urls: ['http://*/*'] }, (details, callback) => {
    try {
      const { getSiteSettings } = require('./siteSettings');
      const origin = new URL(details.url).origin;
      const site = getSiteSettings(origin);
      if (site.httpsOnly && details.url.startsWith('http:')) {
        callback({ redirectURL: details.url.replace(/^http:/i, 'https:') });
        return;
      }
    } catch {}
    callback({ cancel: false });
  });
}

function setupThirdPartyCookieBlock(sess) {
  sess.webRequest.onHeadersReceived((details, callback) => {
    if (!settingsStore.get('blockThirdPartyCookies', true)) {
      callback({ responseHeaders: details.responseHeaders });
      return;
    }
    try {
      const headers = details.responseHeaders || {};
      if (headers['set-cookie']) {
        const siteOrigin = new URL(details.url).origin;
        headers['set-cookie'] = headers['set-cookie'].map((c) => {
          if (c.toLowerCase().includes('samesite=none')) return c;
          return c;
        });
      }
      callback({ responseHeaders: headers });
    } catch {
      callback({ responseHeaders: details.responseHeaders });
    }
  });
}

function setupDownloadCapture(sess, getMainWindow) {
  sess.on('will-download', (event, item, webContents) => {
    const win = getMainWindow?.();
    if (!win) return;

    const { v4: uuidv4 } = require('uuid');
    const { getDatabase } = require('../database');
    const path = require('path');
    const { app } = require('electron');

    const id = uuidv4();
    const downloadDir = path.join(app.getPath('downloads'), 'Nova Browser');
    const fs = require('fs');
    if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir, { recursive: true });

    const filename = item.getFilename();
    const savePath = path.join(downloadDir, filename);
    item.setSavePath(savePath);

    const db = getDatabase();
    const now = Date.now();
    db.prepare(`
      INSERT INTO downloads (id, filename, url, path, state, start_time)
      VALUES (@id, @filename, @url, @path, 'progressing', @start_time)
    `).run({
      id,
      filename,
      url: item.getURL(),
      path: savePath,
      start_time: now
    });

    item.on('updated', () => {
      db.prepare(`UPDATE downloads SET received_bytes = ?, size = ?, state = ? WHERE id = ?`).run(
        item.getReceivedBytes(),
        item.getTotalBytes(),
        item.isPaused() ? 'paused' : 'progressing',
        id
      );
      win.webContents.send('downloads:progress', {
        id,
        receivedBytes: item.getReceivedBytes(),
        totalBytes: item.getTotalBytes(),
        state: item.isPaused() ? 'paused' : 'progressing'
      });
    });

    item.once('done', (_, state) => {
      db.prepare(`UPDATE downloads SET state = ?, end_time = ? WHERE id = ?`).run(
        state,
        Date.now(),
        id
      );
      win.webContents.send('downloads:complete', { id, state, path: savePath });
    });
  });
}

module.exports = {
  NOVA_PARTITION,
  INCOGNITO_PARTITION,
  getNovaSession,
  getIncognitoSession,
  getSessionForPartition,
  setupHttpsUpgrade,
  setupThirdPartyCookieBlock,
  setupDownloadCapture
};
