const esbuild = require('esbuild');
const path = require('path');

const isWatch = process.argv.includes('--watch');

const buildOptions = {
  entryPoints: [path.join(__dirname, '../src/main/index.js')],
  bundle: true,
  platform: 'node',
  target: 'node18',
  outfile: path.join(__dirname, '../dist-electron/main/index.js'),
  external: ['electron', 'better-sqlite3', 'electron-store', 'electron-updater'],
  format: 'cjs',
  sourcemap: true
};

if (isWatch) {
  esbuild.context(buildOptions).then((ctx) => {
    ctx.watch();
    console.log('Watching main process...');
  });
} else {
  esbuild
    .build(buildOptions)
    .then(() => {
      console.log('Main process built');
    })
    .catch(() => process.exit(1));
}
