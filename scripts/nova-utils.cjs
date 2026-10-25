#!/usr/bin/env node
const { execSync } = require('child_process');
const path = require('path');

const REQUIRED_NODE = '26.3.1';

function parseVersion(v) {
  const [major = 0, minor = 0, patch = 0] = String(v).replace(/^v/, '').split('.').map(Number);
  return { major, minor, patch };
}

function compareVersions(a, b) {
  const va = parseVersion(a);
  const vb = parseVersion(b);
  if (va.major !== vb.major) return va.major - vb.major;
  if (va.minor !== vb.minor) return va.minor - vb.minor;
  return va.patch - vb.patch;
}

function assertNodeVersion() {
  const current = process.version.replace(/^v/, '');
  if (compareVersions(current, REQUIRED_NODE) < 0) {
    console.error(`
[Nova] Node ${REQUIRED_NODE} required (found v${current}).

Install: https://nodejs.org
Then open a NEW terminal and run:
  node -v
  npm run team:setup
`);
    process.exit(1);
  }
  console.log(`[Nova] Node v${current} OK (requires >= ${REQUIRED_NODE})`);
}

function killPort(port) {
  if (process.platform !== 'win32') return;
  try {
    const out = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8', shell: true });
    const pids = new Set();
    for (const line of out.split('\n')) {
      if (!line.includes('LISTENING')) continue;
      const pid = line.trim().split(/\s+/).pop();
      if (/^\d+$/.test(pid)) pids.add(pid);
    }
    for (const pid of pids) {
      try {
        execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore', shell: true });
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* port free */
  }
}

function killStaleProcesses() {
  if (process.platform !== 'win32') return;
  try {
    execSync('taskkill /F /IM electron.exe 2>nul', { stdio: 'ignore', shell: true });
  } catch {
    /* no electron */
  }
  killPort(3847);
  killPort(3850);
  killPort(5173);
}

function rebuildSqlite(cwd, label) {
  console.log(`\n[Nova] Rebuilding better-sqlite3 (${label})...`);
  execSync('npm rebuild better-sqlite3', { cwd, stdio: 'inherit', shell: true });
}

function rebuildAllNative(root) {
  killStaleProcesses();
  rebuildSqlite(root, 'desktop');
  const cloudDir = path.join(root, 'nova-cloud');
  rebuildSqlite(cloudDir, 'nova-cloud');
}

module.exports = {
  REQUIRED_NODE,
  assertNodeVersion,
  killStaleProcesses,
  rebuildAllNative,
  rebuildSqlite,
};
