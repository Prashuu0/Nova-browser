# Nova Ecosystem — Architecture & Roadmap

> **Goal:** Transform Nova Browser from prototype → launch-ready product for 100 public beta users.

---

## Ecosystem Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     NOVA ECOSYSTEM v2.0                      │
├──────────────┬──────────────────┬───────────────────────────┤
│ Nova Browser │   Nova Cloud     │      Nova Mobile          │
│  (Electron)  │  (Express+PG)    │   (React Native)          │
├──────────────┼──────────────────┼───────────────────────────┤
│ SQLite local │ PostgreSQL cloud │ AsyncStorage              │
│ Webview      │ JWT Auth         │ Nova Cloud API            │
│ Nova Search  │ WebSocket Sync   │ Nova Search               │
│ Nova AI Pro  │ Search API Cache │ Bookmarks + Sync          │
│ Nova Store   │ Extension Catalog│ Nova AI (beta)            │
└──────────────┴──────────────────┴───────────────────────────┘
```

---

## What's NEW in v2.0 (This Release)

### Nova Cloud Backend (`nova-cloud/`)
| Feature | Status |
|---------|--------|
| User Registration | ✅ |
| Login + JWT | ✅ |
| Refresh tokens + sessions | ✅ |
| Email verification | ✅ |
| Password reset | ✅ |
| PostgreSQL schema | ✅ |
| Cloud sync push/pull | ✅ |
| WebSocket real-time sync | ✅ |
| Search API + caching | ✅ |
| Trending searches | ✅ |
| Search analytics | ✅ |
| Extension catalog (Nova Store) | ✅ |
| Crash reports | ✅ |
| Feedback system | ✅ |
| Analytics dashboard API | ✅ |
| Docker deployment | ✅ |

### Desktop Integration
| Feature | Status |
|---------|--------|
| cloudClient.js | ✅ |
| Cloud auth (fallback local) | ✅ |
| Cloud sync push/pull | ✅ |
| Nova Hub redesign | ✅ |
| Nova Store UI | ✅ |
| Nova AI Pro modes | ✅ |
| Feedback in Nova Hub | ✅ |
| Crash auto-report | ✅ |
| Legal pages | ✅ |
| Search via Nova Cloud API | ✅ |

### Nova Mobile (`nova-mobile/`)
| Feature | Status |
|---------|--------|
| React Native scaffold | ✅ |
| Home, Search, Bookmarks, AI, Account screens | ✅ |
| Nova Cloud API client | ✅ |
| Sync pull | ✅ |

---

## Folder Structure

```
Nova Browser/
├── nova-cloud/           # ☁️ Nova Cloud Backend
│   ├── src/
│   │   ├── index.js
│   │   ├── config.js
│   │   ├── db/schema.sql
│   │   ├── routes/       # auth, sync, search, extensions, feedback
│   │   ├── services/     # email, websocket
│   │   └── middleware/
│   ├── docker-compose.yml
│   └── package.json
├── nova-mobile/          # 📱 React Native app
├── src/                  # 🖥️ Electron desktop (unchanged core)
│   ├── main/services/cloudClient.js  # NEW
│   └── renderer/components/NovaHub/  # UPDATED
└── docs/
    ├── NOVA_ECOSYSTEM.md  # This file
    ├── DEPLOYMENT.md
    ├── API.md
    └── NOVA_BROWSER_SAB_KUCH.md
```

---

## Database Architecture

### Desktop (SQLite) — Local
- bookmarks, history, passwords, sessions, ai_conversations, extensions

### Cloud (PostgreSQL) — Nova Cloud
- users, refresh_tokens, devices
- bookmarks, history, passwords, user_settings, ai_conversations, open_tabs
- search_cache, trending_searches, search_analytics
- extension_catalog, user_extensions
- crash_reports, feedback, analytics_events, sync_snapshots

---

## Sync Flow

```
Desktop                    Nova Cloud                 Mobile
   │                           │                        │
   │── POST /api/sync/push ───►│                        │
   │                           │── PostgreSQL save      │
   │                           │                        │
   │◄── WebSocket notify ──────│                        │
   │                           │◄── GET /api/sync/pull ─│
   │                           │── data ───────────────►│
```

**Synced data:** bookmarks, history, passwords, settings, AI chats, open tabs

---

## Nova Search Evolution

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1 | ✅ Done | DDG backend + Nova UI |
| Phase 2 | ✅ Done | Nova Search API layer + Redis-ready cache in PG |
| Phase 3 | 🔜 Future | Own crawler (Python) |
| Phase 4 | 🔜 Future | Own index (OpenSearch) |
| Phase 5 | 🔜 Future | Nova ranking algorithm |

---

## Nova AI Evolution

| Phase | Status |
|-------|--------|
| Gemini/OpenAI/Ollama client | ✅ |
| Nova AI Pro (Research, Explain, Rewrite, PDF, YouTube) | ✅ |
| Own fine-tuned model | 🔜 Future |
| Nova inference server | 🔜 Future |

---

## Beta Launch Checklist (100 Users)

- [x] Nova Cloud backend deployable
- [x] Account registration + login
- [x] Cloud sync working
- [x] Search API with cache
- [x] Extension store catalog
- [x] Crash reporting
- [x] Feedback form
- [x] Privacy policy + Terms
- [x] Windows installer (existing electron-builder)
- [x] Auto-update (existing electron-updater)
- [ ] Deploy Nova Cloud to production server
- [ ] SSL + domain (api.novabrowser.app)
- [ ] SMTP for email verification
- [ ] Mobile app store build

---

## Implementation Order (Completed)

1. ✅ Nova Browser (desktop)
2. ✅ Nova Cloud (this release)
3. ✅ Nova Accounts + JWT
4. ✅ Nova Sync
5. ✅ Nova Mobile scaffold
6. ✅ Nova Search API layer
7. 🔜 Nova AI Platform (own model)
8. 🔜 Nova Extensions Store (full MV3)

---

## What We Did NOT Rebuild

- Multi-tab browsing
- Nova Search UI
- Ad/tracker blocking
- Password manager UI
- Downloads, bookmarks, history panels
- Incognito mode
- Privacy dashboard

All existing features preserved. Only **production-level additions** layered on top.
