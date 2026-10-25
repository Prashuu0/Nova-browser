# Nova Browser

Privacy-focused, AI-powered browser ecosystem — Desktop + Cloud + Mobile + AI.

## 7-Person Team — Start Here

```powershell
npm run team:setup    # Ek baar chalao (setup)
npm run go            # Sab kuch start — Cloud + AI + Browser
```

Docker ki zaroorat **nahi** — Cloud SQLite pe chalega automatically.

**Team guide:** [docs/TEAM_7_SETUP.md](docs/TEAM_7_SETUP.md)  
**Beta checklist:** [docs/BETA_CHECKLIST.md](docs/BETA_CHECKLIST.md)  
**Contributing:** [CONTRIBUTING.md](CONTRIBUTING.md)

## Ecosystem

| Module | Folder | Command |
|--------|--------|---------|
| Desktop Browser | `src/` | `npm run dev` |
| Nova Cloud API | `nova-cloud/` | `npm run cloud:dev` |
| Nova Mobile | `nova-mobile/` | `cd nova-mobile && npm start` |
| Nova AI Server | `nova-ai/` | `npm run ai:dev` |
| Search Crawler | `nova-crawler/` | `python crawler.py --search "query"` |
| Admin Dashboard | — | http://localhost:3847/admin |

## Quick Start (Solo)

```bash
npm install
npm run dev
```

## Build Beta Installer

```bash
npm run build:beta
```

Output: `release/` folder

## Docs

- [Complete Guide (Hindi)](docs/NOVA_BROWSER_SAB_KUCH.md)
- [Ecosystem Architecture](docs/NOVA_ECOSYSTEM.md)
- [API Reference](docs/API.md)
- [Deployment](docs/DEPLOYMENT.md)

## License

MIT
