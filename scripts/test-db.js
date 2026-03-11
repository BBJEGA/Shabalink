require('dotenv').config({ path: ['.env.local', '.env'] });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
    console.log('Testing direct insert into profiles table...');

    // We need a valid UUID for 'id' since it references auth.users.
    // Instead of inserting a real user, let's just query the schema to see if wallet_balance exists.

    // Actually, let's try calling an RPC or doing a raw query to check if the trigger function exists and if it is valid.

    const { data: cols, error: colError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);

    if (colError) {
        console.error('Error selecting from profiles:', colError);
    } else {
        console.log('Profiles table columns:', cols.length > 0 ? Object.keys(cols[0]) : 'Table is empty, but accessible.');
    }
}

testInsert();
