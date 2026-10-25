-- Nova Cloud PostgreSQL Schema
-- Run via: npm run migrate  OR  docker-compose up

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Users & Auth ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(120),
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verification_token VARCHAR(64),
  verification_expires TIMESTAMPTZ,
  reset_token VARCHAR(64),
  reset_expires TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  device_id UUID,
  device_name VARCHAR(120),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_name VARCHAR(120) NOT NULL,
  device_type VARCHAR(32) NOT NULL DEFAULT 'desktop',
  platform VARCHAR(64),
  app_version VARCHAR(32),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, device_name)
);

-- ─── Sync Data (encrypted blobs + structured) ───────────────
CREATE TABLE IF NOT EXISTS sync_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
  version INTEGER NOT NULL DEFAULT 1,
  encrypted_blob TEXT,
  checksum VARCHAR(64),
  item_counts JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id VARCHAR(64),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  favicon TEXT,
  folder VARCHAR(120) DEFAULT 'default',
  sort_order INTEGER DEFAULT 0,
  deleted_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, client_id)
);

CREATE TABLE IF NOT EXISTS history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id VARCHAR(64),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  favicon TEXT,
  visit_count INTEGER DEFAULT 1,
  last_visit TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, url)
);

CREATE TABLE IF NOT EXISTS passwords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id VARCHAR(64),
  origin TEXT NOT NULL,
  username TEXT NOT NULL,
  password_encrypted TEXT NOT NULL,
  last_used TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, origin, username)
);

CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  settings JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id VARCHAR(64),
  title TEXT NOT NULL,
  messages JSONB NOT NULL DEFAULT '[]',
  provider VARCHAR(32),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS open_tabs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
  tabs JSONB NOT NULL DEFAULT '[]',
  active_tab_id VARCHAR(64),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Nova Search API Layer ───────────────────────────────────
CREATE TABLE IF NOT EXISTS search_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_hash VARCHAR(64) NOT NULL,
  query TEXT NOT NULL,
  search_type VARCHAR(32) DEFAULT 'all',
  results JSONB NOT NULL,
  hit_count INTEGER DEFAULT 1,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(query_hash, search_type)
);

CREATE TABLE IF NOT EXISTS trending_searches (
  id SERIAL PRIMARY KEY,
  query TEXT NOT NULL,
  search_count INTEGER DEFAULT 1,
  region VARCHAR(8) DEFAULT 'global',
  period VARCHAR(16) DEFAULT 'daily',
  recorded_at DATE NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE(query, region, period, recorded_at)
);

CREATE TABLE IF NOT EXISTS search_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  query TEXT NOT NULL,
  search_type VARCHAR(32),
  result_count INTEGER,
  latency_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Extensions Store ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS extension_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  description TEXT,
  version VARCHAR(32) NOT NULL,
  author VARCHAR(120),
  icon_url TEXT,
  download_url TEXT,
  manifest JSONB,
  category VARCHAR(64) DEFAULT 'productivity',
  install_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_extensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  extension_id UUID NOT NULL REFERENCES extension_catalog(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT TRUE,
  installed_version VARCHAR(32),
  installed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, extension_id)
);

-- ─── Analytics, Feedback, Crashes ────────────────────────────
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type VARCHAR(64) NOT NULL,
  event_data JSONB DEFAULT '{}',
  app_version VARCHAR(32),
  platform VARCHAR(32),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crash_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  error_message TEXT,
  stack_trace TEXT,
  app_version VARCHAR(32),
  platform VARCHAR(32),
  os_version VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  email VARCHAR(255),
  category VARCHAR(64) DEFAULT 'general',
  message TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  app_version VARCHAR(32),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Indexes ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_history_user ON history(user_id, last_visit DESC);
CREATE INDEX IF NOT EXISTS idx_passwords_user ON passwords(user_id);
CREATE INDEX IF NOT EXISTS idx_search_cache_hash ON search_cache(query_hash, search_type);
CREATE INDEX IF NOT EXISTS idx_search_analytics_created ON search_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
