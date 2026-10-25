const express = require('express');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');
const { broadcastToUser } = require('../services/websocket');

const router = express.Router();
router.use(authMiddleware);

function checksum(data) {
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

// GET /api/sync/pull — fetch all user data
router.get('/pull', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [bookmarks, history, passwords, settings, aiChats, tabs, devices] = await Promise.all([
      query('SELECT client_id AS id, title, url, favicon, folder, sort_order, updated_at, created_at FROM bookmarks WHERE user_id = $1 AND deleted_at IS NULL ORDER BY sort_order', [userId]),
      query('SELECT client_id AS id, title, url, favicon, visit_count, last_visit, created_at FROM history WHERE user_id = $1 ORDER BY last_visit DESC LIMIT 1000', [userId]),
      query('SELECT client_id AS id, origin, username, password_encrypted, last_used, updated_at, created_at FROM passwords WHERE user_id = $1', [userId]),
      query('SELECT settings, updated_at FROM user_settings WHERE user_id = $1', [userId]),
      query('SELECT client_id AS id, title, messages, provider, updated_at, created_at FROM ai_conversations WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 50', [userId]),
      query('SELECT tabs, active_tab_id, updated_at FROM open_tabs WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1', [userId]),
      query('SELECT id, device_name, device_type, platform, app_version, last_seen_at FROM devices WHERE user_id = $1', [userId])
    ]);

    const payload = {
      version: 2,
      syncedAt: Date.now(),
      bookmarks: bookmarks.rows,
      history: history.rows,
      passwords: passwords.rows,
      settings: settings.rows[0]?.settings || {},
      aiConversations: aiChats.rows,
      tabs: tabs.rows[0]?.tabs || [],
      activeTabId: tabs.rows[0]?.active_tab_id || null,
      devices: devices.rows
    };

    res.json({ success: true, data: payload, checksum: checksum(payload) });
  } catch (err) {
    next(err);
  }
});

// POST /api/sync/push — upload user data (merge)
router.post('/push', async (req, res, next) => {
  const client = await require('../db/pool').pool.connect();
  try {
    const userId = req.user.id;
    const { data, deviceId, deviceName } = req.body;
    if (!data) return res.status(400).json({ error: 'Sync data required' });

    await client.query('BEGIN');

    // Bookmarks
    if (data.bookmarks?.length) {
      for (const b of data.bookmarks) {
        await client.query(
          `INSERT INTO bookmarks (id, user_id, client_id, title, url, favicon, folder, sort_order, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
           ON CONFLICT (user_id, client_id) DO UPDATE SET
             title = EXCLUDED.title, url = EXCLUDED.url, favicon = EXCLUDED.favicon,
             folder = EXCLUDED.folder,
             updated_at = MAX(bookmarks.updated_at, EXCLUDED.updated_at)`,
          [b.id || uuidv4(), userId, b.id, b.title, b.url, b.favicon, b.folder || 'default', b.sort_order || 0]
        );
      }
    }

    // History
    if (data.history?.length) {
      for (const h of data.history) {
        await client.query(
          `INSERT INTO history (id, user_id, client_id, title, url, favicon, visit_count, last_visit)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (user_id, url) DO UPDATE SET
             title = EXCLUDED.title, visit_count = history.visit_count + 1,
             last_visit = MAX(history.last_visit, EXCLUDED.last_visit)`,
          [h.id || uuidv4(), userId, h.id, h.title, h.url, h.favicon, h.visit_count || 1, h.last_visit || new Date()]
        );
      }
    }

    // Passwords
    if (data.passwords?.length) {
      for (const p of data.passwords) {
        await client.query(
          `INSERT INTO passwords (id, user_id, client_id, origin, username, password_encrypted, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())
           ON CONFLICT (user_id, origin, username) DO UPDATE SET
             password_encrypted = EXCLUDED.password_encrypted, updated_at = NOW()`,
          [p.id || uuidv4(), userId, p.id, p.origin, p.username, p.password_encrypted]
        );
      }
    }

    // Settings
    if (data.settings) {
      await client.query(
        `INSERT INTO user_settings (user_id, settings, updated_at) VALUES ($1, $2, NOW())
         ON CONFLICT (user_id) DO UPDATE SET settings = EXCLUDED.settings, updated_at = NOW()`,
        [userId, JSON.stringify(data.settings)]
      );
    }

    // AI conversations
    if (data.aiConversations?.length) {
      for (const c of data.aiConversations) {
        await client.query(
          `INSERT INTO ai_conversations (id, user_id, client_id, title, messages, provider, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())
           ON CONFLICT (user_id, client_id) DO NOTHING`,
          [c.id || uuidv4(), userId, c.id, c.title, JSON.stringify(c.messages || []), c.provider]
        );
      }
    }

    // Open tabs
    if (data.tabs) {
      await client.query(
        `INSERT INTO open_tabs (id, user_id, device_id, tabs, active_tab_id, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (user_id, device_id) DO UPDATE SET
           tabs = EXCLUDED.tabs, active_tab_id = EXCLUDED.active_tab_id, updated_at = NOW()`,
        [uuidv4(), userId, deviceId || null, JSON.stringify(data.tabs), data.activeTabId]
      );
    }

    const itemCounts = {
      bookmarks: data.bookmarks?.length || 0,
      history: data.history?.length || 0,
      passwords: data.passwords?.length || 0
    };

    await client.query(
      `INSERT INTO sync_snapshots (id, user_id, device_id, encrypted_blob, checksum, item_counts)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [uuidv4(), userId, deviceId, data.encryptedBlob || null, checksum(data), JSON.stringify(itemCounts)]
    );

    await client.query('COMMIT');

    broadcastToUser(userId, { type: 'sync:updated', deviceId, itemCounts, at: Date.now() });

    res.json({ success: true, itemCounts, syncedAt: Date.now() });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// GET /api/sync/status
router.get('/status', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT created_at, item_counts FROM sync_snapshots WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [req.user.id]
    );
    const devices = await query(
      'SELECT device_name, platform, last_seen_at FROM devices WHERE user_id = $1',
      [req.user.id]
    );
    res.json({
      lastSync: result.rows[0]?.created_at || null,
      itemCounts: result.rows[0]?.item_counts || {},
      devices: devices.rows
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
