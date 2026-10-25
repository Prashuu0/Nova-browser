const { BrowserView, BrowserWindow } = require('electron');

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 NovaBrowser/1.0';

class BrowserViewManager {
  constructor() {
    /** @type {Map<string, { view: BrowserView, winId: number|null }>} */
    this.views = new Map();
    /** @type {Map<number, { x: number, y: number, width: number, height: number }>} */
    this.boundsByWindow = new Map();
    /** @type {Map<number, string>} */
    this.activeTabByWindow = new Map();
  }

  getEntry(tabId) {
    return this.views.get(tabId);
  }

  getWebContentsId(tabId) {
    return this.views.get(tabId)?.view.webContents.id ?? null;
  }

  ensureView(tabId, incognito = false) {
    if (this.views.has(tabId)) {
      return this.views.get(tabId).view;
    }

    const partition = incognito ? 'nova-private' : 'persist:nova';
    const view = new BrowserView({
      webPreferences: {
        partition,
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false,
        webgl: true
      }
    });

    view.webContents.setUserAgent(USER_AGENT);
    this.wireEvents(tabId, view);
    this.views.set(tabId, { view, winId: null, lastLoadKey: null });
    return view;
  }

  wireEvents(tabId, view) {
    const wc = view.webContents;

    const send = (channel, payload) => {
      for (const win of BrowserWindow.getAllWindows()) {
        if (!win.isDestroyed()) {
          win.webContents.send(channel, { tabId, ...payload });
        }
      }
    };

    wc.on('did-start-loading', () => {
      send('tab-browser:loading', { isLoading: true });
    });

    wc.on('did-stop-loading', () => {
      send('tab-browser:loading', {
        isLoading: false,
        canGoBack: wc.canGoBack(),
        canGoForward: wc.canGoForward()
      });
    });

    wc.on('page-title-updated', (_e, title) => {
      if (title) send('tab-browser:title', { title });
    });

    wc.on('page-favicon-updated', (_e, favicons) => {
      if (favicons?.[0]) send('tab-browser:favicon', { favicon: favicons[0] });
    });

    wc.on('did-navigate', (_e, url) => {
      if (url && url !== 'about:blank') {
        send('tab-browser:navigate', { url });
      }
    });

    wc.on('did-navigate-in-page', (_e, url) => {
      if (url && url !== 'about:blank') {
        send('tab-browser:navigate', { url });
      }
    });

    wc.on('did-finish-load', () => {
      send('tab-browser:finish', {
        url: wc.getURL(),
        title: wc.getTitle(),
        canGoBack: wc.canGoBack(),
        canGoForward: wc.canGoForward()
      });
    });

    wc.on('did-fail-load', (_e, errorCode, errorDescription, _validatedURL, isMainFrame) => {
      if (!isMainFrame || errorCode === -3) return;
      send('tab-browser:error', { errorCode, errorDescription });
    });

    wc.on('found-in-page', (_e, result) => {
      send('tab-browser:found-in-page', {
        activeMatchOrdinal: result.activeMatchOrdinal,
        matches: result.matches
      });
    });

    wc.on('did-finish-load', async () => {
      const url = wc.getURL();
      if (!url?.startsWith('http')) return;
      try {
        const { getContentScriptsForUrl, getStylesForUrl } = require('./extensionManager');
        for (const css of getStylesForUrl(url)) {
          try {
            await wc.insertCSS(css);
          } catch {
            /* ignore */
          }
        }
        for (const script of getContentScriptsForUrl(url)) {
          try {
            await wc.executeJavaScript(script);
          } catch {
            /* ignore */
          }
        }
      } catch {
        /* ignore */
      }
    });

    wc.setWindowOpenHandler(({ url }) => {
      send('tab-browser:new-window', { url });
      return { action: 'deny' };
    });
  }

  setBounds(win, bounds) {
    if (!win || win.isDestroyed()) return;
    if (!bounds || bounds.width < 2 || bounds.height < 2) return;
    if (bounds.y < 48) return;

    this.boundsByWindow.set(win.id, bounds);
    const view = win.getBrowserView();
    if (view) {
      view.setBounds(bounds);
    }
  }

  show(win, { tabId, url, incognito = false, loadKey = 0 }) {
    if (!win || win.isDestroyed() || !tabId || !url?.startsWith('http')) {
      return { success: false };
    }

    const bounds = this.boundsByWindow.get(win.id);
    if (!bounds || bounds.width < 10 || bounds.height < 10 || bounds.y < 48) {
      return { success: false, error: 'bounds not ready' };
    }

    const view = this.ensureView(tabId, incognito);
    const entry = this.views.get(tabId);
    entry.winId = win.id;

    const attached = win.getBrowserView();
    if (attached && attached !== view) {
      win.removeBrowserView(attached);
    }

    view.setBounds(bounds);
    view.setAutoResize({ width: true, height: true });
    win.setBrowserView(view);
    this.activeTabByWindow.set(win.id, tabId);

    const current = view.webContents.getURL();
    if (current !== url || entry.lastLoadKey !== loadKey) {
      entry.lastLoadKey = loadKey;
      view.webContents.loadURL(url).catch((err) => {
        win.webContents.send('tab-browser:error', {
          tabId,
          errorCode: -1,
          errorDescription: err.message
        });
      });
    }

    return { success: true, webContentsId: view.webContents.id };
  }

  hide(win) {
    if (!win || win.isDestroyed()) return;
    win.setBrowserView(null);
    this.activeTabByWindow.delete(win.id);
  }

  reload(tabId) {
    const view = this.views.get(tabId)?.view;
    if (view) view.webContents.reload();
  }

  stop(tabId) {
    const view = this.views.get(tabId)?.view;
    if (view) view.webContents.stop();
  }

  goBack(tabId) {
    const view = this.views.get(tabId)?.view;
    if (view?.webContents.canGoBack()) {
      view.webContents.goBack();
      return true;
    }
    return false;
  }

  goForward(tabId) {
    const view = this.views.get(tabId)?.view;
    if (view?.webContents.canGoForward()) {
      view.webContents.goForward();
      return true;
    }
    return false;
  }

  async executeJavaScript(tabId, script) {
    const view = this.views.get(tabId)?.view;
    if (!view) return null;
    try {
      return await view.webContents.executeJavaScript(script);
    } catch {
      return null;
    }
  }

  removeTab(tabId) {
    const entry = this.views.get(tabId);
    if (!entry) return;

    const { view, winId } = entry;
    if (winId != null) {
      const win = BrowserWindow.fromId(winId);
      if (win && !win.isDestroyed() && win.getBrowserView() === view) {
        win.removeBrowserView(view);
      }
    }

    try {
      view.webContents.close();
    } catch {
      /* ignore */
    }

    this.views.delete(tabId);
  }

  cleanupWindow(win) {
    if (!win) return;
    this.hide(win);
    this.boundsByWindow.delete(win.id);
    this.activeTabByWindow.delete(win.id);
  }
}

module.exports = new BrowserViewManager();
