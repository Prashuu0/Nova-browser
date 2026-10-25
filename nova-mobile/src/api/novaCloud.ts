import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const API_BASE = process.env.NOVA_CLOUD_URL || 'http://localhost:3847';
const TOKEN_KEY = 'nova_access_token';
const REFRESH_KEY = 'nova_refresh_token';
const DEVICE_KEY = 'nova_device_id';

async function getDeviceId(): Promise<string> {
  let id = await AsyncStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = `mobile-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    await AsyncStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

export async function loadTokens() {
  const access = await AsyncStorage.getItem(TOKEN_KEY);
  const refresh = await AsyncStorage.getItem(REFRESH_KEY);
  return { access: access || '', refresh: refresh || '' };
}

export async function setTokens(access: string, refresh: string) {
  await AsyncStorage.setItem(TOKEN_KEY, access);
  await AsyncStorage.setItem(REFRESH_KEY, refresh);
}

export async function clearTokens() {
  await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_KEY]);
}

async function api(path: string, options: RequestInit = {}) {
  const { access } = await loadTokens();
  const deviceId = await getDeviceId();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Nova-Device-Id': deviceId,
      ...(access && { Authorization: `Bearer ${access}` }),
      ...options.headers
    }
  });
  return res.json();
}

export const novaCloud = {
  register: async (email: string, password: string) => {
    const deviceId = await getDeviceId();
    const data = await api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        deviceType: 'mobile',
        deviceName: 'Nova Mobile',
        deviceId,
        platform: Platform.OS
      })
    });
    if (data.accessToken) await setTokens(data.accessToken, data.refreshToken);
    return data;
  },
  login: async (email: string, password: string) => {
    const deviceId = await getDeviceId();
    const data = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        deviceType: 'mobile',
        deviceName: 'Nova Mobile',
        deviceId,
        platform: Platform.OS
      })
    });
    if (data.accessToken) await setTokens(data.accessToken, data.refreshToken);
    return data;
  },
  logout: async () => clearTokens(),
  syncPull: () => api('/api/sync/pull'),
  syncPush: async (data: object) => {
    const deviceId = await getDeviceId();
    return api('/api/sync/push', {
      method: 'POST',
      body: JSON.stringify({ data, deviceId, deviceType: 'mobile', deviceName: 'Nova Mobile' })
    });
  },
  search: (query: string) => api('/api/search/query', { method: 'POST', body: JSON.stringify({ query }) }),
  getDriveFiles: () => api('/api/drive/files'),
  getEmailInbox: () => api('/api/email/inbox')
};
