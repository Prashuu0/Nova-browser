const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('novaAPI', {
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
    newIncognito: () => ipcRenderer.invoke('window:newIncognito'),
    onInit: (callback) => {
      ipcRenderer.on('window:init', (_, data) => callback(data));
      return () => ipcRenderer.removeAllListeners('window:init');
    }
  },

  app: {
    getVersion: () => ipcRenderer.invoke('app:getVersion')
  },

  navigation: {
    resolveUrl: (input) => ipcRenderer.invoke('navigation:resolveUrl', input),
    sanitizeUrl: (url) => ipcRenderer.invoke('navigation:sanitizeUrl', url),
    validateUrl: (url) => ipcRenderer.invoke('navigation:validateUrl', url),
    getSearchSuggestions: (query) => ipcRenderer.invoke('navigation:getSearchSuggestions', query),
    performSearch: (payload) => ipcRenderer.invoke('navigation:performSearch', payload)
  },

  search: {
    query: (q, type) => {
      const payload =
        q && typeof q === 'object' && !Array.isArray(q)
          ? q
          : { query: String(q || ''), type: type || 'all' };
      return ipcRenderer.invoke('search:query', payload);
    },
    suggestions: (q) => ipcRenderer.invoke('search:suggestions', q)
  },

  bookmarks: {
    getAll: () => ipcRenderer.invoke('bookmarks:getAll'),
    add: (bookmark) => ipcRenderer.invoke('bookmarks:add', bookmark),
    remove: (id) => ipcRenderer.invoke('bookmarks:remove', id),
    update: (bookmark) => ipcRenderer.invoke('bookmarks:update', bookmark),
    isBookmarked: (url) => ipcRenderer.invoke('bookmarks:isBookmarked', url)
  },

  history: {
    getAll: (options) => ipcRenderer.invoke('history:getAll', options),
    add: (entry) => ipcRenderer.invoke('history:add', entry),
    remove: (id) => ipcRenderer.invoke('history:remove', id),
    clear: () => ipcRenderer.invoke('history:clear'),
    getRecent: (limit) => ipcRenderer.invoke('history:getRecent', limit)
  },

  downloads: {
    getAll: () => ipcRenderer.invoke('downloads:getAll'),
    start: (data) => ipcRenderer.invoke('downloads:start', data),
    pause: (id) => ipcRenderer.invoke('downloads:pause', id),
    resume: (id) => ipcRenderer.invoke('downloads:resume', id),
    cancel: (id) => ipcRenderer.invoke('downloads:cancel', id),
    open: (path) => ipcRenderer.invoke('downloads:open', path),
    showInFolder: (path) => ipcRenderer.invoke('downloads:showInFolder', path),
    remove: (id) => ipcRenderer.invoke('downloads:remove', id),
    onProgress: (callback) => {
      ipcRenderer.on('downloads:progress', (_, data) => callback(data));
      return () => ipcRenderer.removeAllListeners('downloads:progress');
    },
    onComplete: (callback) => {
      ipcRenderer.on('downloads:complete', (_, data) => callback(data));
      return () => ipcRenderer.removeAllListeners('downloads:complete');
    }
  },

  passwords: {
    getAll: () => ipcRenderer.invoke('passwords:getAll'),
    save: (data) => ipcRenderer.invoke('passwords:save', data),
    get: (id) => ipcRenderer.invoke('passwords:get', id),
    remove: (id) => ipcRenderer.invoke('passwords:remove', id),
    getForOrigin: (origin) => ipcRenderer.invoke('passwords:getForOrigin', origin),
    getCredentialsForOrigin: (origin) => ipcRenderer.invoke('passwords:getCredentialsForOrigin', origin),
    generate: (length) => ipcRenderer.invoke('passwords:generate', length)
  },

  settings: {
    getAll: () => ipcRenderer.invoke('settings:getAll'),
    get: (key) => ipcRenderer.invoke('settings:get', key),
    set: (key, value) => ipcRenderer.invoke('settings:set', key, value),
    setMultiple: (settings) => ipcRenderer.invoke('settings:setMultiple', settings),
    reset: () => ipcRenderer.invoke('settings:reset')
  },

  sessions: {
    save: (data) => ipcRenderer.invoke('sessions:save', data),
    getAll: () => ipcRenderer.invoke('sessions:getAll'),
    clear: () => ipcRenderer.invoke('sessions:clear'),
    onRestore: (callback) => {
      ipcRenderer.on('session:restore', (_, data) => callback(data));
      return () => ipcRenderer.removeAllListeners('session:restore');
    }
  },

  ai: {
    chat: (data) => ipcRenderer.invoke('ai:chat', data),
    summarize: (data) => ipcRenderer.invoke('ai:summarize', data),
    explain: (data) => ipcRenderer.invoke('ai:explain', data),
    explainCode: (data) => ipcRenderer.invoke('ai:explainCode', data),
    search: (data) => ipcRenderer.invoke('ai:search', data),
    write: (data) => ipcRenderer.invoke('ai:write', data),
    research: (data) => ipcRenderer.invoke('ai:research', data),
    testConnection: (data) => ipcRenderer.invoke('ai:testConnection', data),
    getConversations: () => ipcRenderer.invoke('ai:getConversations'),
    saveConversation: (data) => ipcRenderer.invoke('ai:saveConversation', data),
    deleteConversation: (id) => ipcRenderer.invoke('ai:deleteConversation', id)
  },

  privacy: {
    clearCache: () => ipcRenderer.invoke('privacy:clearCache'),
    clearCookies: () => ipcRenderer.invoke('privacy:clearCookies'),
    clearAll: () => ipcRenderer.invoke('privacy:clearAll'),
    getTrackerStats: () => ipcRenderer.invoke('privacy:getTrackerStats'),
    getPrivacyStats: () => ipcRenderer.invoke('privacy:getPrivacyStats'),
    onStatsUpdated: (callback) => {
      const handler = (_, data) => callback(data);
      ipcRenderer.on('privacy:stats-updated', handler);
      return () => ipcRenderer.removeListener('privacy:stats-updated', handler);
    },
    getCookieCount: () => ipcRenderer.invoke('privacy:getCookieCount'),
    setFingerprintProtection: (enabled) => ipcRenderer.invoke('privacy:setFingerprintProtection', enabled),
    setAdBlocker: (enabled) => ipcRenderer.invoke('privacy:setAdBlocker', enabled),
    setTrackerBlocker: (enabled) => ipcRenderer.invoke('privacy:setTrackerBlocker', enabled)
  },

  browser: {
    findInPage: (webContentsId, text, options) =>
      ipcRenderer.invoke('browser:findInPage', webContentsId, text, options),
    stopFindInPage: (webContentsId, action) =>
      ipcRenderer.invoke('browser:stopFindInPage', webContentsId, action),
    print: (webContentsId) => ipcRenderer.invoke('browser:print', webContentsId),
    openDevTools: (webContentsId) => ipcRenderer.invoke('browser:openDevTools', webContentsId),
    setZoom: (webContentsId, factor) => ipcRenderer.invoke('browser:setZoom', webContentsId, factor),
    getZoom: (webContentsId) => ipcRenderer.invoke('browser:getZoom', webContentsId),
    capturePage: (webContentsId) => ipcRenderer.invoke('browser:capturePage', webContentsId),
    saveScreenshot: (dataUrl) => ipcRenderer.invoke('browser:saveScreenshot', dataUrl),
    copyScreenshot: (dataUrl) => ipcRenderer.invoke('browser:copyScreenshot', dataUrl),
    getExtensionScripts: (url) => ipcRenderer.invoke('browser:getExtensionScripts', url)
  },

  tabBrowser: {
    setBounds: (bounds) => ipcRenderer.invoke('tabBrowser:setBounds', bounds),
    show: (payload) => ipcRenderer.invoke('tabBrowser:show', payload),
    hide: () => ipcRenderer.invoke('tabBrowser:hide'),
    reload: (tabId) => ipcRenderer.invoke('tabBrowser:reload', tabId),
    stop: (tabId) => ipcRenderer.invoke('tabBrowser:stop', tabId),
    goBack: (tabId) => ipcRenderer.invoke('tabBrowser:goBack', tabId),
    goForward: (tabId) => ipcRenderer.invoke('tabBrowser:goForward', tabId),
    getWebContentsId: (tabId) => ipcRenderer.invoke('tabBrowser:getWebContentsId', tabId),
    executeJavaScript: (tabId, script) =>
      ipcRenderer.invoke('tabBrowser:executeJavaScript', { tabId, script }),
    remove: (tabId) => ipcRenderer.invoke('tabBrowser:remove', tabId),
    on: (channel, callback) => ipcRenderer.on(channel, callback),
    off: (channel) => ipcRenderer.removeAllListeners(channel)
  },

  translate: {
    text: (data) => ipcRenderer.invoke('translate:text', data)
  },

  siteSettings: {
    get: (origin) => ipcRenderer.invoke('siteSettings:get', origin),
    set: (data) => ipcRenderer.invoke('siteSettings:set', data),
    getAll: () => ipcRenderer.invoke('siteSettings:getAll')
  },

  account: {
    get: () => ipcRenderer.invoke('account:get'),
    signUp: (data) => ipcRenderer.invoke('account:signUp', data),
    signIn: (data) => ipcRenderer.invoke('account:signIn', data),
    signOut: () => ipcRenderer.invoke('account:signOut'),
    forgotPassword: (email) => ipcRenderer.invoke('account:forgotPassword', email),
    resetPassword: (data) => ipcRenderer.invoke('account:resetPassword', data)
  },

  cloud: {
    getConfig: () => ipcRenderer.invoke('cloud:getConfig'),
    setApiBase: (url) => ipcRenderer.invoke('cloud:setApiBase', url),
    onSyncComplete: (callback) => {
      const handler = (_, data) => callback(data);
      ipcRenderer.on('cloud:sync-complete', handler);
      return () => ipcRenderer.removeListener('cloud:sync-complete', handler);
    }
  },

  sync: {
    export: (data) => ipcRenderer.invoke('sync:export', data),
    import: (data) => ipcRenderer.invoke('sync:import', data),
    cloudPush: (data) => ipcRenderer.invoke('sync:cloudPush', data),
    cloudPull: () => ipcRenderer.invoke('sync:cloudPull'),
    cloudStatus: () => ipcRenderer.invoke('sync:cloudStatus')
  },

  extensions: {
    getAll: () => ipcRenderer.invoke('extensions:getAll'),
    toggle: (data) => ipcRenderer.invoke('extensions:toggle', data),
    openFolder: () => ipcRenderer.invoke('extensions:openFolder'),
    getCatalog: () => ipcRenderer.invoke('extensions:getCatalog'),
    installFromStore: (data) => ipcRenderer.invoke('extensions:installFromStore', data),
    installUnpacked: () => ipcRenderer.invoke('extensions:installUnpacked'),
    installZip: () => ipcRenderer.invoke('extensions:installZip'),
    installCrx: () => ipcRenderer.invoke('extensions:installCrx'),
    installChromeId: (extensionId) => ipcRenderer.invoke('extensions:installChromeId', { extensionId })
  },

  update: {
    check: () => ipcRenderer.invoke('update:check'),
    download: () => ipcRenderer.invoke('update:download'),
    install: () => ipcRenderer.invoke('update:install'),
    onAvailable: (callback) => {
      ipcRenderer.on('update:available', (_, data) => callback(data));
      return () => ipcRenderer.removeAllListeners('update:available');
    }
  },

  autofill: {
    getAddresses: () => ipcRenderer.invoke('autofill:getAddresses'),
    saveAddress: (data) => ipcRenderer.invoke('autofill:saveAddress', data),
    removeAddress: (id) => ipcRenderer.invoke('autofill:removeAddress', id),
    getCards: () => ipcRenderer.invoke('autofill:getCards'),
    saveCard: (data) => ipcRenderer.invoke('autofill:saveCard', data),
    getScriptsForPage: (url) => ipcRenderer.invoke('autofill:getScriptsForPage', url)
  },

  vpn: {
    getStatus: () => ipcRenderer.invoke('vpn:getStatus'),
    connect: () => ipcRenderer.invoke('vpn:connect'),
    disconnect: () => ipcRenderer.invoke('vpn:disconnect'),
    importConfig: () => ipcRenderer.invoke('vpn:importConfig'),
    getServers: () => ipcRenderer.invoke('vpn:getServers'),
    useServer: (serverId) => ipcRenderer.invoke('vpn:useServer', { serverId })
  },

  email: {
    getInbox: () => ipcRenderer.invoke('email:getInbox'),
    send: (payload) => ipcRenderer.invoke('email:send', payload)
  },

  drive: {
    list: () => ipcRenderer.invoke('drive:list'),
    upload: (payload) => ipcRenderer.invoke('drive:upload', payload),
    uploadFile: (filePath) => ipcRenderer.invoke('drive:uploadFile', filePath),
    download: (id) => ipcRenderer.invoke('drive:download', id)
  },

  searchIndex: {
    sync: () => ipcRenderer.invoke('search:syncIndex')
  },

  filters: {
    load: () => ipcRenderer.invoke('filters:load'),
    getStats: () => ipcRenderer.invoke('filters:getStats')
  },

  shell: {
    openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url)
  },

  feedback: {
    submit: (data) => ipcRenderer.invoke('feedback:submit', data),
    crash: (data) => ipcRenderer.invoke('feedback:crash', data)
  },

  analytics: {
    track: (eventType, eventData) => ipcRenderer.invoke('analytics:track', { eventType, eventData }),
    getDashboard: () => ipcRenderer.invoke('analytics:getDashboard')
  },

  dialog: {
    openFile: (options) => ipcRenderer.invoke('dialog:openFile', options),
    saveFile: (options) => ipcRenderer.invoke('dialog:saveFile', options)
  }
});
