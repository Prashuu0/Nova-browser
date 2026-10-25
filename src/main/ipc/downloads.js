const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../database');
const { ipcMain, session } = require('electron');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

const activeDownloads = new Map();

function getDownloadsPath() {
  return path.join(app.getPath('downloads'), 'Nova Browser');
}

function ensureDownloadsDir() {
  const dir = getDownloadsPath();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function registerDownloadHandlers() {
  ensureDownloadsDir();

  ipcMain.handle('downloads:getAll', () => {
    const db = getDatabase();
    return db.prepare('SELECT * FROM downloads ORDER BY start_time DESC').all();
  });

  ipcMain.handle('downloads:start', async (event, { url, filename }) => {
    const db = getDatabase();
    const id = uuidv4();
    const now = Date.now();
    const downloadDir = ensureDownloadsDir();
    const savePath = path.join(downloadDir, filename || `download-${id}`);

    db.prepare(`
      INSERT INTO downloads (id, filename, url, path, state, start_time)
      VALUES (@id, @filename, @url, @path, 'progressing', @start_time)
    `).run({
      id,
      filename: filename || path.basename(savePath),
      url,
      path: savePath,
      start_time: now
    });

    const win = require('electron').BrowserWindow.fromWebContents(event.sender);

    session.defaultSession.downloadURL(url);

    session.defaultSession.once('will-download', (e, item) => {
      item.setSavePath(savePath);
      activeDownloads.set(id, item);

      item.on('updated', () => {
        const state = item.isPaused() ? 'paused' : 'progressing';
        db.prepare(`
          UPDATE downloads SET received_bytes = ?, size = ?, state = ? WHERE id = ?
        `).run(item.getReceivedBytes(), item.getTotalBytes(), state, id);

        win?.webContents.send('downloads:progress', {
          id,
          receivedBytes: item.getReceivedBytes(),
          totalBytes: item.getTotalBytes(),
          state
        });
      });

      item.once('done', (e, state) => {
        activeDownloads.delete(id);
        const endTime = Date.now();
        db.prepare(`
          UPDATE downloads SET state = ?, end_time = ?, error = ? WHERE id = ?
        `).run(state, endTime, state === 'interrupted' ? 'Download interrupted' : null, id);

        win?.webContents.send('downloads:complete', { id, state, path: savePath });
      });
    });

    return { id, path: savePath };
  });

  ipcMain.handle('downloads:pause', (_, id) => {
    const item = activeDownloads.get(id);
    if (item) item.pause();
    return { success: true };
  });

  ipcMain.handle('downloads:resume', (_, id) => {
    const item = activeDownloads.get(id);
    if (item) item.resume();
    return { success: true };
  });

  ipcMain.handle('downloads:cancel', (_, id) => {
    const item = activeDownloads.get(id);
    if (item) item.cancel();
    const db = getDatabase();
    db.prepare('UPDATE downloads SET state = ? WHERE id = ?').run('cancelled', id);
    return { success: true };
  });

  ipcMain.handle('downloads:open', (_, filePath) => {
    const { shell } = require('electron');
    shell.openPath(filePath);
    return { success: true };
  });

  ipcMain.handle('downloads:showInFolder', (_, filePath) => {
    const { shell } = require('electron');
    shell.showItemInFolder(filePath);
    return { success: true };
  });

  ipcMain.handle('downloads:remove', (_, id) => {
    const db = getDatabase();
    db.prepare('DELETE FROM downloads WHERE id = ?').run(id);
    return { success: true };
  });
}

module.exports = { registerDownloadHandlers };
