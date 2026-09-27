// Runs a .sql file against the linked Supabase project via the Management API.
// Usage: node scripts/run-sql.js path/to/file.sql
//
// Needs SUPABASE_ACCESS_TOKEN + SUPABASE_PROJECT_REF in .env (local tooling
// only — this token is never read by build.js or shipped to the browser).

require('dotenv').config();
const fs = require('fs');
const path = require('path');

const file = process.argv[2];
if (!file) {
  console.error('Usage: node scripts/run-sql.js path/to/file.sql');
  process.exit(1);
}

const token = process.env.SUPABASE_ACCESS_TOKEN;
const ref = process.env.SUPABASE_PROJECT_REF;

if (!token || token.includes('paste_your')) {
  console.error('SUPABASE_ACCESS_TOKEN is not set in .env — get one at https://supabase.com/dashboard/account/tokens');
  process.exit(1);
}
if (!ref) {
  console.error('SUPABASE_PROJECT_REF is not set in .env');
  process.exit(1);
}

const sql = fs.readFileSync(path.resolve(file), 'utf8');

async function run() {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });

  const text = await res.text();
  if (!res.ok) {
    console.error(`Failed (${res.status}):`, text);
    process.exit(1);
  }
  console.log('Success.');
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed) && parsed.length) console.log(parsed);
  } catch (e) { /* empty/non-JSON response is fine */ }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
