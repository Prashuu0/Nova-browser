const { verifyAccessToken } = require('../utils/tokens');
const { query } = require('../db/pool');

async function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }

  try {
    const payload = verifyAccessToken(header.slice(7));
    const result = await query(
      'SELECT id, email, display_name, email_verified, is_active FROM users WHERE id = $1',
      [payload.sub]
    );
    const user = result.rows[0];
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Invalid or inactive account' });
    }
    req.user = user;
    req.deviceId = req.headers['x-nova-device-id'] || payload.deviceId;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next();
  authMiddleware(req, res, next);
}

module.exports = { authMiddleware, optionalAuth, requireAuth: authMiddleware };
