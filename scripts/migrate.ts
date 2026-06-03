import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, '..', 'supabase', 'migrations');

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const files = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort();

  console.log(`Found ${files.length} migration files.`);
  for (const file of files) {
    const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf-8');
    console.log(`\n[${file}] applying (${sql.length} chars)...`);
    const { error } = await supabase.rpc('exec_sql', { sql });
    if (error) {
      console.error(`  ✗ ${error.message}`);
      console.error('  Tip: supabase/migrations/*.sql must be run via the Supabase SQL editor or `supabase db push`');
      process.exit(1);
    }
    console.log(`  ✓ ${file}`);
  }
  console.log('\nAll migrations applied.');
}

main().catch((e) => { console.error(e); process.exit(1); });
