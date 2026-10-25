const { ipcMain } = require('electron');
const { loadFilterLists, getStats } = require('../services/filterLists');

function registerFilterHandlers() {
  ipcMain.handle('filters:load', async () => {
    return loadFilterLists();
  });

  ipcMain.handle('filters:getStats', () => {
    return getStats();
  });
}

module.exports = { registerFilterHandlers };
