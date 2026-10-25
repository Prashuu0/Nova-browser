const { app, BrowserWindow, ipcMain, session, shell, dialog, nativeTheme } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { initDatabase, closeDatabase } = require('./database');
const { registerBookmarkHandlers } = require('./ipc/bookmarks');
const { registerHistoryHandlers } = require('./ipc/history');
const { registerDownloadHandlers } = require('./ipc/downloads');
const { registerPasswordHandlers } = require('./ipc/passwords');
const { registerSettingsHandlers } = require('./ipc/settings');
const { registerSessionHandlers } = require('./ipc/sessions');
const { registerAIHandlers } = require('./ipc/ai');
const { registerPrivacyHandlers } = require('./ipc/privacy');
const { registerNavigationHandlers } = require('./ipc/navigation');
const { registerSearchHandlers } = require('./ipc/search');
const { registerBrowserHandlers } = require('./ipc/browser');
const { registerTabBrowserHandlers } = require('./ipc/tabBrowser');
const { registerFilterHandlers } = require('./ipc/filters');
const { registerTranslateHandlers } = require('./ipc/translate');
const { registerSiteSettingsHandlers } = require('./ipc/siteSettings');
const { registerPlatformHandlers } = require('./ipc/platform');
const { registerAutofillHandlers } = require('./ipc/autofill');
const { WindowManager } = require('./windowManager');
const { setupAdBlocker } = require('./services/adBlocker');
const { setupTrackerBlocker } = require('./services/trackerBlocker');
const { loadFilterLists } = require('./services/filterLists');
const {
  getNovaSession,
  getIncognitoSession,
  setupHttpsUpgrade,
  setupThirdPartyCookieBlock,
  setupDownloadCapture
} = require('./services/sessionManager');
const { setupFingerprintHeaders } = require('./services/fingerprintProtection');
const { loadExtensionsFromDisk } = require('./services/extensionManager');
const { initUpdater } = require('./services/updaterService');
const { setWindowManager } = require('./ipc/sessions');

let windowManager = null;

const isDev = !app.isPackaged;

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

app.on('second-instance', () => {
  const win = BrowserWindow.getAllWindows()[0];
  if (win) {
    if (win.isMinimized()) win.restore();
    win.show();
    win.focus();
  }
});

// OneDrive/sync folders cause Electron cache "Access denied" — use Local AppData
const localDataRoot = path.join(os.homedir(), 'AppData', 'Local', 'NovaBrowser');
try {
  fs.mkdirSync(localDataRoot, { recursive: true });
  app.setPath('userData', localDataRoot);
} catch (err) {
  console.warn('[Nova] Could not set local data path:', err.message);
}

// Avoid GPU disk cache lock issues on Windows
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');

function createMainWindow(options = {}) {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    show: true,
    frame: false,
    ...(process.platform === 'darwin' ? { titleBarStyle: 'hidden' } : {}),
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#0f0f1a' : '#ffffff',
    webPreferences: {
      preload: path.join(__dirname, '../preload/browserPreload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webviewTag: true,
      spellcheck: true
    },
    ...options
  });

  win.show();
  win.focus();

  win.webContents.on('did-fail-load', (_event, _code, desc, validatedURL) => {
    if (isDev && validatedURL.includes('localhost:5173')) {
      console.log(`[Nova] Dev server not ready yet (${desc}), retrying in 1s...`);
      setTimeout(() => {
        if (!win.isDestroyed()) win.loadURL(validatedURL);
      }, 1000);
    }
  });

  if (isDev) {
    const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
    win.loadURL(devUrl);
  } else {
    win.loadFile(path.join(__dirname, '../../dist/index.html'));
  }

  return win;
}

function registerIpcHandlers() {
  registerBookmarkHandlers();
  registerHistoryHandlers();
  registerDownloadHandlers();
  registerPasswordHandlers();
  registerSettingsHandlers();
  registerSessionHandlers();
  registerAIHandlers();
  registerPrivacyHandlers();
  registerNavigationHandlers();
  registerSearchHandlers();
  registerBrowserHandlers();
  registerTabBrowserHandlers();
  registerFilterHandlers();
  registerTranslateHandlers();
  registerSiteSettingsHandlers();
  registerPlatformHandlers();
  registerAutofillHandlers();

  ipcMain.handle('window:newIncognito', () => {
    windowManager?.createWindow({ incognito: true });
    return { success: true };
  });

  ipcMain.handle('window:minimize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win?.minimize();
  });

  ipcMain.handle('window:maximize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win?.isMaximized()) {
      win.unmaximize();
    } else {
      win?.maximize();
    }
    return win?.isMaximized();
  });

  ipcMain.handle('window:close', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win?.close();
  });

  ipcMain.handle('window:isMaximized', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    return win?.isMaximized() ?? false;
  });

  ipcMain.handle('app:getVersion', () => app.getVersion());

  ipcMain.handle('shell:openExternal', async (_, url) => {
    await shell.openExternal(url);
  });

  ipcMain.handle('dialog:openFile', async (_, options) => {
    const result = await dialog.showOpenDialog(options);
    return result;
  });

  ipcMain.handle('dialog:saveFile', async (_, options) => {
    const result = await dialog.showSaveDialog(options);
    return result;
  });
}

app.whenReady().then(async () => {
  initDatabase();
  registerIpcHandlers();

  const webviewSession = getNovaSession();
  const incognitoSession = getIncognitoSession();

  const userAgent =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 NovaBrowser/1.0';

  webviewSession.setUserAgent(userAgent);
  incognitoSession.setUserAgent(userAgent);

  const permissionHandler = (webContents, permission, callback) => {
    const allowed = ['media', 'geolocation', 'notifications', 'fullscreen', 'pointerLock'].includes(permission);
    callback(allowed);
  };
  webviewSession.setPermissionRequestHandler(permissionHandler);
  incognitoSession.setPermissionRequestHandler(permissionHandler);

  setupAdBlocker(webviewSession);
  setupTrackerBlocker(webviewSession);
  setupAdBlocker(incognitoSession);
  setupTrackerBlocker(incognitoSession);
  setupHttpsUpgrade(webviewSession);
  setupHttpsUpgrade(incognitoSession);
  setupThirdPartyCookieBlock(webviewSession);
  setupThirdPartyCookieBlock(incognitoSession);

  const Store = require('electron-store');
  const appSettings = new Store({ name: 'nova-settings' });
  if (appSettings.get('fingerprintProtection', true)) {
    setupFingerprintHeaders(webviewSession, true);
    setupFingerprintHeaders(incognitoSession, true);
  }

  loadExtensionsFromDisk();

  windowManager = new WindowManager(createMainWindow);
  setWindowManager(windowManager);

  setupDownloadCapture(webviewSession, () => BrowserWindow.getFocusedWindow());
  setupDownloadCapture(incognitoSession, () => BrowserWindow.getFocusedWindow());

  loadFilterLists().catch((err) => console.error('Filter lists load failed:', err.message));

  await windowManager.restoreSession();

  try {
    const cloudSync = require('./services/cloudSyncService');
    const cloudClient = require('./services/cloudClient');
    if (cloudClient.getSession().accessToken) {
      cloudSync.startCloudSync();
    }
  } catch {}

  const mainWin = require('electron').BrowserWindow.getAllWindows()[0];
  if (mainWin) initUpdater(mainWin);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      windowManager.createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    closeDatabase();
    app.quit();
  }
});

app.on('before-quit', () => {
  if (windowManager) {
    windowManager.saveAllSessions();
  }
  closeDatabase();
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  try {
    const cloudClient = require('./services/cloudClient');
    cloudClient.submitCrashReport({
      errorMessage: error.message,
      stackTrace: error.stack,
      osVersion: process.getSystemVersion?.() || process.platform
    }).catch(() => {});
  } catch {}
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
  try {
    const cloudClient = require('./services/cloudClient');
    cloudClient.submitCrashReport({
      errorMessage: String(reason),
      stackTrace: reason?.stack || '',
      osVersion: process.getSystemVersion?.() || process.platform
    }).catch(() => {});
  } catch {}
});
