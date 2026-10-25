const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../config');

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, type: 'access' },
    config.jwt.accessSecret,
    { expiresIn: config.jwt.accessExpires }
  );
}

function signRefreshToken(user, deviceId) {
  return jwt.sign(
    { sub: user.id, deviceId, type: 'refresh' },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpires }
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, config.jwt.accessSecret);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, config.jwt.refreshSecret);
}

module.exports = {
  hashToken,
  generateToken,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
};
