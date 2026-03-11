require('dotenv').config({ path: ['.env.local', '.env'] });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectDb() {
    console.log('Fetching all profiles to check if table is really empty...');

    // 1. Fetch all profiles
    const { data: profiles, error: pError } = await supabase
        .from('profiles')
        .select('*');

    if (pError) {
        console.error('Error fetching profiles:', pError.message);
    } else {
        console.log(`Found ${profiles.length} profiles.`);
        if (profiles.length > 0) {
            console.log('First profile columns:', Object.keys(profiles[0]));
            console.log('First profile details:', profiles[0]);
        }
    }
}

inspectDb();
