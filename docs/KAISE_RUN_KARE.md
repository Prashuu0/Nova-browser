# Nova Browser — Kaise Run Kare (Step by Step)

Yeh guide bilkul beginner ke liye hai. Sirf copy-paste karo, kaam ho jayega.

---

## Pehle yeh check karo (ek baar)

### 1. Node.js install hona chahiye

PowerShell kholo aur likho:

```powershell
node -v
```

**Chahiye:** `v26.3.1` ya usse upar (project is version pe set hai)

Agar `v20` ya `v22` dikhe to [nodejs.org](https://nodejs.org) se **26.3.1** download karo, install karo, **naya PowerShell** kholo.

### 2. Project folder

```powershell
cd "c:\Users\asus\OneDrive\Desktop\Nova Browser"
```

---

## Pehli baar setup (sirf ek baar)

```powershell
cd "c:\Users\asus\OneDrive\Desktop\Nova Browser"
npm run team:setup
```

Yeh automatically karega:
- Root project ki dependencies install
- Nova Cloud (backend) install + database setup
- Nova AI server install
- Main Electron code build

**Time:** 3–10 minute (internet speed pe depend)

---

## Roz roz project chalana (main command)

```powershell
cd "c:\Users\asus\OneDrive\Desktop\Nova Browser"
npm run go
```

**Yeh ek hi command se teen cheezein start karti hai:**

| Service | URL | Kaam |
|---------|-----|------|
| Nova Cloud API | http://localhost:3847 | Sync, search backend, extensions |
| Nova AI | http://localhost:3850 | AI chat, summarize |
| Nova Browser | Desktop window khulegi | Browser app |

**Band kaise kare:** Terminal me `Ctrl + C` dabao.

---

## Kya hota hai `npm run go` ke andar?

1. Purane Electron / port processes band karta hai (3847, 3850, 5173)
2. Main process code build karta hai
3. Cloud database migrate + seed karta hai
4. Nova Cloud server start → port **3847**
5. Nova AI server start → port **3850**
6. 2.5 second baad Nova Browser (Electron + Vite) start → port **5173**

---

## Sirf browser chalana (Cloud/AI ke bina)

```powershell
npm run dev
```

Search basic kaam karega, lekin cloud sync aur AI features limited rahenge.

---

## Beta .exe banana (dusron ko dena ho)

```powershell
npm run build:beta
```

Output: `release/` folder me portable `.exe` milega.

---

## Agar error aaye — Solutions

### Error: `better-sqlite3` / `NODE_MODULE_VERSION` (desktop app only)

Nova Cloud ab **Node built-in SQLite** use karta hai — is error se affect nahi hota.

Agar sirf desktop app me aaye:
```powershell
taskkill /F /IM electron.exe
taskkill /F /IM node.exe
cd "c:\Users\asus\OneDrive\Desktop\Nova Browser"
npm install
npm run go
```

### Error: Port already in use (3847 / 3850 / 5173)

```powershell
taskkill /F /IM electron.exe
taskkill /F /IM node.exe
npm run go
```

### Error: Blank screen / site load nahi ho rahi

1. Pehle **sab Electron windows band** karo
2. Phir fresh `npm run go`
3. Search karo → result pe click → site khulni chahiye

### Error: Cache / Access denied (OneDrive)

Browser data ab yahan save hota hai (OneDrive se bahar):

```
C:\Users\asus\AppData\Local\NovaBrowser
```

Agar phir bhi cache error aaye:

```powershell
taskkill /F /IM electron.exe
Remove-Item -Recurse -Force "$env:LOCALAPPDATA\NovaBrowser\Cache" -ErrorAction SilentlyContinue
npm run go
```

### Purana Electron chal raha ho

```powershell
taskkill /F /IM electron.exe
```

Phir dubara `npm run go`.

---

## Health check (sab theek hai ya nahi)

Browser chalne ke baad PowerShell me:

```powershell
Invoke-WebRequest -Uri http://localhost:3847/health -UseBasicParsing
Invoke-WebRequest -Uri http://localhost:3850/health -UseBasicParsing
```

Dono me response aana chahiye (200 OK).

Admin panel: http://localhost:3847/admin

---

## Short cheat sheet

| Kaam | Command |
|------|---------|
| Pehli baar setup | `npm run team:setup` |
| **Roz chalana** | **`npm run go`** |
| Sirf browser | `npm run dev` |
| Cloud alag | `npm run cloud:dev` |
| AI alag | `npm run ai:dev` |
| Beta exe | `npm run build:beta` |
| Band karna | `Ctrl + C` terminal me |

---

## Tumhare liye — 3 steps summary

```
1. PowerShell kholo
2. cd "c:\Users\asus\OneDrive\Desktop\Nova Browser"
3. npm run go
```

Pehli baar? Pehle `npm run team:setup`, phir `npm run go`.

---

Zyaada detail: `docs/NOVA_BROWSER_SAB_KUCH.md`
