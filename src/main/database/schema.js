const SCHEMA = `
CREATE TABLE IF NOT EXISTS bookmarks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  favicon TEXT,
  folder TEXT DEFAULT 'default',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS history (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  favicon TEXT,
  visit_count INTEGER DEFAULT 1,
  last_visit INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_history_url ON history(url);
CREATE INDEX IF NOT EXISTS idx_history_last_visit ON history(last_visit DESC);

CREATE TABLE IF NOT EXISTS downloads (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  path TEXT,
  size INTEGER DEFAULT 0,
  received_bytes INTEGER DEFAULT 0,
  state TEXT DEFAULT 'progressing',
  mime_type TEXT,
  start_time INTEGER NOT NULL,
  end_time INTEGER,
  error TEXT
);

CREATE TABLE IF NOT EXISTS passwords (
  id TEXT PRIMARY KEY,
  origin TEXT NOT NULL,
  username TEXT NOT NULL,
  password_encrypted TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  last_used INTEGER
);

CREATE INDEX IF NOT EXISTS idx_passwords_origin ON passwords(origin);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  window_id TEXT NOT NULL,
  tabs_json TEXT NOT NULL,
  active_tab_id TEXT,
  is_incognito INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS ai_conversations (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  messages_json TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS blocked_trackers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  domain TEXT NOT NULL UNIQUE,
  category TEXT,
  blocked_count INTEGER DEFAULT 0,
  last_blocked INTEGER
);

CREATE TABLE IF NOT EXISTS blocked_ads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  domain TEXT NOT NULL UNIQUE,
  blocked_count INTEGER DEFAULT 0,
  last_blocked INTEGER
);

CREATE TABLE IF NOT EXISTS privacy_bandwidth (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  bytes_saved INTEGER DEFAULT 0
);

INSERT OR IGNORE INTO privacy_bandwidth (id, bytes_saved) VALUES (1, 0);

CREATE TABLE IF NOT EXISTS site_settings (
  origin TEXT PRIMARY KEY,
  ads_enabled INTEGER DEFAULT 1,
  trackers_enabled INTEGER DEFAULT 1,
  fingerprint_enabled INTEGER DEFAULT 1,
  https_only INTEGER DEFAULT 0,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS autofill_addresses (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  name TEXT,
  line1 TEXT,
  line2 TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  country TEXT DEFAULT 'IN',
  phone TEXT,
  email TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS autofill_cards (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  name_on_card TEXT,
  number_encrypted TEXT NOT NULL,
  expiry_month TEXT,
  expiry_year TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS nova_account (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  sync_token TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sync_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_name TEXT,
  synced_at INTEGER NOT NULL,
  items_count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS extensions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  version TEXT,
  enabled INTEGER DEFAULT 1,
  path TEXT NOT NULL,
  manifest_json TEXT,
  installed_at INTEGER NOT NULL
);
`;

module.exports = { SCHEMA };
