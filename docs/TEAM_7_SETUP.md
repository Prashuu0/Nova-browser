# Nova Browser — 7 Log Ki Team Setup 🚀

> Har member ka role clear hai. Clone karo, setup chalao, apna module uthao.

---

## Team Roles (7 Members)

| # | Role | Focus Area | Folder |
|---|------|------------|--------|
| **1** | **Tech Lead / Desktop** | Electron browser, webview, tabs, navigation | `src/` |
| **2** | **Cloud Backend** | Nova Cloud API, PostgreSQL, auth, sync | `nova-cloud/` |
| **3** | **Mobile Dev** | React Native app | `nova-mobile/` |
| **4** | **AI Engineer** | Gemini integration, Nova AI Pro, inference server | `src/main/services/aiService.js`, `nova-ai/` |
| **5** | **Search Engineer** | Nova Search API, crawler, indexing | `nova-crawler/`, `nova-cloud/src/routes/search.js` |
| **6** | **DevOps** | Docker, CI/CD, deploy, monitoring | `.github/`, `docker/`, `scripts/` |
| **7** | **QA + Product** | Testing, feedback, beta users, docs | `docs/`, `tests/` |

---

## Ek Baar Mein Setup (Saari Team)

```powershell
# Windows — project root mein
npm run team:setup
```

Yeh automatically karega:
- `npm install` (desktop)
- `nova-cloud` dependencies + migrate + seed
- Docker PostgreSQL + Redis start (agar Docker hai)
- Main process build

Phir start karo:
```powershell
npm run start:nova
```

---

## Daily Workflow

```bash
# 1. Latest code lo
git pull origin main

# 2. Apna module chalao
npm run dev              # Desktop (Member 1)
npm run cloud:dev        # Cloud API (Member 2)
cd nova-mobile && npm start  # Mobile (Member 3)

# 3. Test karo
npm test
npm run test:e2e
```

---

## Git Branch Strategy

```
main          → production-ready only
develop       → daily integration
feature/*     → individual work
  feature/cloud-auth      (Member 2)
  feature/mobile-browser  (Member 3)
  feature/ai-pro          (Member 4)
  feature/search-crawler  (Member 5)
  feature/ci-deploy       (Member 6)
```

**Rule:** `develop` pe merge karo, QA pass ke baad `main`.

---

## Member 1 — Desktop Lead

**Tasks:**
- [ ] Search link navigation 100% stable
- [ ] WebView performance
- [ ] Windows installer test (`npm run build:win`)
- [ ] Incognito + session restore

**Files:** `src/renderer/`, `src/main/windowManager.js`, `WebViewContainer.jsx`

---

## Member 2 — Cloud Backend

**Tasks:**
- [ ] Deploy to server (Railway/Render/VPS)
- [ ] SMTP email verification live
- [ ] Sync load testing (7 devices)
- [ ] Admin dashboard monitor

**Files:** `nova-cloud/`

**Local:**
```powershell
npm run cloud:docker
npm run cloud:migrate
npm run cloud:seed
npm run cloud:dev
```

**Admin:** http://localhost:3847/admin

---

## Member 3 — Mobile

**Tasks:**
- [ ] `react-native-webview` install + test
- [ ] Full browser navigation
- [ ] Cloud sync sign in
- [ ] Android APK build

```bash
cd nova-mobile
npm install
npm install react-native-webview
npx react-native run-android
```

---

## Member 4 — AI Engineer

**Tasks:**
- [ ] Gemini API production keys
- [ ] Nova AI Pro all modes test
- [ ] `nova-ai/` inference server setup
- [ ] Rate limiting + cost tracking

```bash
cd nova-ai
npm install
npm run dev
```

---

## Member 5 — Search Engineer

**Tasks:**
- [ ] Nova Search API cache tuning
- [ ] `nova-crawler/` first crawl jobs
- [ ] Trending searches accuracy
- [ ] Reduce DuckDuckGo dependency

```bash
cd nova-crawler
pip install -r requirements.txt
python crawler.py --query "test"
```

---

## Member 6 — DevOps

**Tasks:**
- [ ] GitHub Actions CI green
- [ ] Production `docker-compose.prod.yml`
- [ ] Domain: `api.novabrowser.app`
- [ ] SSL + monitoring
- [ ] Beta `.exe` release pipeline

```bash
docker compose -f docker/docker-compose.prod.yml up -d
```

---

## Member 7 — QA + Product

**Tasks:**
- [ ] Beta test checklist (100 users)
- [ ] Bug reports triage (Nova Hub → Feedback)
- [ ] Privacy policy + Terms review
- [ ] Release notes each sprint
- [ ] User onboarding doc

**Test checklist:** `docs/BETA_CHECKLIST.md`

---

## Communication

| Channel | Use |
|---------|-----|
| GitHub Issues | Bugs + features |
| `docs/` | Technical decisions |
| Nova Hub Feedback | User reports |
| Weekly sync | Progress + blockers |

---

## Beta Launch Target

1. Cloud deployed + SSL ✅ (Member 6)
2. Account + Sync working ✅ (Member 2)
3. Desktop installer tested ✅ (Member 1)
4. Mobile APK alpha ✅ (Member 3)
5. 10 internal testers → 100 beta users ✅ (Member 7)

---

## Quick Links

- [Full Browser Docs](./NOVA_BROWSER_SAB_KUCH.md)
- [Ecosystem Architecture](./NOVA_ECOSYSTEM.md)
- [API Reference](./API.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Beta Checklist](./BETA_CHECKLIST.md)
