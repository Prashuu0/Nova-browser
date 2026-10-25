const fs = require('fs');
const path = require('path');
const { app, BrowserWindow } = require('electron');
const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../database');

function getExtensionsDir() {
  const dir = path.join(app.getPath('userData'), 'nova-extensions');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function loadExtensionsFromDisk() {
  const db = getDatabase();
  const dir = getExtensionsDir();
  if (!fs.existsSync(dir)) return;
  const folders = fs.readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory());

  for (const folder of folders) {
    const manifestPath = path.join(dir, folder.name, 'manifest.json');
    if (!fs.existsSync(manifestPath)) continue;
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      const id = folder.name;
      const existing = db.prepare('SELECT id FROM extensions WHERE id = ?').get(id);
      if (!existing) {
        db.prepare(`INSERT INTO extensions (id, name, version, enabled, path, manifest_json, installed_at) VALUES (?, ?, ?, 1, ?, ?, ?)`).run(
          id,
          manifest.name || id,
          manifest.version || '1.0',
          path.join(dir, folder.name),
          JSON.stringify(manifest),
          Date.now()
        );
      } else {
        db.prepare('UPDATE extensions SET name = ?, version = ?, manifest_json = ?, path = ? WHERE id = ?').run(
          manifest.name || id,
          manifest.version || '1.0',
          JSON.stringify(manifest),
          path.join(dir, folder.name),
          id
        );
      }
    } catch {}
  }
}

function installFromCatalog(ext) {
  const slug = (ext.slug || ext.name || ext.id || 'ext').toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const dir = path.join(getExtensionsDir(), slug);
  fs.mkdirSync(dir, { recursive: true });

  let manifest = ext.manifest;
  if (typeof manifest === 'string') {
    try { manifest = JSON.parse(manifest); } catch { manifest = null; }
  }
  if (!manifest) {
    manifest = {
      manifest_version: 2,
      name: ext.name,
      version: ext.version || '1.0.0',
      description: ext.description || '',
      content_scripts: [{
        matches: ['<all_urls>'],
        js: ['content.js'],
        run_at: 'document_idle'
      }]
    };
  }

  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2));

  const writeDefault = (relPath, content) => {
    const full = path.join(dir, relPath);
    if (!fs.existsSync(full)) {
      fs.mkdirSync(path.dirname(full), { recursive: true });
      fs.writeFileSync(full, content);
    }
  };

  for (const cs of manifest.content_scripts || []) {
    for (const js of cs.js || []) {
      writeDefault(js, `// Nova Store Extension: ${ext.name}\n(function(){'use strict';console.log('[Nova] ${ext.name} active');})();\n`);
    }
    for (const css of cs.css || []) {
      writeDefault(css, `/* Nova Store Extension: ${ext.name} */\n`);
    }
  }

  if (ext.download_url) {
    // Optional remote package — manifest install is sufficient for beta
  }

  const db = getDatabase();
  db.prepare(`INSERT OR REPLACE INTO extensions (id, name, version, enabled, path, manifest_json, installed_at) VALUES (?, ?, ?, 1, ?, ?, ?)`).run(
    slug,
    manifest.name || ext.name,
    manifest.version || ext.version || '1.0',
    dir,
    JSON.stringify(manifest),
    Date.now()
  );

  return { success: true, id: slug, name: manifest.name, path: dir };
}

function getAllExtensions() {
  loadExtensionsFromDisk();
  const db = getDatabase();
  return db.prepare('SELECT * FROM extensions ORDER BY installed_at DESC').all().map((e) => ({
    id: e.id,
    name: e.name,
    version: e.version,
    enabled: !!e.enabled,
    path: e.path
  }));
}

function getContentScriptsForUrl(url) {
  const db = getDatabase();
  const extensions = db.prepare('SELECT * FROM extensions WHERE enabled = 1').all();
  const scripts = [];

  for (const ext of extensions) {
    try {
      const manifest = JSON.parse(ext.manifest_json || '{}');
      for (const cs of manifest.content_scripts || []) {
        const matches = cs.matches || ['<all_urls>'];
        const matched = matches.some((pattern) => {
          if (pattern === '<all_urls>') return true;
          try {
            const re = new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\//g, '\\/') + '$');
            return re.test(url);
          } catch {
            return false;
          }
        });
        if (matched && cs.js) {
          for (const jsFile of cs.js) {
            const scriptPath = path.join(ext.path, jsFile);
            if (fs.existsSync(scriptPath)) {
              scripts.push(fs.readFileSync(scriptPath, 'utf8'));
            }
          }
        }
      }
    } catch {}
  }
  return scripts;
}

function toggleExtension(id, enabled) {
  const db = getDatabase();
  db.prepare('UPDATE extensions SET enabled = ? WHERE id = ?').run(enabled ? 1 : 0, id);
  return { success: true };
}

function openExtensionsFolder() {
  const { shell } = require('electron');
  shell.openPath(getExtensionsDir());
  return { path: getExtensionsDir() };
}

function getStylesForUrl(url) {
  const db = getDatabase();
  const extensions = db.prepare('SELECT * FROM extensions WHERE enabled = 1').all();
  const styles = [];

  for (const ext of extensions) {
    try {
      const manifest = JSON.parse(ext.manifest_json || '{}');
      for (const cs of manifest.content_scripts || []) {
        const matches = cs.matches || ['<all_urls>'];
        const matched = matches.some((pattern) => {
          if (pattern === '<all_urls>') return true;
          try {
            const re = new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\//g, '\\/') + '$');
            return re.test(url);
          } catch {
            return false;
          }
        });
        if (matched && cs.css) {
          for (const cssFile of cs.css) {
            const cssPath = path.join(ext.path, cssFile);
            if (fs.existsSync(cssPath)) {
              styles.push(fs.readFileSync(cssPath, 'utf8'));
            }
          }
        }
      }
    } catch {}
  }
  return styles;
}

function installFromZip(zipPath) {
  const { execSync } = require('child_process');
  const slug = `ext-${Date.now()}`;
  const dir = path.join(getExtensionsDir(), slug);
  fs.mkdirSync(dir, { recursive: true });

  if (process.platform === 'win32') {
    execSync(`powershell -NoProfile -Command "Expand-Archive -Path '${zipPath.replace(/'/g, "''")}' -DestinationPath '${dir.replace(/'/g, "''")}' -Force"`, { stdio: 'pipe' });
  } else {
    execSync(`unzip -o "${zipPath}" -d "${dir}"`, { stdio: 'pipe' });
  }

  const manifestPath = findManifestInDir(dir);
  if (!manifestPath) return { error: 'No manifest.json in zip' };
  return registerExtensionDir(path.dirname(manifestPath));
}

function installFromCrx(crxPath) {
  const buffer = fs.readFileSync(crxPath);
  let offset = buffer.indexOf('PK\u0003\u0004');
  if (offset < 0) return { error: 'Invalid CRX file' };
  const zipPath = crxPath.replace(/\.crx$/i, '.zip');
  fs.writeFileSync(zipPath, buffer.subarray(offset));
  return installFromZip(zipPath);
}

function installFromChromeId(extensionId) {
  const { net } = require('electron');
  return new Promise((resolve) => {
    const url = `https://clients2.google.com/service/update2/crx?response=redirect&prodversion=98.0&acceptformat=crx2,crx3&x=id%3D${extensionId}%26uc`;
    const crxPath = path.join(getExtensionsDir(), `${extensionId}.crx`);
    const file = fs.createWriteStream(crxPath);
    net.request(url).on('response', (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(installFromCrx(crxPath));
      });
    }).on('error', (err) => resolve({ error: err.message })).end();
  });
}

function findManifestInDir(dir) {
  const direct = path.join(dir, 'manifest.json');
  if (fs.existsSync(direct)) return direct;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const found = findManifestInDir(path.join(dir, entry.name));
      if (found) return found;
    }
  }
  return null;
}

function registerExtensionDir(dir) {
  const manifestPath = path.join(dir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) return { error: 'manifest.json missing' };
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const id = path.basename(dir);
  const db = getDatabase();
  db.prepare(`INSERT OR REPLACE INTO extensions (id, name, version, enabled, path, manifest_json, installed_at) VALUES (?, ?, ?, 1, ?, ?, ?)`).run(
    id,
    manifest.name || id,
    manifest.version || '1.0',
    dir,
    JSON.stringify(manifest),
    Date.now()
  );
  return { success: true, id, name: manifest.name, path: dir };
}

function installUnpackedFolder(folderPath) {
  return registerExtensionDir(folderPath);
}

module.exports = {
  getAllExtensions,
  getContentScriptsForUrl,
  getStylesForUrl,
  toggleExtension,
  openExtensionsFolder,
  getExtensionsDir,
  loadExtensionsFromDisk,
  installFromCatalog,
  installFromZip,
  installFromCrx,
  installFromChromeId,
  installUnpackedFolder
};
