const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const { getDatabase } = require('../database');
const cloudClient = require('./cloudClient');

function deriveKey(passphrase, salt) {
  return crypto.scryptSync(passphrase, salt, 32);
}

function encryptBundle(data, passphrase) {
  const salt = crypto.randomBytes(16);
  const key = deriveKey(passphrase, salt);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const json = JSON.stringify(data);
  const encrypted = Buffer.concat([cipher.update(json, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
}

function decryptBundle(encoded, passphrase) {
  const buf = Buffer.from(encoded, 'base64');
  const salt = buf.subarray(0, 16);
  const iv = buf.subarray(16, 28);
  const tag = buf.subarray(28, 44);
  const encrypted = buf.subarray(44);
  const key = deriveKey(passphrase, salt);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const json = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  return JSON.parse(json);
}

function collectSyncData(tabs, activeTabId) {
  const db = getDatabase();
  const Store = require('electron-store');
  const settingsStore = new Store({ name: 'nova-settings' });

  let aiConversations = [];
  try {
    aiConversations = db.prepare('SELECT id, title, messages_json, updated_at FROM ai_conversations ORDER BY updated_at DESC LIMIT 50').all()
      .map((c) => ({ id: c.id, title: c.title, messages: JSON.parse(c.messages_json || '[]'), updated_at: c.updated_at }));
  } catch {}

  return {
    version: 2,
    exportedAt: Date.now(),
    bookmarks: db.prepare('SELECT * FROM bookmarks').all(),
    history: db.prepare('SELECT * FROM history ORDER BY last_visit DESC LIMIT 500').all(),
    passwords: db.prepare('SELECT id, origin, username, password_encrypted, created_at FROM passwords').all(),
    settings: settingsStore.store,
    siteSettings: db.prepare('SELECT * FROM site_settings').all(),
    addresses: db.prepare('SELECT * FROM autofill_addresses').all(),
    aiConversations,
    tabs: tabs || [],
    activeTabId: activeTabId || null
  };
}

function applySyncData(data) {
  const db = getDatabase();
  const Store = require('electron-store');
  const settingsStore = new Store({ name: 'nova-settings' });
  let count = 0;

  if (data.bookmarks?.length) {
    const stmt = db.prepare(`INSERT OR REPLACE INTO bookmarks (id, title, url, favicon, folder, created_at, updated_at) VALUES (@id, @title, @url, @favicon, @folder, @created_at, @updated_at)`);
    data.bookmarks.forEach((b) => { stmt.run({ ...b, id: b.id || b.client_id, created_at: b.created_at || Date.now(), updated_at: b.updated_at || Date.now() }); count++; });
  }
  if (data.history?.length) {
    const stmt = db.prepare(`INSERT OR REPLACE INTO history (id, title, url, favicon, visit_count, last_visit, created_at) VALUES (@id, @title, @url, @favicon, @visit_count, @last_visit, @created_at)`);
    data.history.forEach((h) => { stmt.run({ ...h, id: h.id || h.client_id, created_at: h.created_at || Date.now() }); count++; });
  }
  if (data.passwords?.length) {
    const stmt = db.prepare(`INSERT OR REPLACE INTO passwords (id, origin, username, password_encrypted, created_at, updated_at) VALUES (@id, @origin, @username, @password_encrypted, @created_at, @updated_at)`);
    data.passwords.forEach((p) => { stmt.run({ ...p, id: p.id || p.client_id, created_at: p.created_at || Date.now(), updated_at: p.updated_at || Date.now() }); count++; });
  }
  if (data.settings) {
    for (const [k, v] of Object.entries(data.settings)) settingsStore.set(k, v);
    count++;
  }
  if (data.siteSettings?.length) {
    const stmt = db.prepare(`INSERT OR REPLACE INTO site_settings (origin, ads_enabled, trackers_enabled, fingerprint_enabled, https_only, updated_at) VALUES (@origin, @ads_enabled, @trackers_enabled, @fingerprint_enabled, @https_only, @updated_at)`);
    data.siteSettings.forEach((s) => stmt.run(s));
    count += data.siteSettings.length;
  }
  if (data.addresses?.length) {
    const stmt = db.prepare(`INSERT OR REPLACE INTO autofill_addresses (id, label, name, line1, line2, city, state, zip, country, phone, email, created_at) VALUES (@id, @label, @name, @line1, @line2, @city, @state, @zip, @country, @phone, @email, @created_at)`);
    data.addresses.forEach((a) => stmt.run(a));
    count += data.addresses.length;
  }
  if (data.aiConversations?.length) {
    const stmt = db.prepare(`INSERT OR REPLACE INTO ai_conversations (id, title, messages_json, created_at, updated_at) VALUES (@id, @title, @messages_json, @created_at, @updated_at)`);
    data.aiConversations.forEach((c) => {
      stmt.run({ id: c.id, title: c.title, messages_json: JSON.stringify(c.messages || []), created_at: c.created_at || Date.now(), updated_at: c.updated_at || Date.now() });
      count++;
    });
  }

  db.prepare(`INSERT INTO sync_log (device_name, synced_at, items_count) VALUES (?, ?, ?)`).run('nova-cloud', Date.now(), count);
  return { success: true, items: count, tabs: data.tabs, activeTabId: data.activeTabId };
}

function exportSync(passphrase, filePath) {
  const bundle = encryptBundle(collectSyncData(), passphrase);
  const target = filePath || path.join(app.getPath('documents'), `nova-sync-${Date.now()}.novasync`);
  fs.writeFileSync(target, bundle, 'utf8');
  return { path: target };
}

function importSync(passphrase, filePath) {
  const bundle = fs.readFileSync(filePath, 'utf8');
  const data = decryptBundle(bundle, passphrase);
  return applySyncData(data);
}

async function cloudPush(tabs, activeTabId) {
  const data = collectSyncData(tabs, activeTabId);
  const session = cloudClient.getSession();
  if (!session.accessToken) return { error: 'Not signed in to Nova Cloud' };
  const result = await cloudClient.syncPush(data);
  if (result.success) {
    applySyncData({ ...data });
  }
  return result;
}

async function cloudPull() {
  const session = cloudClient.getSession();
  if (!session.accessToken) return { error: 'Not signed in to Nova Cloud' };
  const result = await cloudClient.syncPull();
  if (result.success && result.data) {
    const applied = applySyncData(result.data);
    return {
      ...result,
      ...applied,
      tabs: result.data.tabs,
      activeTabId: result.data.activeTabId
    };
  }
  return result;
}

async function cloudStatus() {
  return cloudClient.syncStatus();
}

module.exports = {
  exportSync,
  importSync,
  collectSyncData,
  applySyncData,
  encryptBundle,
  decryptBundle,
  cloudPush,
  cloudPull,
  cloudStatus
};
