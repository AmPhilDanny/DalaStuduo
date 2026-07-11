import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const SRV_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your_service_role_key_here';
const sql = readFileSync(new URL('../supabase/migrations/fix_rpc_updated_at.sql', import.meta.url), 'utf8');

// Use the service role key with management API to run SQL
const res = await fetch('https://krihvhyexqstphxqkljr.supabase.co/api/pg', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + SRV_KEY,
    'apikey': SRV_KEY,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ query: sql })
});

const text = await res.text();
console.log('Status:', res.status);
console.log('Response:', text.substring(0, 2000));
