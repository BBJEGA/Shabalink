require('dotenv').config({ path: ['.env.local', '.env'] });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
    console.error('No service role key found. Cannot execute raw RPCs or admin commands.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseSignup() {
    console.log('Testing raw profile insertion constraint...');

    // We will generate a fake user ID just to see if the trigger or table allows insertion
    const fakeUuid = '00000000-0000-0000-0000-000000000000';

    // Standard supabase client doesn't let you run raw SQL cleanly without RPC,
    // so let's try to bypass the trigger by manually inserting a profile and seeing the foreign key violation.

    console.log('Attempting manual profile insert without an auth.user...');
    const { error: insertError } = await supabase
        .from('profiles')
        .insert([{
            id: fakeUuid,
            email: 'test@shabalink.com',
            full_name: 'Test Name',
            wallet_balance: 0
        }]);

    console.log('Insert Result:', insertError ? insertError.message : 'SUCCESS');

    console.log('\nRetrying Signup...');
    const testEmail = `test.diagnose.${Date.now()}@shabalink.com`;

    const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: 'Password123@#',
        options: {
            data: {
                full_name: 'Diagnosis User'
            }
        }
    });

    if (error) {
        console.error('SIGNUP ERROR:', error.message);
        console.error('Details:', error);
    } else {
        console.log('SIGNUP SUCCESS! User ID:', data.user?.id);
    }
}

diagnoseSignup();
