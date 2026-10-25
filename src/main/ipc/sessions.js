const { ipcMain } = require('electron');
const { getDatabase } = require('../database');

let windowManagerRef = null;

function setWindowManager(wm) {
  windowManagerRef = wm;
}

function registerSessionHandlers() {
  ipcMain.handle('sessions:save', (_, { windowId, tabs, activeTabId, isIncognito }) => {
    if (windowManagerRef && windowId) {
      windowManagerRef.saveSession(windowId, tabs, activeTabId, isIncognito);
    }
    return { success: true };
  });

  ipcMain.handle('sessions:getAll', () => {
    const db = getDatabase();
    return db.prepare('SELECT * FROM sessions ORDER BY updated_at DESC').all();
  });

  ipcMain.handle('sessions:clear', () => {
    const db = getDatabase();
    db.prepare('DELETE FROM sessions').run();
    return { success: true };
  });
}

module.exports = { registerSessionHandlers, setWindowManager };
