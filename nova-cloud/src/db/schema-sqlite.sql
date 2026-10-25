-- Nova Cloud SQLite Schema (local dev — no Docker/PostgreSQL required)

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  email_verified INTEGER NOT NULL DEFAULT 0,
  verification_token TEXT,
  verification_expires TEXT,
  reset_token TEXT,
  reset_expires TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  device_id TEXT,
  device_name TEXT,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS devices (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_name TEXT NOT NULL,
  device_type TEXT NOT NULL DEFAULT 'desktop',
  platform TEXT,
  app_version TEXT,
  last_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, device_name)
);

CREATE TABLE IF NOT EXISTS sync_snapshots (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id TEXT REFERENCES devices(id) ON DELETE SET NULL,
  version INTEGER NOT NULL DEFAULT 1,
  encrypted_blob TEXT,
  checksum TEXT,
  item_counts TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bookmarks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id TEXT,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  favicon TEXT,
  folder TEXT DEFAULT 'default',
  sort_order INTEGER DEFAULT 0,
  deleted_at TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, client_id)
);

CREATE TABLE IF NOT EXISTS history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id TEXT,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  favicon TEXT,
  visit_count INTEGER DEFAULT 1,
  last_visit TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, url)
);

CREATE TABLE IF NOT EXISTS passwords (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id TEXT,
  origin TEXT NOT NULL,
  username TEXT NOT NULL,
  password_encrypted TEXT NOT NULL,
  last_used TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, origin, username)
);

CREATE TABLE IF NOT EXISTS user_settings (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  settings TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ai_conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id TEXT,
  title TEXT NOT NULL,
  messages TEXT NOT NULL DEFAULT '[]',
  provider TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, client_id)
);

CREATE TABLE IF NOT EXISTS open_tabs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id TEXT REFERENCES devices(id) ON DELETE CASCADE,
  tabs TEXT NOT NULL DEFAULT '[]',
  active_tab_id TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, device_id)
);

CREATE TABLE IF NOT EXISTS search_cache (
  id TEXT PRIMARY KEY,
  query_hash TEXT NOT NULL,
  query TEXT NOT NULL,
  search_type TEXT DEFAULT 'all',
  results TEXT NOT NULL,
  hit_count INTEGER DEFAULT 1,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(query_hash, search_type)
);

CREATE TABLE IF NOT EXISTS trending_searches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  query TEXT NOT NULL,
  search_count INTEGER DEFAULT 1,
  region TEXT DEFAULT 'global',
  period TEXT DEFAULT 'daily',
  recorded_at TEXT NOT NULL DEFAULT (date('now')),
  UNIQUE(query, region, period, recorded_at)
);

CREATE TABLE IF NOT EXISTS search_analytics (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  query TEXT NOT NULL,
  search_type TEXT,
  result_count INTEGER,
  latency_ms INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS extension_catalog (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  version TEXT NOT NULL,
  author TEXT,
  icon_url TEXT,
  download_url TEXT,
  manifest TEXT,
  category TEXT DEFAULT 'productivity',
  install_count INTEGER DEFAULT 0,
  is_featured INTEGER DEFAULT 0,
  is_published INTEGER DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS user_extensions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  extension_id TEXT NOT NULL REFERENCES extension_catalog(id) ON DELETE CASCADE,
  enabled INTEGER DEFAULT 1,
  installed_version TEXT,
  installed_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, extension_id)
);

CREATE TABLE IF NOT EXISTS analytics_events (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_data TEXT DEFAULT '{}',
  app_version TEXT,
  platform TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS crash_reports (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  error_message TEXT,
  stack_trace TEXT,
  app_version TEXT,
  platform TEXT,
  os_version TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS feedback (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  email TEXT,
  category TEXT DEFAULT 'general',
  message TEXT NOT NULL,
  rating INTEGER,
  app_version TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_history_user ON history(user_id, last_visit);
CREATE INDEX IF NOT EXISTS idx_passwords_user ON passwords(user_id);
CREATE INDEX IF NOT EXISTS idx_search_cache_hash ON search_cache(query_hash, search_type);
CREATE INDEX IF NOT EXISTS idx_search_analytics_created ON search_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);

CREATE TABLE IF NOT EXISTS search_index (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL UNIQUE,
  title TEXT,
  snippet TEXT,
  keywords TEXT,
  crawled_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_search_index_keywords ON search_index(keywords);

CREATE TABLE IF NOT EXISTS drive_files (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  size_bytes INTEGER DEFAULT 0,
  mime_type TEXT,
  storage_path TEXT NOT NULL,
  deleted_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS mail_aliases (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  alias TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS mail_messages (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  from_addr TEXT NOT NULL,
  to_addr TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  is_read INTEGER DEFAULT 0,
  folder TEXT DEFAULT 'inbox',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_mail_messages_user ON mail_messages(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_drive_files_user ON drive_files(user_id);
