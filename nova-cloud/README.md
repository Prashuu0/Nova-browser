# Nova Cloud

Nova Cloud is the backend API for Nova Browser — authentication, sync, search, extensions, and analytics.

## Quick Start

```bash
cp .env.example .env
docker-compose up -d postgres
npm install
npm run migrate
npm run seed
npm run dev
```

API runs at **http://localhost:3847**

See [DEPLOYMENT.md](../docs/DEPLOYMENT.md) and [API.md](../docs/API.md) for full docs.
