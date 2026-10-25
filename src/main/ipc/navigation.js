const { ipcMain } = require('electron');
const { validateUrl, resolveSearchQuery, sanitizeUrl } = require('../security/urlValidator');
const { performNovaSearch, getSearchSuggestions } = require('../services/novaSearch');

function registerNavigationHandlers() {
  ipcMain.handle('navigation:resolveUrl', (_, input) => {
    return resolveSearchQuery(input);
  });

  ipcMain.handle('navigation:sanitizeUrl', (_, url) => {
    return sanitizeUrl(url);
  });

  ipcMain.handle('navigation:validateUrl', (_, url) => {
    return validateUrl(url);
  });

  ipcMain.handle('navigation:getSearchSuggestions', async (_, query) => {
    return getSearchSuggestions(query);
  });

  ipcMain.removeHandler('navigation:performSearch');
  ipcMain.handle('navigation:performSearch', async (_, payload = {}) => {
    const query = payload?.query ?? '';
    const type = payload?.type || 'all';
    return performNovaSearch(query, type);
  });
}

module.exports = { registerNavigationHandlers };
