require('dotenv').config({ path: ['.env.local', '.env'] });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSignup() {
    console.log('Testing Supabase Signup to catch exact database error...');

    const testEmail = `test.error.${Date.now()}@shabalink.com`;

    // Attempt standard signup
    const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: 'Password123!',
        options: {
            data: {
                full_name: 'Test Setup User'
            }
        }
    });

    if (error) {
        console.error('SIGNUP ERROR:', error.message);
        console.error('FULL ERROR OBJECT:', error);
    } else {
        console.log('SIGNUP SUCCESS! User ID:', data.user?.id);
    }
}

testSignup();
