if (process.env.NETLIFY === 'true' || process.env.CI === 'true' && process.env.NETLIFY) {
  console.log('Skipping electron native deps on Netlify/CI');
  process.exit(0);
}

const { execSync } = require('child_process');
try {
  execSync('electron-builder install-app-deps', { stdio: 'inherit' });
} catch (err) {
  console.warn('electron-builder install-app-deps skipped:', err.message);
}
