const { ipcMain } = require('electron');
const { performNovaSearch, getSearchSuggestions } = require('../services/novaSearch');
const cloudClient = require('../services/cloudClient');

async function cloudSearch(query, type) {
  try {
    const base = cloudClient.getApiBase();
    const response = await fetch(`${base}/api/search/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, type })
    });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

function registerSearchHandlers() {
  ipcMain.removeHandler('search:query');
  ipcMain.removeHandler('search:suggestions');

  ipcMain.handle('search:query', async (_, payload = {}) => {
    const query = payload?.query ?? '';
    const type = payload?.type || 'all';
    const cloud = await cloudSearch(query, type);
    if (cloud?.results) return cloud;
    return performNovaSearch(query, type);
  });

  ipcMain.handle('search:suggestions', async (_, query) => {
    try {
      const base = cloudClient.getApiBase();
      const response = await fetch(`${base}/api/search/suggestions?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.suggestions?.length) return data.suggestions;
      }
    } catch {}
    return getSearchSuggestions(query);
  });
}

module.exports = { registerSearchHandlers };
