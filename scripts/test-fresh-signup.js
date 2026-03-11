require('dotenv').config({ path: ['.env.local', '.env'] });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFreshSignup() {
    console.log('Testing Supabase Signup with a brand new email...');

    // Use a fresh email to ensure the auth.users INSERT trigger actually fires
    const testEmail = `fresh.test.${Date.now()}@shabalink.com`;

    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: testEmail,
        password: 'Password123@!',
        options: {
            data: { full_name: 'Fresh Tester' }
        }
    });

    if (authError) {
        console.error('SIGNUP ERROR (Auth):', authError.message);
        return;
    }

    const userId = authData.user?.id;
    console.log('SIGNUP SUCCESS! New User ID:', userId);
    console.log('Waiting 2 seconds for Postgres Trigger to finish...');

    await new Promise(r => setTimeout(r, 2000));

    console.log('Checking if the trigger successfully created the Profile...');
    const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId);

    if (profileError) {
        console.error('PROFILE CHECK ERROR:', profileError.message);
    } else if (profileData.length === 0) {
        console.log('❌ TRIGGER FAILED: Auth user created, but no profile was inserted by the database.');
    } else {
        console.log('✅ TRIGGER SUCCESS! Profile was successfully created:', profileData[0]);
    }
}

testFreshSignup();
