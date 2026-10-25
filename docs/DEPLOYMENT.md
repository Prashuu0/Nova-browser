# Nova Cloud — Deployment Guide

## Quick Start (Local Development)

### 1. Start PostgreSQL with Docker

```powershell
cd "C:\Users\asus\OneDrive\Desktop\Nova Browser"
npm run cloud:docker
```

Or manually:
```powershell
cd nova-cloud
docker-compose up -d postgres
```

### 2. Install & migrate

```powershell
npm run cloud:install
npm run cloud:migrate
npm run cloud:seed
```

### 3. Start Nova Cloud API

```powershell
npm run cloud:dev
```

API: `http://localhost:3847`  
WebSocket: `ws://localhost:3847/ws/sync`

### 4. Start Nova Browser

```powershell
npm run dev
```

### 5. Test

1. Open Nova Hub (★ icon)
2. Create Account
3. Cloud Sync → Sync Now
4. Nova Store → Install extension

---

## Environment Variables

Copy `nova-cloud/.env.example` to `nova-cloud/.env`:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | Min 32 chars — change in production! |
| `JWT_REFRESH_SECRET` | Min 32 chars — change in production! |
| `SMTP_*` | Email for verification & password reset |
| `APP_URL` | Frontend URL for email links |
| `CORS_ORIGINS` | Allowed origins |

---

## Production Deployment

### Option A: Docker Compose (VPS)

```bash
# On your server (Ubuntu 22.04+)
git clone <your-repo>
cd nova-cloud
cp .env.example .env
# Edit .env with production secrets

docker-compose up -d
```

### Option B: Manual

```bash
# Install PostgreSQL 16
sudo apt install postgresql

# Create database
sudo -u postgres createdb nova_cloud
sudo -u postgres createuser nova -P

# Run migrations
npm run migrate

# Use PM2 for process management
npm install -g pm2
pm2 start src/index.js --name nova-cloud
pm2 save
```

### Nginx Reverse Proxy

```nginx
server {
    listen 443 ssl;
    server_name api.novabrowser.app;

    ssl_certificate /etc/letsencrypt/live/api.novabrowser.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.novabrowser.app/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3847;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Desktop Browser Config

Set cloud URL in electron-store or env:
```
NOVA_CLOUD_URL=https://api.novabrowser.app
```

---

## Mobile Deployment

```bash
cd nova-mobile
npm install

# Set NOVA_CLOUD_URL to your server IP/domain
# Android
npx react-native run-android
```

---

## Health Check

```bash
curl http://localhost:3847/health
```

Expected: `{"status":"ok","service":"nova-cloud","version":"1.0.0"}`

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Database connection failed | Check `DATABASE_URL`, ensure PostgreSQL running |
| CORS error | Add origin to `CORS_ORIGINS` in .env |
| Email not sending | SMTP not configured — check console for dev mode logs |
| Sync fails | Sign in first; check JWT token in Nova Hub |
| Store empty | Run `npm run cloud:seed` |
