const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../db/pool');
const { authMiddleware, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/extensions/catalog — Nova Store listing
router.get('/catalog', optionalAuth, async (req, res, next) => {
  try {
    const { category, featured } = req.query;
    let sql = `SELECT id, slug, name, description, version, author, icon_url, category, install_count, is_featured
               FROM extension_catalog WHERE is_published = TRUE`;
    const params = [];
    if (category) {
      params.push(category);
      sql += ` AND category = $${params.length}`;
    }
    if (featured === 'true') sql += ' AND is_featured = TRUE';
    sql += ' ORDER BY is_featured DESC, install_count DESC';
    const result = await query(sql, params);
    res.json({ extensions: result.rows });
  } catch (err) {
    next(err);
  }
});

// GET /api/extensions/catalog/:slug
router.get('/catalog/:slug', async (req, res, next) => {
  try {
    const result = await query(
      'SELECT * FROM extension_catalog WHERE slug = $1 AND is_published = TRUE',
      [req.params.slug]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Extension not found' });
    res.json({ extension: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// POST /api/extensions/install — install from Nova Store
router.post('/install', authMiddleware, async (req, res, next) => {
  try {
    const { extensionId } = req.body;
    const ext = await query('SELECT * FROM extension_catalog WHERE id = $1', [extensionId]);
    if (!ext.rows.length) return res.status(404).json({ error: 'Extension not found' });

    await query(
      `INSERT INTO user_extensions (id, user_id, extension_id, installed_version)
       VALUES ($1, $2, $3, $4) ON CONFLICT (user_id, extension_id) DO UPDATE SET installed_version = EXCLUDED.installed_version`,
      [uuidv4(), req.user.id, extensionId, ext.rows[0].version]
    );
    await query('UPDATE extension_catalog SET install_count = install_count + 1 WHERE id = $1', [extensionId]);
    res.json({ success: true, extension: ext.rows[0] });
  } catch (err) {
    next(err);
  }
});

// GET /api/extensions/installed — user's installed extensions
router.get('/installed', authMiddleware, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT ue.enabled, ue.installed_version, ue.installed_at, ec.*
       FROM user_extensions ue JOIN extension_catalog ec ON ec.id = ue.extension_id
       WHERE ue.user_id = $1`,
      [req.user.id]
    );
    res.json({ extensions: result.rows });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/extensions/:id/toggle
router.patch('/:id/toggle', authMiddleware, async (req, res, next) => {
  try {
    const { enabled } = req.body;
    await query(
      'UPDATE user_extensions SET enabled = $1 WHERE user_id = $2 AND extension_id = $3',
      [enabled, req.user.id, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
