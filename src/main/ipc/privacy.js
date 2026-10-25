const { ipcMain } = require('electron');
const { getDatabase } = require('../database');
const { getNovaSession } = require('../services/sessionManager');
const { setAdBlockerEnabled } = require('../services/adBlocker');
const { setTrackerBlockerEnabled, getTrackerStats } = require('../services/trackerBlocker');
const { getPrivacyStats } = require('../services/privacyStatsService');
const { setupFingerprintHeaders } = require('../services/fingerprintProtection');
const Store = require('electron-store');
const settingsStore = new Store({ name: 'nova-settings' });

function registerPrivacyHandlers() {
  const getSession = () => getNovaSession();

  ipcMain.handle('privacy:clearCache', async () => {
    await getSession().clearCache();
    return { success: true };
  });

  ipcMain.handle('privacy:clearCookies', async () => {
    await getSession().clearStorageData({ storages: ['cookies'] });
    return { success: true };
  });

  ipcMain.handle('privacy:clearAll', async () => {
    await getSession().clearStorageData();
    await getSession().clearCache();
    return { success: true };
  });

  ipcMain.handle('privacy:getTrackerStats', () => getTrackerStats());
  ipcMain.handle('privacy:getPrivacyStats', () => getPrivacyStats());

  ipcMain.handle('privacy:getCookieCount', async () => {
    const cookies = await getSession().cookies.get({});
    return cookies.length;
  });

  ipcMain.handle('privacy:setAdBlocker', (_, enabled) => {
    setAdBlockerEnabled(enabled);
    return { success: true, enabled };
  });

  ipcMain.handle('privacy:setTrackerBlocker', (_, enabled) => {
    setTrackerBlockerEnabled(enabled);
    return { success: true, enabled };
  });

  ipcMain.handle('privacy:setFingerprintProtection', (_, enabled) => {
    settingsStore.set('fingerprintProtection', enabled);
    const { getNovaSession, getIncognitoSession } = require('../services/sessionManager');
    if (enabled) {
      setupFingerprintHeaders(getNovaSession(), true);
      setupFingerprintHeaders(getIncognitoSession(), true);
    }
    return { success: true };
  });
}

module.exports = { registerPrivacyHandlers };
