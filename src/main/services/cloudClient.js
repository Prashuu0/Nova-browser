const Store = require('electron-store');
const { v4: uuidv4 } = require('uuid');
const os = require('os');
const { app } = require('electron');

const cloudStore = new Store({ name: 'nova-cloud-session' });

const DEFAULT_API = 'http://localhost:3847';

function getApiBase() {
  return cloudStore.get('apiBase', process.env.NOVA_CLOUD_URL || DEFAULT_API);
}

function setApiBase(url) {
  cloudStore.set('apiBase', url);
}

function getDeviceId() {
  let id = cloudStore.get('deviceId');
  if (!id) {
    id = uuidv4();
    cloudStore.set('deviceId', id);
  }
  return id;
}

function getSession() {
  return {
    accessToken: cloudStore.get('accessToken'),
    refreshToken: cloudStore.get('refreshToken'),
    user: cloudStore.get('user'),
    deviceId: getDeviceId()
  };
}

function saveSession({ accessToken, refreshToken, user }) {
  if (accessToken) cloudStore.set('accessToken', accessToken);
  if (refreshToken) cloudStore.set('refreshToken', refreshToken);
  if (user) cloudStore.set('user', user);
}

function clearSession() {
  cloudStore.delete('accessToken');
  cloudStore.delete('refreshToken');
  cloudStore.delete('user');
}

function deviceInfo() {
  return {
    deviceId: getDeviceId(),
    deviceName: os.hostname(),
    platform: process.platform,
    appVersion: app?.getVersion?.() || '1.0.0',
    deviceType: 'desktop'
  };
}

async function apiRequest(path, options = {}) {
  const base = getApiBase();
  const session = getSession();
  const headers = {
    'Content-Type': 'application/json',
    'X-Nova-Device-Id': session.deviceId,
    ...(session.accessToken && { Authorization: `Bearer ${session.accessToken}` }),
    ...options.headers
  };

  const response = await fetch(`${base}${path}`, {
    ...options,
    headers
  });

  if (response.status === 401 && session.refreshToken && !options._retry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return apiRequest(path, { ...options, _retry: true });
    }
    clearSession();
    return { error: 'Session expired. Please sign in again.', status: 401 };
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return { error: data.error || `HTTP ${response.status}`, status: response.status };
  }
  return data;
}

async function refreshAccessToken() {
  const session = getSession();
  if (!session.refreshToken) return false;
  try {
    const base = getApiBase();
    const response = await fetch(`${base}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: session.refreshToken })
    });
    if (!response.ok) return false;
    const data = await response.json();
    saveSession({ accessToken: data.accessToken, refreshToken: data.refreshToken });
    return true;
  } catch {
    return false;
  }
}

async function register({ email, password, displayName }) {
  const data = await apiRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, displayName, ...deviceInfo() })
  });
  if (data.success) {
    saveSession({ accessToken: data.accessToken, refreshToken: data.refreshToken, user: data.user });
  }
  return data;
}

async function login({ email, password }) {
  const data = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password, ...deviceInfo() })
  });
  if (data.success) {
    saveSession({ accessToken: data.accessToken, refreshToken: data.refreshToken, user: data.user });
  }
  return data;
}

async function logout() {
  const session = getSession();
  if (session.refreshToken) {
    await apiRequest('/api/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: session.refreshToken })
    }).catch(() => {});
  }
  clearSession();
  return { success: true };
}

async function getMe() {
  const session = getSession();
  if (!session.accessToken) return { user: null, cloud: false };
  const data = await apiRequest('/api/auth/me');
  if (data.error) return { user: null, cloud: false, error: data.error };
  saveSession({ user: data.user });
  return { user: data.user, cloud: true };
}

async function forgotPassword(email) {
  return apiRequest('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email })
  });
}

async function resetPassword(token, password) {
  return apiRequest('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password })
  });
}

async function verifyEmail(token) {
  const base = getApiBase();
  const response = await fetch(`${base}/api/auth/verify-email?token=${token}`);
  return response.json();
}

async function syncPush(syncData) {
  return apiRequest('/api/sync/push', {
    method: 'POST',
    body: JSON.stringify({ data: syncData, ...deviceInfo() })
  });
}

async function syncPull() {
  return apiRequest('/api/sync/pull');
}

async function syncStatus() {
  return apiRequest('/api/sync/status');
}

async function getExtensionCatalog() {
  return apiRequest('/api/extensions/catalog');
}

async function installExtension(extensionId) {
  return apiRequest('/api/extensions/install', {
    method: 'POST',
    body: JSON.stringify({ extensionId })
  });
}

async function submitFeedback(payload) {
  return apiRequest('/api/feedback', {
    method: 'POST',
    body: JSON.stringify({ ...payload, ...deviceInfo() })
  });
}

async function submitCrashReport(payload) {
  return apiRequest('/api/feedback/crash', {
    method: 'POST',
    body: JSON.stringify({ ...payload, platform: process.platform, appVersion: deviceInfo().appVersion })
  });
}

async function trackEvent(eventType, eventData) {
  return apiRequest('/api/feedback/event', {
    method: 'POST',
    body: JSON.stringify({ eventType, eventData, platform: process.platform, appVersion: deviceInfo().appVersion })
  });
}

let wsConnection = null;

function connectSyncSocket(onMessage) {
  const session = getSession();
  if (!session.accessToken) return null;
  try {
    const WebSocket = require('ws');
    const base = getApiBase().replace('http', 'ws');
    const ws = new WebSocket(`${base}/ws/sync?token=${session.accessToken}`);
    ws.on('open', () => console.log('[Nova Cloud] Sync WebSocket connected'));
    ws.on('message', (data) => {
      try { onMessage?.(JSON.parse(data.toString())); } catch {}
    });
    ws.on('close', () => {
      wsConnection = null;
      setTimeout(() => connectSyncSocket(onMessage), 5000);
    });
    wsConnection = ws;
    return ws;
  } catch {
    return null;
  }
}

async function getAnalyticsDashboard() {
  return apiRequest('/api/feedback/analytics');
}

async function getVpnServers() {
  return apiRequest('/api/vpn/servers');
}

async function getVpnConfig(serverId) {
  return apiRequest(`/api/vpn/config/${serverId}`);
}

async function getEmailInbox() {
  return apiRequest('/api/email/inbox');
}

async function sendEmail(payload) {
  return apiRequest('/api/email/send', { method: 'POST', body: JSON.stringify(payload) });
}

async function getDriveFiles() {
  return apiRequest('/api/drive/files');
}

async function uploadDriveFile(payload) {
  return apiRequest('/api/drive/upload', { method: 'POST', body: JSON.stringify(payload) });
}

async function downloadDriveFile(id) {
  return apiRequest(`/api/drive/download/${id}`);
}

async function syncSearchIndex() {
  return apiRequest('/api/search/index/sync-file', { method: 'POST', body: '{}' });
}

module.exports = {
  getApiBase,
  setApiBase,
  getSession,
  getDeviceId,
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  verifyEmail,
  syncPush,
  syncPull,
  syncStatus,
  getExtensionCatalog,
  installExtension,
  submitFeedback,
  submitCrashReport,
  trackEvent,
  connectSyncSocket,
  clearSession,
  getAnalyticsDashboard,
  getVpnServers,
  getVpnConfig,
  getEmailInbox,
  sendEmail,
  getDriveFiles,
  uploadDriveFile,
  downloadDriveFile,
  syncSearchIndex
};
