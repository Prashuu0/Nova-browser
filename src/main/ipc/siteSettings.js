const { ipcMain } = require('electron');
const { getSiteSettings, setSiteSettings, getAllSiteSettings } = require('../services/siteSettings');

function registerSiteSettingsHandlers() {
  ipcMain.handle('siteSettings:get', (_, origin) => getSiteSettings(origin));
  ipcMain.handle('siteSettings:set', (_, { origin, settings }) => setSiteSettings(origin, settings));
  ipcMain.handle('siteSettings:getAll', () => getAllSiteSettings());
}

module.exports = { registerSiteSettingsHandlers };
