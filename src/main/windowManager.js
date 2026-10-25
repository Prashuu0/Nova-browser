const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('./database');
const browserViewManager = require('./services/browserViewManager');

class WindowManager {
  constructor(createWindowFn) {
    this.createWindowFn = createWindowFn;
    this.windows = new Map();
  }

  createWindow(options = {}) {
    const windowId = uuidv4();
    const win = this.createWindowFn({ ...options, windowId });
    this.windows.set(windowId, { win, windowId, isIncognito: options.incognito || false });

    win.on('closed', () => {
      browserViewManager.cleanupWindow(win);
      this.windows.delete(windowId);
    });

    win.webContents.once('did-finish-load', () => {
      win.webContents.send('window:init', { windowId, isIncognito: options.incognito || false });
    });

    return { win, windowId };
  }

  getWindow(windowId) {
    return this.windows.get(windowId);
  }

  async restoreSession() {
    try {
      const db = getDatabase();
      const sessions = db.prepare(
        'SELECT * FROM sessions WHERE is_incognito = 0 ORDER BY updated_at DESC LIMIT 1'
      ).all();

      if (!sessions || sessions.length === 0) {
        this.createWindow();
        return;
      }

      for (const session of sessions) {
        let tabs = [];
        try {
          tabs = JSON.parse(session.tabs_json);
        } catch {
          tabs = [];
        }
        const { win } = this.createWindow({
          restoreTabs: tabs,
          activeTabId: session.active_tab_id
        });
        win.webContents.once('did-finish-load', () => {
          win.webContents.send('session:restore', {
            tabs,
            activeTabId: session.active_tab_id
          });
        });
      }
    } catch (err) {
      console.warn('[Nova] restoreSession error, falling back to new window:', err);
      this.createWindow();
    }
  }

  saveAllSessions() {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO sessions (id, window_id, tabs_json, active_tab_id, is_incognito, created_at, updated_at)
      VALUES (@id, @window_id, @tabs_json, @active_tab_id, @is_incognito, @created_at, @updated_at)
    `);

    for (const [windowId, data] of this.windows) {
      if (data.isIncognito) continue;
      const win = data.win;
      if (!win || win.isDestroyed()) continue;
    }
  }

  saveSession(windowId, tabs, activeTabId, isIncognito = false) {
    if (isIncognito) return;

    const db = getDatabase();
    const now = Date.now();
    const existing = db.prepare('SELECT id, created_at FROM sessions WHERE window_id = ?').get(windowId);

    db.prepare(`
      INSERT OR REPLACE INTO sessions (id, window_id, tabs_json, active_tab_id, is_incognito, created_at, updated_at)
      VALUES (@id, @window_id, @tabs_json, @active_tab_id, @is_incognito, @created_at, @updated_at)
    `).run({
      id: existing?.id || uuidv4(),
      window_id: windowId,
      tabs_json: JSON.stringify(tabs),
      active_tab_id: activeTabId,
      is_incognito: isIncognito ? 1 : 0,
      created_at: existing?.created_at ?? now,
      updated_at: now
    });
  }
}

module.exports = { WindowManager };
