import { readFileSync } from 'fs';
import pg from 'pg';

const { Client } = pg;

const CONN = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!CONN) {
  console.error('Set DATABASE_URL or SUPABASE_DB_URL to a Supabase pooler connection string first.');
  process.exit(1);
}

const migrations = [
  'C:/Users/user pc/Desktop/Dala/Skillbridge/supabase/migrations/20260708000000_ai_tutor.sql',
];

async function main() {
  const client = new Client({ connectionString: CONN, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('Connected to database');

  for (const file of migrations) {
    const sql = readFileSync(file, 'utf-8');
    console.log(`Running: ${file.split('/').pop()}`);
    try {
      await client.query(sql);
      console.log('  -> SUCCESS');
    } catch (err) {
      console.error(`  -> FAILED: ${err.message}`);
    }
  }

  await client.end();
  console.log('Done');
}

main().catch(console.error);
