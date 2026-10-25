const { ipcMain, dialog } = require('electron');
const { exportSync, importSync, cloudStatus } = require('../services/syncService');
const { getAccount, signUp, signIn, signOut, forgotPassword, resetPassword } = require('../services/accountService');
const cloudClient = require('../services/cloudClient');
const cloudSync = require('../services/cloudSyncService');
const { getAllExtensions, toggleExtension, openExtensionsFolder, installFromCatalog, installFromZip, installFromCrx, installFromChromeId, installUnpackedFolder } = require('../services/extensionManager');
const { checkForUpdates, downloadUpdate, installUpdate } = require('../services/updaterService');
const vpnService = require('../services/vpnService');

function registerPlatformHandlers() {
  ipcMain.handle('account:get', () => getAccount());
  ipcMain.handle('account:signUp', async (_, data) => {
    const r = await signUp(data);
    if (r.success) cloudSync.startCloudSync();
    return r;
  });
  ipcMain.handle('account:signIn', async (_, data) => {
    const r = await signIn(data);
    if (r.success) cloudSync.startCloudSync();
    return r;
  });
  ipcMain.handle('account:signOut', async () => {
    cloudSync.stopCloudSync();
    return signOut();
  });
  ipcMain.handle('account:forgotPassword', (_, email) => forgotPassword(email));
  ipcMain.handle('account:resetPassword', (_, data) => resetPassword(data.token, data.password));

  ipcMain.handle('cloud:getConfig', () => ({
    apiBase: cloudClient.getApiBase(),
    deviceId: cloudClient.getDeviceId(),
    session: cloudClient.getSession()
  }));
  ipcMain.handle('cloud:setApiBase', (_, url) => {
    cloudClient.setApiBase(url);
    return { success: true };
  });

  ipcMain.handle('sync:export', async (_, { passphrase }) => {
    const result = await dialog.showSaveDialog({
      title: 'Export Nova Sync',
      defaultPath: `nova-sync-${Date.now()}.novasync`,
      filters: [{ name: 'Nova Sync', extensions: ['novasync'] }]
    });
    if (result.canceled || !result.filePath) return { canceled: true };
    return exportSync(passphrase, result.filePath);
  });

  ipcMain.handle('sync:import', async (_, { passphrase }) => {
    const result = await dialog.showOpenDialog({
      title: 'Import Nova Sync',
      filters: [{ name: 'Nova Sync', extensions: ['novasync'] }],
      properties: ['openFile']
    });
    if (result.canceled || !result.filePaths?.[0]) return { canceled: true };
    return importSync(passphrase, result.filePaths[0]);
  });

  ipcMain.handle('sync:cloudPush', async (_, { tabs, activeTabId }) => {
    cloudSync.setTabsForSync(tabs, activeTabId);
    return cloudSync.runCloudPush(tabs, activeTabId);
  });
  ipcMain.handle('sync:cloudPull', () => cloudSync.runCloudPull());
  ipcMain.handle('sync:cloudStatus', () => cloudStatus());

  ipcMain.handle('extensions:getAll', () => getAllExtensions());
  ipcMain.handle('extensions:toggle', (_, { id, enabled }) => toggleExtension(id, enabled));
  ipcMain.handle('extensions:openFolder', () => openExtensionsFolder());
  ipcMain.handle('extensions:getCatalog', () => cloudClient.getExtensionCatalog());
  ipcMain.handle('extensions:installFromStore', async (_, { extensionId }) => {
    const catalog = await cloudClient.getExtensionCatalog();
    const ext = catalog.extensions?.find((e) => e.id === extensionId);
    if (!ext) return { error: 'Extension not found in catalog' };
    const local = installFromCatalog(ext);
    if (local.success) {
      await cloudClient.installExtension(extensionId).catch(() => {});
    }
    return local;
  });
  ipcMain.handle('extensions:installUnpacked', async () => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
    if (result.canceled || !result.filePaths?.[0]) return { canceled: true };
    return installUnpackedFolder(result.filePaths[0]);
  });
  ipcMain.handle('extensions:installZip', async () => {
    const result = await dialog.showOpenDialog({
      filters: [{ name: 'Extension Zip', extensions: ['zip'] }],
      properties: ['openFile']
    });
    if (result.canceled || !result.filePaths?.[0]) return { canceled: true };
    return installFromZip(result.filePaths[0]);
  });
  ipcMain.handle('extensions:installCrx', async () => {
    const result = await dialog.showOpenDialog({
      filters: [{ name: 'Chrome Extension', extensions: ['crx'] }],
      properties: ['openFile']
    });
    if (result.canceled || !result.filePaths?.[0]) return { canceled: true };
    return installFromCrx(result.filePaths[0]);
  });
  ipcMain.handle('extensions:installChromeId', async (_, { extensionId }) => {
    if (!extensionId?.trim()) return { error: 'Extension ID required' };
    return installFromChromeId(extensionId.trim());
  });

  ipcMain.handle('vpn:getStatus', () => vpnService.getStatus());
  ipcMain.handle('vpn:connect', () => vpnService.connect());
  ipcMain.handle('vpn:disconnect', () => vpnService.disconnect());
  ipcMain.handle('vpn:importConfig', async () => {
    const result = await dialog.showOpenDialog({
      filters: [{ name: 'WireGuard', extensions: ['conf'] }],
      properties: ['openFile']
    });
    if (result.canceled || !result.filePaths?.[0]) return { canceled: true };
    return vpnService.importConfig(result.filePaths[0]);
  });
  ipcMain.handle('vpn:useServer', async (_, { serverId }) => {
    const config = await cloudClient.getVpnConfig(serverId);
    if (config.error) return config;
    return vpnService.saveConfigFromContent(config.filename?.replace('.conf', '') || serverId, config.config);
  });
  ipcMain.handle('vpn:getServers', () => cloudClient.getVpnServers());

  ipcMain.handle('email:getInbox', () => cloudClient.getEmailInbox());
  ipcMain.handle('email:send', (_, payload) => cloudClient.sendEmail(payload));
  ipcMain.handle('drive:list', () => cloudClient.getDriveFiles());
  ipcMain.handle('drive:upload', (_, payload) => cloudClient.uploadDriveFile(payload));
  ipcMain.handle('drive:download', (_, id) => cloudClient.downloadDriveFile(id));
  ipcMain.handle('drive:uploadFile', async (_, filePath) => {
    const fs = require('fs');
    const path = require('path');
    if (!filePath || !fs.existsSync(filePath)) return { error: 'File not found' };
    const buffer = fs.readFileSync(filePath);
    return cloudClient.uploadDriveFile({
      filename: path.basename(filePath),
      contentBase64: buffer.toString('base64'),
      mimeType: 'application/octet-stream'
    });
  });

  ipcMain.handle('search:syncIndex', () => cloudClient.syncSearchIndex());

  ipcMain.handle('analytics:getDashboard', () => cloudClient.getAnalyticsDashboard());
  ipcMain.handle('update:check', () => checkForUpdates());
  ipcMain.handle('update:download', () => downloadUpdate());
  ipcMain.handle('update:install', () => installUpdate());
  ipcMain.handle('feedback:submit', (_, data) => cloudClient.submitFeedback(data));
  ipcMain.handle('feedback:crash', (_, data) => cloudClient.submitCrashReport(data));
  ipcMain.handle('analytics:track', (_, { eventType, eventData }) => cloudClient.trackEvent(eventType, eventData));
}

module.exports = { registerPlatformHandlers };
