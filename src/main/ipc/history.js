const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../database');
const { ipcMain } = require('electron');

function registerHistoryHandlers() {
  ipcMain.handle('history:getAll', (_, { limit = 500, offset = 0, search = '' } = {}) => {
    const db = getDatabase();
    if (search) {
      return db.prepare(`
        SELECT * FROM history
        WHERE title LIKE ? OR url LIKE ?
        ORDER BY last_visit DESC LIMIT ? OFFSET ?
      `).all(`%${search}%`, `%${search}%`, limit, offset);
    }
    return db.prepare('SELECT * FROM history ORDER BY last_visit DESC LIMIT ? OFFSET ?').all(limit, offset);
  });

  ipcMain.handle('history:add', (_, entry) => {
    const db = getDatabase();
    const now = Date.now();
    const existing = db.prepare('SELECT * FROM history WHERE url = ?').get(entry.url);

    if (existing) {
      db.prepare(`
        UPDATE history SET title = @title, visit_count = visit_count + 1, last_visit = @last_visit, favicon = @favicon
        WHERE url = @url
      `).run({ title: entry.title, url: entry.url, last_visit: now, favicon: entry.favicon });
      return { ...existing, title: entry.title, visit_count: existing.visit_count + 1, last_visit: now };
    }

    const id = uuidv4();
    db.prepare(`
      INSERT INTO history (id, title, url, favicon, visit_count, last_visit, created_at)
      VALUES (@id, @title, @url, @favicon, 1, @last_visit, @created_at)
    `).run({
      id,
      title: entry.title,
      url: entry.url,
      favicon: entry.favicon || null,
      last_visit: now,
      created_at: now
    });
    return { id, ...entry, visit_count: 1, last_visit: now, created_at: now };
  });

  ipcMain.handle('history:remove', (_, id) => {
    const db = getDatabase();
    db.prepare('DELETE FROM history WHERE id = ?').run(id);
    return { success: true };
  });

  ipcMain.handle('history:clear', () => {
    const db = getDatabase();
    db.prepare('DELETE FROM history').run();
    return { success: true };
  });

  ipcMain.handle('history:getRecent', (_, limit = 10) => {
    const db = getDatabase();
    return db.prepare('SELECT * FROM history ORDER BY last_visit DESC LIMIT ?').all(limit);
  });
}

module.exports = { registerHistoryHandlers };
