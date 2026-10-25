#!/usr/bin/env node
/**
 * Nova Browser — One-time setup (no Docker required)
 * Requires Node.js >= 26.3.1
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { assertNodeVersion } = require('./nova-utils.cjs');

const root = path.join(__dirname, '..');
const cloudDir = path.join(root, 'nova-cloud');
const aiDir = path.join(root, 'nova-ai');

function run(cmd, cwd = root) {
  console.log(`\n▶ ${cmd}`);
  try {
    execSync(cmd, { cwd, stdio: 'inherit', shell: true });
    return true;
  } catch {
    console.warn(`  ⚠ Failed: ${cmd}`);
    return false;
  }
}

console.log(`
╔══════════════════════════════════════╗
║   Nova Browser — Setup               ║
║   Node.js 26.3.1+ required           ║
╚══════════════════════════════════════╝
`);

assertNodeVersion();

run('npm install', root);
run('node scripts/build-main.cjs', root);

if (fs.existsSync(cloudDir)) {
  run('npm install', cloudDir);
  const envPath = path.join(cloudDir, '.env');
  if (!fs.existsSync(envPath)) {
    fs.copyFileSync(path.join(cloudDir, '.env.example'), envPath);
  }
  let env = fs.readFileSync(envPath, 'utf8');
  if (!env.includes('sqlite:')) {
    env = env.replace(/DATABASE_URL=.*/, 'DATABASE_URL=sqlite:./data/nova-cloud.db');
    fs.writeFileSync(envPath, env);
  }
  run('npm run migrate', cloudDir);
  run('npm run seed', cloudDir);
}

if (fs.existsSync(aiDir)) {
  run('npm install', aiDir);
}

const dockerOk = run('docker --version', root);
if (dockerOk) {
  run('docker compose up -d postgres redis', cloudDir);
}

console.log(`
✅ Setup complete!

Ab sirf yeh chalao:
  npm run go

Yeh automatically start karega:
  • Nova Cloud API  → http://localhost:3847
  • Nova AI         → http://localhost:3850
  • Nova Browser    → desktop app

Docs: docs/KAISE_RUN_KARE.md
`);
