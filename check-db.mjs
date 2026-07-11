import pg from 'pg';
const { Client } = pg;

const CONN = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!CONN) {
  console.error('Set DATABASE_URL or SUPABASE_DB_URL to a Supabase pooler connection string first.');
  process.exit(1);
}

async function main() {
  const client = new Client({ connectionString: CONN, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('Connected');

  // Check existing tables
  const tables = await client.query(
    `SELECT table_schema, table_name 
     FROM information_schema.tables 
     WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
     ORDER BY table_schema, table_name`
  );
  console.log('\n=== TABLES ===');
  tables.rows.forEach(r => console.log(`  ${r.table_schema}.${r.table_name}`));

  // Check if profiles exists
  const hasProfiles = await client.query(
    `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema='public' AND table_name='profiles') as ok`
  );
  console.log(`\nHas profiles table: ${hasProfiles.rows[0].ok}`);

  // Check profiles count
  if (hasProfiles.rows[0].ok) {
    const count = await client.query('SELECT COUNT(*) FROM profiles');
    console.log(`Profiles count: ${count.rows[0].count}`);
    
    // Check role constraint
    const constraints = await client.query(
      `SELECT conname, consrc FROM pg_constraint WHERE conrelid = 'profiles'::regclass AND conname LIKE '%role%'`
    );
    console.log(`Role constraints:`, constraints.rows);
  }

  await client.end();
  console.log('\nDone');
}
main().catch(e => { console.error('Error:', e.message); process.exit(1); });
