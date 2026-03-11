require('dotenv').config({ path: ['.env.local', '.env'] });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
// We must use Anon key because Service Role key is missing, but Service Role is required for Auth Admin.
// We will test if the ANON key can write to profiles.
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseSchema() {
    console.log('Sending malformed request to profiles to force a schema error return...');

    const { error } = await supabase
        .from('profiles')
        .insert([{
            id: '123e4567-e89b-12d3-a456-426614174000', // valid uuid form
            email: 'test@shabalink.com',
            full_name: 'test',
            wallet_balance: 0
        }]);

    console.log('Postgres Output:', error ? error : 'Success (should not happen due to RLS/foreign keys)');
}

checkDatabaseSchema();
