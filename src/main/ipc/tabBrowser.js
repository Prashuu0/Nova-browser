const { ipcMain, BrowserWindow } = require('electron');
const browserViewManager = require('../services/browserViewManager');

function getWindow(event) {
  return BrowserWindow.fromWebContents(event.sender);
}

function registerTabBrowserHandlers() {
  ipcMain.handle('tabBrowser:setBounds', (event, bounds) => {
    const win = getWindow(event);
    if (win) browserViewManager.setBounds(win, bounds);
    return { success: true };
  });

  ipcMain.handle('tabBrowser:show', (event, payload) => {
    const win = getWindow(event);
    if (!win) return { success: false, error: 'No window' };
    return browserViewManager.show(win, payload);
  });

  ipcMain.handle('tabBrowser:hide', (event) => {
    const win = getWindow(event);
    if (win) browserViewManager.hide(win);
    return { success: true };
  });

  ipcMain.handle('tabBrowser:reload', (_, tabId) => {
    browserViewManager.reload(tabId);
    return { success: true };
  });

  ipcMain.handle('tabBrowser:stop', (_, tabId) => {
    browserViewManager.stop(tabId);
    return { success: true };
  });

  ipcMain.handle('tabBrowser:goBack', (_, tabId) => ({
    success: browserViewManager.goBack(tabId)
  }));

  ipcMain.handle('tabBrowser:goForward', (_, tabId) => ({
    success: browserViewManager.goForward(tabId)
  }));

  ipcMain.handle('tabBrowser:getWebContentsId', (_, tabId) => ({
    webContentsId: browserViewManager.getWebContentsId(tabId)
  }));

  ipcMain.handle('tabBrowser:executeJavaScript', async (_, { tabId, script }) => ({
    result: await browserViewManager.executeJavaScript(tabId, script)
  }));

  ipcMain.handle('tabBrowser:remove', (_, tabId) => {
    browserViewManager.removeTab(tabId);
    return { success: true };
  });
}

module.exports = { registerTabBrowserHandlers };
