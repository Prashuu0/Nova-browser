const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../database');
const cloudClient = require('./cloudClient');

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function getLocalAccount() {
  const db = getDatabase();
  const row = db.prepare('SELECT id, email, display_name, sync_token, created_at FROM nova_account LIMIT 1').get();
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    hasSyncToken: !!row.sync_token,
    createdAt: row.created_at,
    source: 'local'
  };
}

async function getAccount() {
  const cloud = await cloudClient.getMe();
  if (cloud.user) {
    return { ...cloud.user, source: 'cloud', cloud: true, emailVerified: cloud.user.emailVerified };
  }
  const local = getLocalAccount();
  if (local) return { ...local, cloud: false };
  return null;
}

function saveLocalAccount({ email, displayName, passwordHash }) {
  const db = getDatabase();
  const id = uuidv4();
  const now = Date.now();
  const syncToken = crypto.randomBytes(32).toString('hex');
  db.prepare(`
    INSERT OR REPLACE INTO nova_account (id, email, password_hash, display_name, sync_token, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, email, passwordHash, displayName, syncToken, now, now);
}

async function signUp({ email, password, displayName }) {
  const cloudResult = await cloudClient.register({ email, password, displayName });
  if (cloudResult.success) {
    const salt = crypto.randomBytes(16).toString('hex');
    saveLocalAccount({ email, displayName: displayName || email.split('@')[0], passwordHash: `${salt}:${hashPassword(password, salt)}` });
    return { success: true, account: await getAccount(), cloud: true, message: cloudResult.message };
  }

  if (cloudResult.status && cloudResult.status !== 503 && cloudResult.status !== 0) {
    return { error: cloudResult.error || 'Registration failed' };
  }

  const db = getDatabase();
  const existing = db.prepare('SELECT id FROM nova_account WHERE email = ?').get(email);
  if (existing) return { error: 'Account already exists' };
  const salt = crypto.randomBytes(16).toString('hex');
  saveLocalAccount({ email, displayName: displayName || email.split('@')[0], passwordHash: `${salt}:${hashPassword(password, salt)}` });
  return { success: true, account: getLocalAccount(), cloud: false, message: 'Local account created (cloud offline)' };
}

async function signIn({ email, password }) {
  const cloudResult = await cloudClient.login({ email, password });
  if (cloudResult.success) {
    const salt = crypto.randomBytes(16).toString('hex');
    saveLocalAccount({ email, displayName: cloudResult.user.displayName, passwordHash: `${salt}:${hashPassword(password, salt)}` });
    return { success: true, account: await getAccount(), cloud: true };
  }

  if (cloudResult.status && cloudResult.status !== 503 && cloudResult.status !== 0) {
    return { error: cloudResult.error || 'Invalid credentials' };
  }

  const db = getDatabase();
  const row = db.prepare('SELECT * FROM nova_account WHERE email = ?').get(email);
  if (!row) return { error: 'Account not found' };
  const [salt, hash] = row.password_hash.split(':');
  if (hashPassword(password, salt) !== hash) return { error: 'Invalid password' };
  return { success: true, account: getLocalAccount(), cloud: false };
}

async function signOut() {
  await cloudClient.logout();
  return { success: true };
}

async function forgotPassword(email) {
  return cloudClient.forgotPassword(email);
}

async function resetPassword(token, password) {
  return cloudClient.resetPassword(token, password);
}

module.exports = { getAccount, signUp, signIn, signOut, forgotPassword, resetPassword, getLocalAccount };
