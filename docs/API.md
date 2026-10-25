# Nova Cloud API Reference

Base URL: `http://localhost:3847` (dev) | `https://api.novabrowser.app` (prod)

---

## Auth

### POST `/api/auth/register`
```json
{ "email": "user@email.com", "password": "min8chars", "displayName": "Name", "deviceName": "PC", "platform": "win32" }
```
Response: `{ success, user, accessToken, refreshToken, expiresIn }`

### POST `/api/auth/login`
```json
{ "email": "user@email.com", "password": "..." }
```

### POST `/api/auth/refresh`
```json
{ "refreshToken": "..." }
```

### POST `/api/auth/logout`
Headers: `Authorization: Bearer <token>`
```json
{ "refreshToken": "..." }
```

### GET `/api/auth/verify-email?token=...`

### POST `/api/auth/forgot-password`
```json
{ "email": "user@email.com" }
```

### POST `/api/auth/reset-password`
```json
{ "token": "...", "password": "newpassword" }
```

### GET `/api/auth/me`
Headers: `Authorization: Bearer <token>`

---

## Sync

All require `Authorization: Bearer <token>`

### GET `/api/sync/pull`
Returns full user data: bookmarks, history, passwords, settings, AI chats, tabs, devices.

### POST `/api/sync/push`
```json
{
  "data": {
    "bookmarks": [...],
    "history": [...],
    "passwords": [...],
    "settings": {...},
    "aiConversations": [...],
    "tabs": [...],
    "activeTabId": "..."
  },
  "deviceId": "uuid"
}
```

### GET `/api/sync/status`
Last sync time, item counts, connected devices.

---

## Search

### POST `/api/search/query`
```json
{ "query": "flipkart", "type": "all" }
```
Response: `{ results, searchTime, cached, source }`

### GET `/api/search/trending`

### GET `/api/search/suggestions?q=flip`

---

## Extensions (Nova Store)

### GET `/api/extensions/catalog`
Query: `?category=privacy&featured=true`

### GET `/api/extensions/catalog/:slug`

### POST `/api/extensions/install` (auth required)
```json
{ "extensionId": "uuid" }
```

### GET `/api/extensions/installed` (auth required)

### PATCH `/api/extensions/:id/toggle` (auth required)
```json
{ "enabled": true }
```

---

## Feedback & Analytics

### POST `/api/feedback`
```json
{ "message": "...", "rating": 5, "category": "beta", "email": "..." }
```

### POST `/api/feedback/crash`
```json
{ "errorMessage": "...", "stackTrace": "...", "appVersion": "2.0.0", "platform": "win32" }
```

### POST `/api/feedback/event`
```json
{ "eventType": "ai:chat", "eventData": {} }
```

### GET `/api/feedback/analytics` (auth required)
Dashboard stats: users, searches, crashes, AI usage.

---

## WebSocket

`ws://localhost:3847/ws/sync?token=<accessToken>`

Messages:
- `{ type: "connected" }`
- `{ type: "sync:updated", itemCounts, at }`
- `{ type: "sync:pull-request", from: deviceId }`
- Client: `{ type: "ping" }` → `{ type: "pong" }`

---

## Health

### GET `/health`
`{ status: "ok", service: "nova-cloud", version: "1.0.0" }`
