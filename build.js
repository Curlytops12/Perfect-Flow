require('dotenv').config();
const esbuild = require('esbuild');

const watch = process.argv.includes('--watch');

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
