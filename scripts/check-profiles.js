require('dotenv').config({ path: ['.env.local', '.env'] });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfiles() {
    console.log('Checking recent profiles attached to auth.users...');

    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error fetching profiles:', error.message);
    } else if (profiles.length === 0) {
        console.log('NO PROFILES FOUND IN DATABASE. The trigger is still silently failing.');
    } else {
        console.log(`Found ${profiles.length} recent profiles. The trigger IS working!`);
        profiles.forEach(p => {
            console.log(`- ID: ${p.id}, Email: ${p.email}, Name: ${p.full_name}, Account: ${p.account_number}`);
        });
    }
}

checkProfiles();
