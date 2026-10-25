const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const { app } = require('electron');
const Store = require('electron-store');

const vpnStore = new Store({ name: 'nova-vpn' });

const WG_PATHS = [
  'C:\\Program Files\\WireGuard\\wireguard.exe',
  'C:\\Program Files (x86)\\WireGuard\\wireguard.exe',
  '/usr/bin/wg-quick',
  '/usr/local/bin/wg-quick'
];

function getVpnDir() {
  const dir = path.join(app.getPath('userData'), 'nova-vpn');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function findWireGuard() {
  for (const p of WG_PATHS) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function getActiveConfig() {
  return vpnStore.get('activeConfigPath', null);
}

function getTunnelName(confPath) {
  return path.basename(confPath, '.conf');
}

function importConfig(sourcePath) {
  const dest = path.join(getVpnDir(), 'active.conf');
  fs.copyFileSync(sourcePath, dest);
  vpnStore.set('activeConfigPath', dest);
  vpnStore.set('tunnelName', getTunnelName(dest));
  return { success: true, path: dest, name: vpnStore.get('tunnelName') };
}

function saveConfigFromContent(name, content) {
  const safe = (name || 'nova-tunnel').replace(/[^a-z0-9-_]/gi, '-');
  const dest = path.join(getVpnDir(), `${safe}.conf`);
  fs.writeFileSync(dest, content, 'utf8');
  vpnStore.set('activeConfigPath', dest);
  vpnStore.set('tunnelName', safe);
  return { success: true, path: dest, name: safe };
}

function connect() {
  const confPath = getActiveConfig();
  if (!confPath || !fs.existsSync(confPath)) {
    return { success: false, error: 'No WireGuard config. Import a .conf file or pick a Nova server.' };
  }

  const wg = findWireGuard();
  const tunnel = vpnStore.get('tunnelName') || getTunnelName(confPath);

  try {
    if (process.platform === 'win32' && wg?.includes('wireguard.exe')) {
      try {
        execSync(`"${wg}" /uninstalltunnelservice "${tunnel}"`, { stdio: 'ignore' });
      } catch {
        /* not installed */
      }
      execSync(`"${wg}" /installtunnelservice "${confPath}"`, { stdio: 'pipe' });
      vpnStore.set('connected', true);
      vpnStore.set('connectedAt', Date.now());
      return { success: true, connected: true, tunnel, message: `Connected via ${tunnel}` };
    }

    if (process.platform !== 'win32') {
      execSync(`wg-quick up "${confPath}"`, { stdio: 'pipe' });
      vpnStore.set('connected', true);
      vpnStore.set('connectedAt', Date.now());
      return { success: true, connected: true, tunnel, message: 'VPN connected' };
    }

    return {
      success: false,
      error: 'WireGuard not installed. Install from wireguard.com, then retry.',
      installUrl: 'https://www.wireguard.com/install/'
    };
  } catch (err) {
    return { success: false, error: err.message || 'VPN connect failed' };
  }
}

function disconnect() {
  const confPath = getActiveConfig();
  const wg = findWireGuard();
  const tunnel = vpnStore.get('tunnelName') || (confPath ? getTunnelName(confPath) : null);

  try {
    if (process.platform === 'win32' && wg?.includes('wireguard.exe') && tunnel) {
      execSync(`"${wg}" /uninstalltunnelservice "${tunnel}"`, { stdio: 'pipe' });
    } else if (confPath && process.platform !== 'win32') {
      execSync(`wg-quick down "${confPath}"`, { stdio: 'pipe' });
    }
    vpnStore.set('connected', false);
    return { success: true, connected: false };
  } catch (err) {
    vpnStore.set('connected', false);
    return { success: true, connected: false, warning: err.message };
  }
}

function getStatus() {
  const confPath = getActiveConfig();
  const wg = findWireGuard();
  return {
    connected: !!vpnStore.get('connected'),
    available: !!wg || process.platform !== 'win32',
    wireguardInstalled: !!wg,
    configPath: confPath,
    tunnelName: vpnStore.get('tunnelName'),
    connectedAt: vpnStore.get('connectedAt'),
    message: confPath
      ? (vpnStore.get('connected') ? 'Nova VPN active' : 'Config ready — click Connect')
      : 'Import WireGuard .conf or select a Nova server'
  };
}

module.exports = {
  importConfig,
  saveConfigFromContent,
  connect,
  disconnect,
  getStatus,
  findWireGuard
};
