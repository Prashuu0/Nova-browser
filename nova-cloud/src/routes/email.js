const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');
const { sendMail } = require('../services/mailService');

const router = express.Router();

async function ensureAlias(userId, email) {
  const local = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  const alias = `${local || 'user'}.${userId.slice(0, 8)}@nova.mail`;
  const { rows } = await query(`SELECT alias FROM mail_aliases WHERE user_id = $1`, [userId]);
  if (rows[0]) return rows[0].alias;
  await query(`INSERT INTO mail_aliases (id, user_id, alias) VALUES ($1, $2, $3)`, [uuidv4(), userId, alias]);
  return alias;
}

router.get('/alias', requireAuth, async (req, res) => {
  const alias = await ensureAlias(req.user.id, req.user.email);
  res.json({ alias });
});

router.get('/inbox', requireAuth, async (req, res) => {
  const alias = await ensureAlias(req.user.id, req.user.email);
  const { rows } = await query(
    `SELECT id, from_addr, to_addr, subject, body, is_read, created_at
     FROM mail_messages WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100`,
    [req.user.id]
  );
  res.json({ alias, messages: rows });
});

router.post('/send', requireAuth, async (req, res) => {
  const { to, subject, body } = req.body;
  if (!to || !subject || !body) {
    return res.status(400).json({ error: 'to, subject, body required' });
  }

  const alias = await ensureAlias(req.user.id, req.user.email);
  const id = uuidv4();

  await query(
    `INSERT INTO mail_messages (id, user_id, from_addr, to_addr, subject, body, is_read, folder)
     VALUES ($1, $2, $3, $4, $5, $6, 1, 'sent')`,
    [id, req.user.id, alias, to, subject, body]
  );

  const sent = await sendMail({ to, subject, text: body, from: alias });

  res.json({ success: true, id, delivered: sent.delivered, alias });
});

router.patch('/read/:id', requireAuth, async (req, res) => {
  await query(
    `UPDATE mail_messages SET is_read = 1 WHERE id = $1 AND user_id = $2`,
    [req.params.id, req.user.id]
  );
  res.json({ success: true });
});

module.exports = router;
