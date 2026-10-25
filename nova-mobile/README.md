# Nova Mobile

React Native app for Nova Browser ecosystem — syncs with Nova Cloud.

## Features (v1.0 Beta)

- Nova Account sign in
- Nova Cloud sync (bookmarks, passwords, history)
- Nova Search
- Nova AI Assistant
- Bookmarks manager

## Setup

```bash
cd nova-mobile
npm install
npx react-native run-android
# or
npx react-native run-ios
```

## Environment

Create `.env`:

```
NOVA_CLOUD_URL=http://YOUR_IP:3847
```

Use your PC's local IP (not localhost) when testing on physical device.

## Architecture

```
nova-mobile/
├── App.tsx              # Root navigation
├── src/
│   ├── api/novaCloud.ts # Nova Cloud API client
│   ├── screens/
│   │   ├── HomeScreen.tsx
│   │   ├── SearchScreen.tsx
│   │   ├── BookmarksScreen.tsx
│   │   ├── AIScreen.tsx
│   │   └── AccountScreen.tsx
│   └── store/           # AsyncStorage + sync state
├── package.json
└── README.md
```

## Sync Flow

```
Desktop (Electron) → Nova Cloud API → PostgreSQL
                              ↓
Mobile (React Native) ← pull/push sync
```
