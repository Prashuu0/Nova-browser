const { BrowserWindow } = require('electron');
const cloudClient = require('./cloudClient');
const { cloudPull, cloudPush } = require('./syncService');

let ws = null;
let syncInterval = null;
let lastTabs = [];
let lastActiveTabId = null;

function notifyRenderer(channel, data) {
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send(channel, data);
  }
}

async function runCloudPull() {
  const session = cloudClient.getSession();
  if (!session.accessToken) return null;
  const result = await cloudPull();
  if (result.success) {
    notifyRenderer('cloud:sync-complete', {
      items: result.items,
      tabs: result.tabs,
      activeTabId: result.activeTabId,
      syncedAt: Date.now()
    });
  }
  return result;
}

async function runCloudPush(tabs, activeTabId) {
  const session = cloudClient.getSession();
  if (!session.accessToken) return { error: 'Not signed in' };
  lastTabs = tabs || lastTabs;
  lastActiveTabId = activeTabId ?? lastActiveTabId;
  return cloudPush(lastTabs, lastActiveTabId);
}

function startCloudSync() {
  stopCloudSync();
  const session = cloudClient.getSession();
  if (!session.accessToken) return;

  ws = cloudClient.connectSyncSocket((msg) => {
    if (msg.type === 'sync:updated' || msg.type === 'sync:pull-request') {
      runCloudPull();
    }
  });

  syncInterval = setInterval(() => runCloudPush(lastTabs, lastActiveTabId), 5 * 60 * 1000);

  runCloudPull();
}

function stopCloudSync() {
  if (ws) {
    try { ws.close(); } catch {}
    ws = null;
  }
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}

function setTabsForSync(tabs, activeTabId) {
  lastTabs = tabs || [];
  if (activeTabId) lastActiveTabId = activeTabId;
}

module.exports = { startCloudSync, stopCloudSync, runCloudPull, runCloudPush, setTabsForSync, notifyRenderer };
