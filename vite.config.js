import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { execSync, spawn } from 'child_process';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const isNetlify = process.env.NETLIFY === 'true';

let electronProcess = null;

function buildMainProcess() {
  execSync('node scripts/build-main.cjs', { stdio: 'inherit' });
}

function startElectron(serverUrl) {
  if (electronProcess) {
    electronProcess.kill();
    electronProcess = null;
  }
  const electronPath = require('electron');
  electronProcess = spawn(electronPath, ['.'], {
    stdio: 'inherit',
    env: { ...process.env, VITE_DEV_SERVER_URL: serverUrl }
  });
  electronProcess.on('close', () => {
    electronProcess = null;
  });
}

function electronLauncherPlugin() {
  return {
    name: 'electron-launcher',
    configureServer(server) {
      server.httpServer?.once('listening', () => {
        const address = server.httpServer?.address();
        const port = typeof address === 'object' && address ? address.port : 5173;
        buildMainProcess();
        startElectron(`http://localhost:${port}`);
      });
      return () => {
        if (electronProcess) {
          electronProcess.kill();
          electronProcess = null;
        }
      };
    }
  };
}

async function getPlugins() {
  const plugins = [
    react()
  ];

  if (!isNetlify) {
    const electron = (await import('vite-plugin-electron')).default;
    const renderer = (await import('vite-plugin-electron-renderer')).default;

    plugins.unshift({
      name: 'build-electron-main',
      buildStart() {
        buildMainProcess();
      },
      handleHotUpdate() {
        buildMainProcess();
        if (electronProcess) startElectron(process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173');
      }
    });

    plugins.push(
      electron([
        {
          entry: path.resolve(__dirname, 'src/preload/browserPreload.js'),
          onstart(options) {
            buildMainProcess();
            options.startup();
          },
          vite: {
            build: {
              outDir: path.resolve(__dirname, 'dist-electron/preload'),
              rollupOptions: {
                output: {
                  format: 'cjs',
                  entryFileNames: 'browserPreload.js'
                }
              }
            }
          }
        }
      ]),
      renderer()
    );
  }

  return plugins;
}

export default defineConfig(async () => ({
  root: path.resolve(__dirname, 'src/renderer'),
  plugins: await getPlugins(),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/renderer')
    }
  },
  base: '/',
  server: {
    port: 5173,
    strictPort: false,
    watch: {
      ignored: ['**/downloads/**', '**/*.exe', '**/release/**']
    }
  },
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true
  }
}));
