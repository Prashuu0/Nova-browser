const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../database');
const { ipcMain } = require('electron');

function registerBookmarkHandlers() {
  ipcMain.handle('bookmarks:getAll', () => {
    const db = getDatabase();
    return db.prepare('SELECT * FROM bookmarks ORDER BY created_at DESC').all();
  });

  ipcMain.handle('bookmarks:add', (_, bookmark) => {
    const db = getDatabase();
    const now = Date.now();
    const id = uuidv4();
    db.prepare(`
      INSERT INTO bookmarks (id, title, url, favicon, folder, created_at, updated_at)
      VALUES (@id, @title, @url, @favicon, @folder, @created_at, @updated_at)
    `).run({
      id,
      title: bookmark.title,
      url: bookmark.url,
      favicon: bookmark.favicon || null,
      folder: bookmark.folder || 'default',
      created_at: now,
      updated_at: now
    });
    return { id, ...bookmark, created_at: now, updated_at: now };
  });

  ipcMain.handle('bookmarks:remove', (_, id) => {
    const db = getDatabase();
    db.prepare('DELETE FROM bookmarks WHERE id = ?').run(id);
    return { success: true };
  });

  ipcMain.handle('bookmarks:update', (_, bookmark) => {
    const db = getDatabase();
    const now = Date.now();
    db.prepare(`
      UPDATE bookmarks SET title = @title, url = @url, favicon = @favicon, folder = @folder, updated_at = @updated_at
      WHERE id = @id
    `).run({ ...bookmark, updated_at: now });
    return { ...bookmark, updated_at: now };
  });

  ipcMain.handle('bookmarks:isBookmarked', (_, url) => {
    const db = getDatabase();
    const result = db.prepare('SELECT id FROM bookmarks WHERE url = ?').get(url);
    return !!result;
  });
}

module.exports = { registerBookmarkHandlers };
