#!/usr/bin/env node
/**
 * Start everything: Cloud API + AI server + Nova Browser
 * Requires Node.js >= 26.3.1
 */
const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { assertNodeVersion, killStaleProcesses } = require('./nova-utils.cjs');

const root = path.join(__dirname, '..');
const cloudDir = path.join(root, 'nova-cloud');
const aiDir = path.join(root, 'nova-ai');
const children = [];

function run(cmd, cwd, label) {
  console.log(`\n[Nova] ${label}`);
  const child = spawn(cmd, { cwd, shell: true, stdio: 'inherit', env: process.env });
  children.push(child);
  return child;
}

function setupCloud() {
  const envPath = path.join(cloudDir, '.env');
  if (!fs.existsSync(envPath)) {
    fs.copyFileSync(path.join(cloudDir, '.env.example'), envPath);
  }
  const env = fs.readFileSync(envPath, 'utf8');
  if (!env.includes('sqlite:')) {
    const updated = env.replace(
      /DATABASE_URL=.*/,
      'DATABASE_URL=sqlite:./data/nova-cloud.db'
    );
    fs.writeFileSync(envPath, updated);
    console.log('[Nova] Cloud configured for SQLite (no Docker needed)');
  }

  if (!fs.existsSync(path.join(cloudDir, 'node_modules'))) {
    execSync('npm install', { cwd: cloudDir, stdio: 'inherit' });
  }

  execSync('npm run migrate', { cwd: cloudDir, stdio: 'inherit' });
  execSync('npm run seed', { cwd: cloudDir, stdio: 'inherit' });
}

function setupAi() {
  if (!fs.existsSync(path.join(aiDir, 'node_modules'))) {
    execSync('npm install', { cwd: aiDir, stdio: 'inherit' });
  }
}

assertNodeVersion();

try {
  killStaleProcesses();
  execSync('node scripts/build-main.cjs', { cwd: root, stdio: 'inherit' });
} catch {
  console.error('[Nova] Main build failed');
  process.exit(1);
}

setupCloud();
setupAi();

run('npm run dev', cloudDir, 'Nova Cloud API → http://localhost:3847');
run('npm run dev', aiDir, 'Nova AI → http://localhost:3850');

setTimeout(() => {
  run('npm run dev', root, 'Nova Browser');
}, 2500);

function shutdown() {
  children.forEach((c) => {
    try {
      c.kill();
    } catch {
      /* ignore */
    }
  });
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
