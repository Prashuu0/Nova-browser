const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../db/pool');
const {
  generateToken,
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken
} = require('../utils/tokens');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/email');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

async function registerDevice(userId, { deviceName, deviceType, platform, appVersion }) {
  const id = uuidv4();
  const result = await query(
    `INSERT INTO devices (id, user_id, device_name, device_type, platform, app_version)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (user_id, device_name) DO UPDATE SET last_seen_at = NOW(), app_version = EXCLUDED.app_version
     RETURNING id`,
    [id, userId, deviceName || 'Nova Desktop', deviceType || 'desktop', platform || 'windows', appVersion || '1.0.0']
  );
  return result.rows[0]?.id || id;
}

async function issueTokens(user, deviceId) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user, deviceId);
  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await query(
    `INSERT INTO refresh_tokens (id, user_id, token_hash, device_id, device_name, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [uuidv4(), user.id, tokenHash, deviceId, 'Nova Device', expiresAt]
  );

  return { accessToken, refreshToken, expiresIn: 900 };
}

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, displayName, deviceName, platform, appVersion } = req.body;
    if (!email || !password || password.length < 8) {
      return res.status(400).json({ error: 'Email and password (min 8 chars) required' });
    }

    const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const verificationToken = generateToken(24);
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const userId = uuidv4();
    const result = await query(
      `INSERT INTO users (id, email, password_hash, display_name, verification_token, verification_expires)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, display_name, email_verified`,
      [userId, email.toLowerCase(), passwordHash, displayName || email.split('@')[0], verificationToken, verificationExpires]
    );

    const user = result.rows[0];
    await query('INSERT INTO user_settings (user_id) VALUES ($1) ON CONFLICT DO NOTHING', [user.id]);
    await sendVerificationEmail(user.email, verificationToken);

    const deviceId = await registerDevice(user.id, { deviceName, platform, appVersion });
    const tokens = await issueTokens(user, deviceId);

    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        emailVerified: user.email_verified
      },
      ...tokens,
      message: 'Account created. Check email to verify.'
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password, deviceName, platform, appVersion } = req.body;
    const result = await query('SELECT * FROM users WHERE email = $1', [email?.toLowerCase()]);
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    if (!user.is_active) {
      return res.status(403).json({ error: 'Account deactivated' });
    }

    const deviceId = await registerDevice(user.id, { deviceName, platform, appVersion });
    const tokens = await issueTokens(user, deviceId);

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        emailVerified: user.email_verified
      },
      ...tokens
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

    const payload = verifyRefreshToken(refreshToken);
    const tokenHash = hashToken(refreshToken);
    const stored = await query(
      'SELECT * FROM refresh_tokens WHERE token_hash = $1 AND expires_at > NOW()',
      [tokenHash]
    );
    if (!stored.rows.length) return res.status(401).json({ error: 'Invalid refresh token' });

    const userResult = await query(
      'SELECT id, email, display_name, email_verified FROM users WHERE id = $1',
      [payload.sub]
    );
    const user = userResult.rows[0];
    if (!user) return res.status(401).json({ error: 'User not found' });

    await query('DELETE FROM refresh_tokens WHERE token_hash = $1', [tokenHash]);
    const tokens = await issueTokens(user, payload.deviceId);
    res.json({ success: true, ...tokens });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/logout
router.post('/logout', authMiddleware, async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await query('DELETE FROM refresh_tokens WHERE token_hash = $1', [hashToken(refreshToken)]);
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/verify-email?token=
router.get('/verify-email', async (req, res, next) => {
  try {
    const { token } = req.query;
    const result = await query(
      `UPDATE users SET email_verified = TRUE, verification_token = NULL, verification_expires = NULL, updated_at = NOW()
       WHERE verification_token = $1 AND verification_expires > NOW()
       RETURNING email`,
      [token]
    );
    if (!result.rows.length) return res.status(400).json({ error: 'Invalid or expired verification link' });
    res.json({ success: true, message: 'Email verified successfully' });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await query('SELECT id, email FROM users WHERE email = $1', [email?.toLowerCase()]);
    if (result.rows.length) {
      const resetToken = generateToken(24);
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000);
      await query(
        'UPDATE users SET reset_token = $1, reset_expires = $2 WHERE id = $3',
        [resetToken, resetExpires, result.rows[0].id]
      );
      await sendPasswordResetEmail(result.rows[0].email, resetToken);
    }
    res.json({ success: true, message: 'If that email exists, a reset link was sent.' });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    const result = await query(
      'SELECT id FROM users WHERE reset_token = $1 AND reset_expires > NOW()',
      [token]
    );
    if (!result.rows.length) return res.status(400).json({ error: 'Invalid or expired reset token' });

    const passwordHash = await bcrypt.hash(password, 12);
    await query(
      'UPDATE users SET password_hash = $1, reset_token = NULL, reset_expires = NULL, updated_at = NOW() WHERE id = $2',
      [passwordHash, result.rows[0].id]
    );
    await query('DELETE FROM refresh_tokens WHERE user_id = $1', [result.rows[0].id]);
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      displayName: req.user.display_name,
      emailVerified: req.user.email_verified
    }
  });
});

module.exports = router;
