const express = require('express');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const DRIVE_ROOT = path.join(__dirname, '../../data/drive');

function userDir(userId) {
  const dir = path.join(DRIVE_ROOT, userId);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

router.get('/files', requireAuth, async (req, res) => {
  const { rows } = await query(
    `SELECT id, filename, size_bytes, mime_type, created_at FROM drive_files
     WHERE user_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC`,
    [req.user.id]
  );
  res.json({ files: rows });
});

router.post('/upload', requireAuth, async (req, res) => {
  const { filename, contentBase64, mimeType } = req.body;
  if (!filename || !contentBase64) {
    return res.status(400).json({ error: 'filename and contentBase64 required' });
  }

  const id = uuidv4();
  const buffer = Buffer.from(contentBase64, 'base64');
  const storagePath = path.join(userDir(req.user.id), id);
  fs.writeFileSync(storagePath, buffer);

  await query(
    `INSERT INTO drive_files (id, user_id, filename, size_bytes, mime_type, storage_path)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [id, req.user.id, filename, buffer.length, mimeType || 'application/octet-stream', storagePath]
  );

  res.json({ success: true, id, filename, size: buffer.length });
});

router.get('/download/:id', requireAuth, async (req, res) => {
  const { rows } = await query(
    `SELECT * FROM drive_files WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
    [req.params.id, req.user.id]
  );
  const file = rows[0];
  if (!file || !fs.existsSync(file.storage_path)) {
    return res.status(404).json({ error: 'File not found' });
  }
  const data = fs.readFileSync(file.storage_path);
  res.json({
    filename: file.filename,
    mimeType: file.mime_type,
    contentBase64: data.toString('base64'),
    size: file.size_bytes
  });
});

router.delete('/:id', requireAuth, async (req, res) => {
  await query(
    `UPDATE drive_files SET deleted_at = datetime('now') WHERE id = $1 AND user_id = $2`,
    [req.params.id, req.user.id]
  );
  res.json({ success: true });
});

module.exports = router;
