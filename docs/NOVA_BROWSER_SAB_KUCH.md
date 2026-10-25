# Nova Browser — Puri Documentation (Sab Kuch Ek Jagah)

> **Version:** 1.0.0 (v2.0 Roadmap)  
> **Platform:** Windows (primary), macOS & Linux build ready  
> **Bana hai:** Electron + React + Redux  
> **Last Updated:** June 2026

---

## 1. Nova Browser Kya Hai?

Nova Browser ek **privacy-focused, AI-powered desktop browser** hai — Brave/Chrome jaisa feel, lekin:

- **Google Search nahi** — sirf **Nova Search** (apna search engine)
- **Built-in Ad & Tracker blocking**
- **Gemini AI** sidebar (Chat, Summarize, Search, Write)
- **Password manager, bookmarks, history, downloads**
- **Incognito mode**
- **Nova Hub** — Account, Sync, Extensions, VPN guide, Updates

Yeh file mein **har cheez** likhi hai — technology, features, files, commands, fixes — kuch bhi chhupa nahi hai.

---

## 2. Kya-Kya Technology Use Hui Hai

| Technology | Version | Kaam |
|------------|---------|------|
| **Electron** | 32.1.2 | Desktop app shell, webview, IPC |
| **React** | 18.3.1 | UI (tabs, toolbar, panels) |
| **Redux Toolkit** | 2.2.7 | State management (tabs, settings, history…) |
| **Vite** | 5.4.8 | Dev server + frontend build |
| **Tailwind CSS** | 3.4.13 | Styling (dark theme, Nova branding) |
| **better-sqlite3** | 11.3.0 | Local database (bookmarks, history, passwords…) |
| **electron-store** | 8.2.0 | Settings JSON store |
| **electron-updater** | 6.3.9 | Auto-update (packaged builds only) |
| **uuid** | 10.0.0 | Unique IDs for tabs, bookmarks, etc. |
| **Jest** | 29.7.0 | Unit tests |
| **Playwright** | 1.47.2 | E2E tests |

**Search backend:** DuckDuckGo HTML/Lite API (privacy-friendly) — results Nova Search UI mein dikhte hain, Google use nahi hota.

**AI providers:**
- **Google Gemini** (default) — `gemini-2.0-flash`, `gemini-2.0-flash-lite`, `gemini-1.5-flash`, `gemini-1.5-pro`
- **OpenAI** — GPT models
- **Ollama** — Local LLM (`llama3`, etc.)

**Translation:** LibreTranslate + MyMemory (main process se)

---

## 3. Project Folder Structure (Har Folder Ka Kaam)

```
Nova Browser/
├── src/
│   ├── main/                    # Electron main process (backend)
│   │   ├── index.js             # App entry, session setup, IPC register
│   │   ├── windowManager.js     # Windows create/restore, incognito
│   │   ├── database/
│   │   │   ├── index.js         # SQLite init
│   │   │   └── schema.js        # All DB tables
│   │   ├── ipc/                 # IPC handlers (renderer ↔ main)
│   │   │   ├── ai.js
│   │   │   ├── autofill.js
│   │   │   ├── bookmarks.js
│   │   │   ├── browser.js
│   │   │   ├── downloads.js
│   │   │   ├── filters.js
│   │   │   ├── history.js
│   │   │   ├── navigation.js
│   │   │   ├── passwords.js
│   │   │   ├── platform.js      # Account, sync, extensions, update, VPN
│   │   │   ├── privacy.js
│   │   │   ├── search.js
│   │   │   ├── sessions.js
│   │   │   ├── settings.js
│   │   │   ├── siteSettings.js
│   │   │   └── translate.js
│   │   ├── services/            # Business logic
│   │   │   ├── adBlocker.js
│   │   │   ├── aiService.js
│   │   │   ├── accountService.js
│   │   │   ├── extensionManager.js
│   │   │   ├── filterLists.js   # EasyList subscriptions
│   │   │   ├── fingerprintProtection.js
│   │   │   ├── novaSearch.js    # Nova Search engine
│   │   │   ├── sessionManager.js
│   │   │   ├── siteSettings.js
│   │   │   ├── syncService.js
│   │   │   ├── trackerBlocker.js
│   │   │   ├── translateService.js
│   │   │   └── updaterService.js
│   │   └── security/
│   │       └── urlValidator.js
│   ├── preload/
│   │   └── browserPreload.js    # window.novaAPI expose (secure bridge)
│   └── renderer/                # React frontend
│       ├── App.jsx
│       ├── index.jsx
│       ├── components/
│       │   ├── AI/              # Nova AI sidebar
│       │   ├── Bookmarks/       # Bookmark bar + sidebar
│       │   ├── BrowserWindow/   # Main shell, title bar
│       │   ├── Downloads/
│       │   ├── ErrorPage/
│       │   ├── FindInPage/
│       │   ├── History/
│       │   ├── Navigation/      # Back, forward, reload, home
│       │   ├── NewTabPage/
│       │   ├── NovaHub/         # Account, sync, extensions hub
│       │   ├── NovaSearch/      # Nova Search results page
│       │   ├── PasswordManager/
│       │   ├── PasswordSavePrompt/
│       │   ├── PDF/             # PDF toolbar
│       │   ├── Privacy/         # Privacy dashboard
│       │   ├── ReaderMode/
│       │   ├── Screenshot/
│       │   ├── SearchSuggestions/
│       │   ├── Settings/
│       │   ├── Shields/         # Ad/tracker/HTTPS shields
│       │   ├── TabBar/
│       │   ├── TabContent/      # Routes: newtab / search / webview
│       │   ├── Toolbar/
│       │   ├── Translate/
│       │   ├── Update/
│       │   ├── WebView/         # Website loading (webview tag)
│       │   └── common/          # NovaLogo, NovaSearchBar, OfflineBanner
│       ├── hooks/
│       │   └── useKeyboardShortcuts.js
│       ├── store/
│       │   ├── index.js
│       │   └── slices/          # tabs, settings, history, bookmarks, ai, ui, passwords, downloads
│       └── utils/
│           ├── novaUrls.js      # Nova URL system (search.nova, nova://)
│           └── autofillScript.js
├── scripts/
│   ├── build-main.cjs           # Main process compile
│   └── postinstall.cjs
├── dist/                        # Vite build output
├── dist-electron/               # Compiled main + preload
├── docs/
│   ├── ROADMAP.md
│   └── NOVA_BROWSER_SAB_KUCH.md # ← YEH FILE
├── build/                       # App icons
├── package.json
└── vite.config.js
```

---

## 4. Saare Features (Poori List)

### 4.1 Browsing & Tabs
- Multi-tab browsing (unlimited tabs)
- Tab pin, duplicate, close others
- Tab drag & reorder
- Session restore (crash/close ke baad tabs wapas)
- Custom title bar (minimize, maximize, close)
- Incognito / Private window (`Ctrl+Shift+N`)
- Back / Forward (search ↔ website history ke saath)
- Reload, Home button
- Find in page (`Ctrl+F`)
- Zoom in/out/reset (`Ctrl +/-`, `Ctrl+0`)
- Reader mode (`Alt+R`)
- Error page (failed loads ke liye)
- Offline banner

### 4.2 Nova Search (Apna Search Engine — Google Nahi)
- URL scheme: `nova://search?q=query&type=all`
- Address bar display: `https://search.nova/search?q=query`
- Google-style tabs: **AI Mode, All, Shopping, News, Short videos, Forums, Images, More, Tools**
- DuckDuckGo se results fetch (HTML + Lite fallback)
- Image search API
- Search suggestions
- Result link click → website webview mein khulta hai
- Back button → search results wapas

**Search types filter:** shopping, news, videos, forums, images, books, maps, flights

### 4.3 Nova AI Sidebar
- **Chat** — Gemini/OpenAI/Ollama se baat
- **Summarize** — page summarize
- **Search** — AI-powered search help
- **Write** — content likhne mein help
- **Voice input** — mic se bol ke type (`Web Speech API`)
- Conversation save/delete
- Settings se provider + API key

**Default AI:** Google Gemini 2.0 Flash

### 4.4 Privacy & Shields
- **Ad blocker** — domain list + EasyList filter subscriptions
- **Tracker blocker** — 50+ tracker domains + filter lists
- **Fingerprint protection v2** — canvas noise, WebGL spoof, DNT headers
- **HTTPS-only mode** — global setting
- **Third-party cookie block**
- **Per-site Shields** — har website ke liye alag: ads, trackers, HTTPS
- **Privacy Dashboard** — kitne trackers block hue
- Clear cache, cookies, all data
- Do Not Track header

### 4.5 Bookmarks & History
- Bookmark add/remove/update
- Bookmark bar (show/hide setting)
- Bookmark sidebar
- Browsing history with visit count
- History search & clear
- Recent history suggestions

### 4.6 Password Manager
- Encrypted password storage (SQLite)
- Auto-fill login forms on websites
- Password save prompt (jab form submit ho)
- Password generator
- Per-origin credentials lookup

### 4.7 Downloads
- Download capture from webview session
- Progress tracking
- Pause / resume / cancel
- Open file / show in folder
- Download history in panel

### 4.8 Autofill
- **Addresses** — name, line1, city, state, zip, country, phone, email
- **Payment cards** — encrypted card numbers
- Page pe auto-inject scripts

### 4.9 Nova Hub (Toolbar ★ Star Icon)

| Tab | Feature |
|-----|---------|
| **Account** | Local sign up / sign in (nova_account table) |
| **Sync** | E2E encrypted `.novasync` file export/import |
| **Extensions** | Unpacked extensions load (manifest.json + content scripts) |
| **VPN** | WireGuard setup guide (hosted servers = future) |
| **Nova Cloud** | Email, Drive info (UI scaffold) |
| **Updates** | Check & install updates (production builds) |

### 4.10 Tools
- **Screenshot** — page capture, save, clipboard copy
- **PDF viewer toolbar** — zoom, print, download (.pdf URLs)
- **Translation panel** — selected text translate
- **Update banner** — new version available notification

### 4.11 Settings Panel
- Theme: system / light / dark
- Homepage (default: `nova://newtab`)
- Search engine: **nova only** (forced)
- AI provider, API keys, model picker
- Gemini test connection button
- Ad blocker on/off
- Tracker blocker on/off
- Fingerprint protection on/off
- HTTPS-only mode
- Bookmark bar show/hide
- Default zoom
- Session restore on/off
- Download path
- Hardware acceleration
- Spellcheck

### 4.12 Build & Distribution
- Windows NSIS installer (`npm run build:win`)
- Windows portable (`npm run build:portable`)
- macOS DMG/ZIP (`npm run build:mac`)
- Linux AppImage/DEB (`npm run build:linux`)
- GitHub auto-update publish config

---

## 5. Database Tables (SQLite)

| Table | Data |
|-------|------|
| `bookmarks` | title, url, favicon, folder |
| `history` | title, url, visit_count, last_visit |
| `downloads` | filename, url, path, size, state |
| `passwords` | origin, username, password_encrypted |
| `sessions` | window_id, tabs_json, active_tab_id, incognito |
| `ai_conversations` | title, messages_json |
| `blocked_trackers` | domain, blocked_count |
| `site_settings` | per-origin ads/trackers/fingerprint/https |
| `autofill_addresses` | full address fields |
| `autofill_cards` | encrypted card data |
| `nova_account` | email, password_hash, sync_token |
| `sync_log` | device sync history |
| `extensions` | name, version, path, manifest |

**Database file location:** Electron userData folder mein `nova.db`

---

## 6. Nova URL System (Important)

File: `src/renderer/utils/novaUrls.js`

| URL | Matlab |
|-----|--------|
| `nova://newtab` | New tab page |
| `nova://search?q=hello&type=all` | Internal Nova Search |
| `https://search.nova/search?q=hello` | Address bar display URL |
| `https://example.com` | Normal website (webview) |

**Functions:**
- `getPageType(url)` — newtab / search / web
- `resolveTabPageType(tab)` — URL se sahi page type (stale pageType fix)
- `isNovaSearchUrl(url)` — Nova search check
- `externalSearchToNova(url)` — Google/Bing/DDG search URL → Nova Search
- `buildNovaSearchUrl()` / `buildDisplaySearchUrl()` — URL banane ke liye

---

## 7. IPC API — `window.novaAPI` (Preload Bridge)

Renderer (React) aur Main (Electron) ke beech **secure bridge**. File: `src/preload/browserPreload.js`

```
novaAPI.window       → minimize, maximize, close, newIncognito
novaAPI.navigation   → resolveUrl, sanitizeUrl, validateUrl, suggestions, performSearch
novaAPI.search       → query, suggestions
novaAPI.bookmarks    → getAll, add, remove, update, isBookmarked
novaAPI.history      → getAll, add, remove, clear, getRecent
novaAPI.downloads    → start, pause, resume, cancel, open, showInFolder, progress events
novaAPI.passwords    → getAll, save, get, remove, getForOrigin, generate
novaAPI.settings     → getAll, get, set, setMultiple, reset
novaAPI.sessions     → save, getAll, clear, onRestore
novaAPI.ai           → chat, summarize, explain, search, write, research, testConnection
novaAPI.privacy      → clearCache, clearCookies, clearAll, getTrackerStats, toggles
novaAPI.browser      → findInPage, print, devtools, zoom, capturePage, screenshot, extensions
novaAPI.translate    → text
novaAPI.siteSettings → get, set, getAll (per-site shields)
novaAPI.account      → get, signUp, signIn
novaAPI.sync         → export, import (.novasync)
novaAPI.extensions   → getAll, toggle, openFolder
novaAPI.update       → check, download, install
novaAPI.autofill     → addresses, cards, getScriptsForPage
novaAPI.vpn          → getStatus
novaAPI.filters      → load, getStats
novaAPI.shell        → openExternal
novaAPI.dialog       → openFile, saveFile
```

---

## 8. Keyboard Shortcuts

| Shortcut | Kaam |
|----------|------|
| `Ctrl+T` | New tab |
| `Ctrl+W` | Close tab |
| `Ctrl+L` | Address bar focus |
| `Ctrl+R` | Reload |
| `Ctrl+F` | Find in page |
| `Ctrl+P` | Print |
| `Ctrl+Shift+N` | Incognito window |
| `Ctrl+1` to `Ctrl+9` | Switch to tab number |
| `Ctrl + +` / `Ctrl + -` | Zoom in/out |
| `Ctrl+0` | Reset zoom |
| `F12` | DevTools (active webview) |
| `Alt+R` | Reader mode |

---

## 9. Kaise Chalayein (Run & Build)

### Development (roz kaam)
```powershell
cd "C:\Users\asus\OneDrive\Desktop\Nova Browser"
npm run dev
```
- Pehle main process build hota hai
- Phir Vite dev server `http://localhost:5173` par
- Electron window automatically khulti hai

### Sirf main process rebuild
```powershell
node scripts/build-main.cjs
```

### Production build (Windows installer)
```powershell
npm run build:win
```
Output: `release/` folder mein `.exe` installer

### Portable Windows
```powershell
npm run build:portable
```

### Agar problem aaye
1. **Saari purani Nova/Electron windows band karo** (Task Manager check karo)
2. Dubara `npm run dev` chalao
3. Cache error (`Unable to create cache`) = do instances ek saath chal rahe hain
4. C: drive mein space kam ho to SQLITE errors aate hain

---

## 10. Gemini AI Setup (Step by Step)

1. Browser kholo → **Settings** (gear icon)
2. **AI** section mein jao
3. Provider: **Gemini** select karo
4. [Google AI Studio](https://aistudio.google.com/apikey) se API key lo
5. **Gemini API Key** paste karo
6. Model: `gemini-2.0-flash` (recommended)
7. **Test Connection** dabao → "Nova AI connected successfully" aana chahiye
8. Toolbar se **Nova AI** sidebar kholo → Chat shuru karo

---

## 11. Recent Bug Fixes (Jo Abhi Fix Kiye Gaye)

### Problem: Search results aate the lekin link click par kuch nahi khulta tha

**Root causes:**
1. Tab `pageType: 'search'` par atka rehta tha jab URL `https://...` ho chuka hota tha
2. Tab `discarded: true` hone se webview skip ho jata tha
3. Webview `about:blank` par reh jata tha, actual URL load nahi hoti thi
4. DDG redirect URLs (`/l/?uddg=...`) sahi decode nahi ho rahe the

**Files fixed:**

| File | Fix |
|------|-----|
| `src/renderer/utils/novaUrls.js` | `resolveTabPageType()`, `isWebTab()` — URL-based page routing |
| `src/renderer/components/TabContent/TabContent.jsx` | `resolveTabPageType` use |
| `src/renderer/store/slices/tabsSlice.js` | URL change par `discarded` clear, `loadKey` increment, nav history |
| `src/renderer/components/NovaSearch/NovaSearchPage.jsx` | `openResult()` — URL normalize + history add |
| `src/renderer/components/WebView/WebViewContainer.jsx` | Direct `src={url}`, web tab filter fix |
| `src/renderer/components/Navigation/NavigationControls.jsx` | `resolveTabPageType` for back/forward |
| `src/main/services/novaSearch.js` | `decodeDdgUrl()` — relative DDG links fix |

### Problem: Session save error (`created_at NOT NULL`)
- Fix: `src/main/windowManager.js` — session save mein `created_at` field add

### Problem: Private/Incognito window
- Fix: `partition: 'nova-private'` for incognito webviews

---

## 12. Redux Store Slices

| Slice | State |
|-------|-------|
| `tabsSlice` | tabs[], activeTabId, isIncognito, navHistory, loadKey |
| `settingsSlice` | all app settings from electron-store |
| `historySlice` | browsing history |
| `bookmarksSlice` | bookmarks |
| `downloadsSlice` | active downloads |
| `passwordsSlice` | saved passwords |
| `aiSlice` | sidebar open, messages, conversations |
| `uiSlice` | panels open, reader mode, find in page, shields stats |

---

## 13. Webview Architecture

- Har **web tab** ka apna `<webview>` element
- Partition: `persist:nova` (normal) / `nova-private` (incognito)
- User-Agent: Chrome 120 + `NovaBrowser/1.0`
- Events: did-navigate, did-finish-load, page-title-updated, new-window
- External search URLs (Google/Bing) auto-convert → Nova Search
- Extension content scripts inject on page load
- Password autofill script inject
- Fingerprint canvas noise inject

**Tab routing (`TabContent.jsx`):**
```
URL = nova://newtab     → NewTabPage
URL = nova://search...  → NovaSearchPage
URL = https://...       → WebViewContainer
```

---

## 14. Nova Search Backend Flow

```
User types query
    ↓
NovaSearchPage.jsx → window.novaAPI.search.query()
    ↓
IPC search:query → novaSearch.js (main process)
    ↓
DuckDuckGo HTML POST / Lite GET (electron.net.fetch)
    ↓
parseSearchResults() → decodeDdgUrl() for each link
    ↓
Results return to UI → user clicks link
    ↓
openResult() → updateTab({ url: https://..., pageType: 'web' })
    ↓
TabContent → WebViewContainer → webview loads URL
```

---

## 15. Privacy Services Detail

### Ad Blocker (`adBlocker.js`)
- 50+ ad domains blocked
- URL pattern matching (`/ads/`, `doubleclick`, etc.)
- EasyList filter integration
- Per-site override via `siteSettings`

### Tracker Blocker (`trackerBlocker.js`)
- Google Analytics, Facebook Pixel, Hotjar, Mixpanel, etc.
- Main frame requests NEVER blocked (sirf scripts/trackers)
- Stats recorded in `blocked_trackers` table

### Session Manager (`sessionManager.js`)
- HTTPS upgrade (http → https redirect)
- Third-party cookie blocking
- Download capture & routing

### Fingerprint Protection (`fingerprintProtection.js`)
- DNT + Sec-GPC headers
- Canvas toDataURL noise injection in webview

---

## 16. Sync System (.novasync)

- **Export:** bookmarks + history + settings + passwords → encrypted JSON file
- **Import:** same file se restore
- E2E encryption (syncService.js)
- Manual desktop ↔ mobile sync (Capacitor scaffold exists)
- Real cloud sync = future v3.0

---

## 17. Extensions System

- Unpacked extensions folder
- `manifest.json` parse
- Content scripts URL match pe inject
- Nova Hub → Extensions → folder open
- Full Chrome Web Store MV3 = future

---

## 18. Default Settings

```javascript
theme: 'system'
defaultSearchEngine: 'nova'        // Google nahi — forced nova
homepage: 'nova://newtab'
adBlockerEnabled: true
trackerBlockerEnabled: true
fingerprintProtection: true
doNotTrack: true
blockThirdPartyCookies: true
sessionRestore: true
aiProvider: 'gemini'
geminiModel: 'gemini-2.0-flash'
defaultZoom: 100
httpsOnlyMode: false
```

---

## 19. Kya Abhi Fully Working Nahi Hai (Limitations)

| Feature | Status |
|---------|--------|
| Nova VPN servers | Sirf WireGuard guide UI — real servers nahi |
| Nova Email / Drive | UI panel hai — backend cloud nahi |
| Chrome Web Store extensions | Sirf unpacked extensions |
| Auto-update | Sirf packaged `.exe` builds mein — `npm run dev` mein nahi |
| Tab discarding | Partially removed (search link bug fix ke liye) |
| Mobile Capacitor app | Scaffold hai — desktop se sync manual file se |
| Real-time cloud sync | File-based `.novasync` only |

---

## 20. npm Scripts (Saare Commands)

| Command | Kaam |
|---------|------|
| `npm run dev` | Development — build main + vite + electron |
| `npm run build` | Full production build all platforms |
| `npm run build:win` | Windows installer |
| `npm run build:portable` | Windows portable .exe |
| `npm run build:mac` | macOS DMG |
| `npm run build:linux` | Linux AppImage + deb |
| `npm run build:netlify` | Web-only build (landing page) |
| `npm run preview` | Vite preview |
| `npm test` | Jest unit tests |
| `npm run test:e2e` | Playwright E2E |

---

## 21. Test Kaise Karein (Checklist)

- [ ] `npm run dev` — window khule
- [ ] New tab → search bar mein "wikipedia" type karo → Enter
- [ ] Nova Search results aayein (dark Google-style UI)
- [ ] Koi link click karo → website load ho
- [ ] Back button → search results wapas
- [ ] `Ctrl+T` → naya tab
- [ ] `Ctrl+Shift+N` → incognito window
- [ ] Settings → Gemini API key → Test Connection
- [ ] Nova AI sidebar → chat message bhejo
- [ ] Shields icon → tracker count dekho
- [ ] Nova Hub (★) → Account / Sync / Extensions

---

## 22. Important Files Quick Reference

| Kaam | File |
|------|------|
| App start | `src/main/index.js` |
| Search engine | `src/main/services/novaSearch.js` |
| Search UI | `src/renderer/components/NovaSearch/NovaSearchPage.jsx` |
| Website load | `src/renderer/components/WebView/WebViewContainer.jsx` |
| Tab state | `src/renderer/store/slices/tabsSlice.js` |
| URL logic | `src/renderer/utils/novaUrls.js` |
| AI backend | `src/main/services/aiService.js` |
| AI UI | `src/renderer/components/AI/AISidebar.jsx` |
| Settings UI | `src/renderer/components/Settings/SettingsPanel.jsx` |
| Preload API | `src/preload/browserPreload.js` |
| DB schema | `src/main/database/schema.js` |
| Roadmap | `docs/ROADMAP.md` |

---

## 23. Credits & License

- **License:** MIT
- **Author:** Nova Browser Team
- **App ID:** `com.novabrowser.app`
- **Product Name:** Nova Browser

---

*Yeh file Nova Browser project ki complete documentation hai. Koi bhi feature, file, ya command yahan cover hai. Agar kuch naya add ho toh is file ko update karna.*
