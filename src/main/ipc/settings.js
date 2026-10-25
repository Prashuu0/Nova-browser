const Store = require('electron-store');
const { ipcMain } = require('electron');

const defaultSettings = {
  theme: 'system',
  defaultSearchEngine: 'nova',
  homepage: 'nova://newtab',
  language: 'en',
  adBlockerEnabled: true,
  trackerBlockerEnabled: true,
  fingerprintProtection: true,
  doNotTrack: true,
  blockThirdPartyCookies: true,
  clearDataOnExit: false,
  sessionRestore: true,
  downloadPath: '',
  aiProvider: 'gemini',
  aiApiKey: '',
  aiModel: 'gpt-4o-mini',
  ollamaUrl: 'http://localhost:11434',
  ollamaModel: 'llama3',
  geminiApiKey: '',
  geminiModel: 'gemini-2.0-flash',
  showBookmarkBar: true,
  defaultZoom: 100,
  hardwareAcceleration: true,
  spellcheck: true,
  httpsOnlyMode: false,
  tabDiscarding: true
};

const store = new Store({ name: 'nova-settings', defaults: defaultSettings });

if (store.get('defaultSearchEngine') !== 'nova') {
  store.set('defaultSearchEngine', 'nova');
  store.set('homepage', 'nova://newtab');
}

function registerSettingsHandlers() {
  ipcMain.handle('settings:getAll', () => {
    return store.store;
  });

  ipcMain.handle('settings:get', (_, key) => {
    return store.get(key);
  });

  ipcMain.handle('settings:set', (_, key, value) => {
    store.set(key, value);
    return { success: true };
  });

  ipcMain.handle('settings:setMultiple', (_, settings) => {
    for (const [key, value] of Object.entries(settings)) {
      store.set(key, value);
    }
    return { success: true };
  });

  ipcMain.handle('settings:reset', () => {
    store.clear();
    for (const [key, value] of Object.entries(defaultSettings)) {
      store.set(key, value);
    }
    return store.store;
  });
}

module.exports = { registerSettingsHandlers, defaultSettings };
