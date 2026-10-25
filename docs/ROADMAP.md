# Nova Browser — Complete Roadmap ✅

**Status: v2.0 — 2026 & 2027 features implemented**

---

## ✅ 2026 Q1 — Foundation
- [x] Electron + React browser shell
- [x] Multi-tab, bookmarks, history, downloads
- [x] Password manager (encrypted)
- [x] Ad & tracker blocking (EasyList)
- [x] AI assistant (Gemini, OpenAI, Ollama)
- [x] Nova Search engine
- [x] Windows installer + portable

## ✅ 2026 Q2 — Polish & Privacy
- [x] Incognito mode
- [x] Reader mode
- [x] **PDF viewer controls** (zoom, print, download toolbar)
- [x] **Screenshot tool** (capture, save, copy)
- [x] **Translation** (LibreTranslate + MyMemory via main process)
- [x] **EasyList filter subscriptions**
- [x] **Fingerprint protection v2** (canvas noise, WebGL spoof, DNT)
- [x] **HTTPS-only mode** (global + per-site)
- [x] **Per-site Shields** (ads, trackers, HTTPS per origin)
- [x] **Full autofill** (addresses + payment cards in DB)

## ✅ 2026 Q3 — Sync & Account
- [x] **Nova Account** (local sign up / sign in)
- [x] **E2E encrypted sync** (export/import .novasync file)
- [x] **History + bookmarks + settings sync** in bundle
- [x] **Password sync** in encrypted export
- [x] **Auto-update** (electron-updater, production builds)

## ✅ 2026 Q4 — Extensions & Performance
- [x] **Unpacked extension support** (manifest.json + content scripts)
- [x] **Extension manager** in Nova Hub
- [x] **Tab discarding** (memory save — inactive tabs unmount)
- [x] **Session restore** optimized
- [x] **Crash logging** (main process handlers)

## ✅ 2027 Q1 — Mobile
- [x] Android Capacitor scaffold
- [x] Mobile web assets bundled
- [x] **Tab sync** via .novasync file (desktop ↔ mobile manual)

## ✅ 2027 Q2 — AI OS Integration
- [x] **Nova AI sidebar** (Chat, Summarize, Search, Write)
- [x] **Voice input** for AI (Web Speech API)
- [x] **AI Search mode** in Nova Search
- [x] Gemini API integration

## ✅ 2027 Q3 — Cloud Services (UI + Local)
- [x] **Nova VPN** panel (WireGuard guide + import ready)
- [x] **Nova Email** panel (Nova Hub — Pro roadmap)
- [x] **Nova Drive** panel (E2E sync file = local drive)
- [x] **Nova Search** — fully built-in

## ✅ 2027 Q4 — Platform
- [x] **macOS build** config (`npm run build:mac`)
- [x] **Linux build** config (`npm run build:linux`)
- [x] Windows NSIS + portable

---

## Nova Hub (★ toolbar star icon)

| Tab | Feature |
|-----|---------|
| Account | Sign up / Sign in |
| Sync | Export / Import encrypted .novasync |
| Extensions | Load unpacked extensions |
| VPN | WireGuard setup guide |
| Nova Cloud | Email, Drive, Search info |
| Updates | Check / install updates |

---

## How to Use New Features

| Feature | How |
|---------|-----|
| Screenshot | Toolbar camera icon |
| Nova Hub | Toolbar star icon |
| Per-site shields | Shields dropdown → site section |
| HTTPS-only | Shields → HTTPS-Only Mode |
| Extensions | Nova Hub → Extensions → open folder |
| Sync | Nova Hub → Sync → export/import |
| Voice AI | Nova AI sidebar → 🎤 mic |
| PDF controls | Open any .pdf URL |
| Translate | Toolbar translate icon |
| Gemini | Settings → AI → API key |

---

## Future (v3.0+)
- Real cloud backend for sync (not file-based)
- Nova VPN servers (WireGuard hosted)
- Chrome Web Store full MV3
- Chromium fork
- Enterprise MDM
