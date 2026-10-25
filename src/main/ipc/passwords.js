const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const { getDatabase } = require('../database');
const { ipcMain, safeStorage } = require('electron');

function encryptPassword(password) {
  if (safeStorage.isEncryptionAvailable()) {
    return safeStorage.encryptString(password).toString('base64');
  }
  const key = crypto.scryptSync('nova-browser-key', 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(password, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `fallback:${iv.toString('hex')}:${encrypted}`;
}

function decryptPassword(encrypted) {
  if (safeStorage.isEncryptionAvailable() && !encrypted.startsWith('fallback:')) {
    return safeStorage.decryptString(Buffer.from(encrypted, 'base64'));
  }
  if (encrypted.startsWith('fallback:')) {
    const [, ivHex, data] = encrypted.split(':');
    const key = crypto.scryptSync('nova-browser-key', 'salt', 32);
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
  return safeStorage.decryptString(Buffer.from(encrypted, 'base64'));
}

function registerPasswordHandlers() {
  ipcMain.handle('passwords:getAll', () => {
    const db = getDatabase();
    const rows = db.prepare('SELECT id, origin, username, created_at, updated_at, last_used FROM passwords ORDER BY updated_at DESC').all();
    return rows;
  });

  ipcMain.handle('passwords:save', (_, { origin, username, password }) => {
    const db = getDatabase();
    const now = Date.now();
    const existing = db.prepare('SELECT id FROM passwords WHERE origin = ? AND username = ?').get(origin, username);
    const encrypted = encryptPassword(password);

    if (existing) {
      db.prepare(`
        UPDATE passwords SET password_encrypted = @encrypted, updated_at = @updated_at, last_used = @last_used
        WHERE id = @id
      `).run({ id: existing.id, encrypted, updated_at: now, last_used: now });
      return { id: existing.id, origin, username };
    }

    const id = uuidv4();
    db.prepare(`
      INSERT INTO passwords (id, origin, username, password_encrypted, created_at, updated_at, last_used)
      VALUES (@id, @origin, @username, @encrypted, @created_at, @updated_at, @last_used)
    `).run({ id, origin, username, encrypted, created_at: now, updated_at: now, last_used: now });
    return { id, origin, username };
  });

  ipcMain.handle('passwords:get', (_, id) => {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM passwords WHERE id = ?').get(id);
    if (!row) return null;
    return {
      id: row.id,
      origin: row.origin,
      username: row.username,
      password: decryptPassword(row.password_encrypted)
    };
  });

  ipcMain.handle('passwords:remove', (_, id) => {
    const db = getDatabase();
    db.prepare('DELETE FROM passwords WHERE id = ?').run(id);
    return { success: true };
  });

  ipcMain.handle('passwords:getForOrigin', (_, origin) => {
    const db = getDatabase();
    let hostname = origin;
    try {
      hostname = new URL(origin).hostname;
    } catch {}
    const rows = db.prepare(
      'SELECT id, origin, username FROM passwords WHERE origin = ? OR origin LIKE ? OR origin LIKE ?'
    ).all(origin, `%${hostname}%`, `https://${hostname}%`);
    return rows;
  });

  ipcMain.handle('passwords:getCredentialsForOrigin', (_, origin) => {
    const db = getDatabase();
    let hostname = origin;
    try {
      hostname = new URL(origin).hostname;
    } catch {}
    const rows = db.prepare(
      'SELECT * FROM passwords WHERE origin = ? OR origin LIKE ? OR origin LIKE ? ORDER BY last_used DESC'
    ).all(origin, `%${hostname}%`, `https://${hostname}%`);

    return rows.map((row) => ({
      id: row.id,
      origin: row.origin,
      username: row.username,
      password: decryptPassword(row.password_encrypted)
    }));
  });

  ipcMain.handle('passwords:generate', (_, length = 16) => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*-_';
    let password = '';
    const bytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
      password += chars[bytes[i] % chars.length];
    }
    return password;
  });
}

module.exports = { registerPasswordHandlers };
