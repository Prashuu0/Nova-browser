let autoUpdater = null;

function initUpdater(mainWindow) {
  if (process.env.NODE_ENV === 'development' || !require('electron').app.isPackaged) {
    return { available: false, reason: 'dev' };
  }

  try {
    autoUpdater = require('electron-updater').autoUpdater;
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;

    autoUpdater.on('update-available', (info) => {
      mainWindow?.webContents?.send('update:available', info);
    });
    autoUpdater.on('update-downloaded', (info) => {
      mainWindow?.webContents?.send('update:downloaded', info);
    });
    autoUpdater.on('error', (err) => {
      console.error('Updater error:', err.message);
    });

    autoUpdater.checkForUpdates().catch(() => {});
    return { available: true };
  } catch {
    return { available: false, reason: 'not_installed' };
  }
}

function checkForUpdates() {
  if (!autoUpdater) return { error: 'Updater not available in dev mode' };
  return autoUpdater.checkForUpdates();
}

function downloadUpdate() {
  if (!autoUpdater) return { error: 'Updater not available' };
  return autoUpdater.downloadUpdate();
}

function installUpdate() {
  if (!autoUpdater) return { error: 'Updater not available' };
  autoUpdater.quitAndInstall();
  return { success: true };
}

module.exports = { initUpdater, checkForUpdates, downloadUpdate, installUpdate };
