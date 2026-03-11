require('dotenv').config({ path: ['.env.local', '.env'] });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Must use service role to query auth.users

if (!supabaseKey) {
    console.error('No service role key found. Cannot query auth.users.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectAuth() {
    console.log('Fetching auth users...');

    const { data: users, error: uError } = await supabase.auth.admin.listUsers();

    if (uError) {
        console.error('Error fetching auth users:', uError.message);
    } else {
        console.log(`Found ${users.users.length} users in auth.users.`);
        users.users.forEach(u => {
            console.log(`- ${u.email} (Created: ${u.created_at})`);
        });
    }
}

inspectAuth();
