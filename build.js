require('dotenv').config();
const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const watch = process.argv.includes('--watch');

function copyPdfWorker() {
  const src = path.join(__dirname, 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs');
  const dest = path.join(__dirname, 'public/pdf.worker.min.mjs');
  fs.copyFileSync(src, dest);
}

const define = {
  'process.env.SUPABASE_URL': JSON.stringify(process.env.SUPABASE_URL || ''),
  'process.env.SUPABASE_ANON_KEY': JSON.stringify(process.env.SUPABASE_ANON_KEY || ''),
};

const options = {
  entryPoints: ['src/index.jsx'],
  bundle: true,
  outfile: 'public/bundle.js',
  platform: 'browser',
  loader: { '.js': 'jsx' },
  external: ['fs', 'path'],
  define,
};

async function run() {
  copyPdfWorker();
  if (watch) {
    const ctx = await esbuild.context(options);
    await ctx.watch();
    console.log('Watching for changes...');
  } else {
    const result = await esbuild.build({ ...options, metafile: true });
    console.log('Build complete.');
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
