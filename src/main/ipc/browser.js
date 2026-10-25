const { ipcMain, webContents, desktopCapturer, nativeImage, clipboard } = require('electron');
const fs = require('fs');
const path = require('path');
const { app, dialog } = require('electron');

function registerBrowserHandlers() {
  ipcMain.handle('browser:findInPage', (_, webContentsId, text, options = {}) => {
    const wc = webContents.fromId(webContentsId);
    if (!wc) return { error: 'No web contents' };
    const requestId = wc.findInPage(text, {
      forward: options.forward !== false,
      findNext: options.findNext !== false,
      matchCase: !!options.matchCase
    });
    return { requestId };
  });

  ipcMain.handle('browser:stopFindInPage', (_, webContentsId, action = 'clearSelection') => {
    const wc = webContents.fromId(webContentsId);
    if (wc) wc.stopFindInPage(action);
    return { success: true };
  });

  ipcMain.handle('browser:print', (_, webContentsId) => {
    const wc = webContents.fromId(webContentsId);
    if (wc) wc.print({ silent: false });
    return { success: true };
  });

  ipcMain.handle('browser:openDevTools', (_, webContentsId) => {
    const wc = webContents.fromId(webContentsId);
    if (wc) wc.openDevTools({ mode: 'detach' });
    return { success: true };
  });

  ipcMain.handle('browser:setZoom', (_, webContentsId, factor) => {
    const wc = webContents.fromId(webContentsId);
    if (wc) wc.setZoomFactor(factor);
    return { success: true };
  });

  ipcMain.handle('browser:getZoom', (_, webContentsId) => {
    const wc = webContents.fromId(webContentsId);
    return wc ? wc.getZoomFactor() : 1;
  });

  ipcMain.handle('browser:capturePage', async (_, webContentsId) => {
    const wc = webContents.fromId(webContentsId);
    if (!wc) return { error: 'No web contents' };
    const image = await wc.capturePage();
    return { dataUrl: image.toDataURL() };
  });

  ipcMain.handle('browser:saveScreenshot', async (_, dataUrl) => {
    const result = await dialog.showSaveDialog({
      title: 'Save Screenshot',
      defaultPath: path.join(app.getPath('pictures'), `nova-screenshot-${Date.now()}.png`),
      filters: [{ name: 'PNG Image', extensions: ['png'] }]
    });
    if (result.canceled || !result.filePath) return { canceled: true };
    const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '');
    fs.writeFileSync(result.filePath, Buffer.from(base64, 'base64'));
    return { path: result.filePath };
  });

  ipcMain.handle('browser:copyScreenshot', (_, dataUrl) => {
    const image = nativeImage.createFromDataURL(dataUrl);
    clipboard.writeImage(image);
    return { success: true };
  });

  ipcMain.handle('browser:getExtensionScripts', async (_, url) => {
    const { getContentScriptsForUrl } = require('../services/extensionManager');
    return getContentScriptsForUrl(url);
  });
}

module.exports = { registerBrowserHandlers };
