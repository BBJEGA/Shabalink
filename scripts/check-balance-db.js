require('dotenv').config({ path: ['.env.local', '.env'] });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUserBalance() {
    console.log('Checking database balance for the latest user...');

    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('email, wallet_balance, full_name, id')
        .order('created_at', { ascending: false })
        .limit(1);

    if (error || profiles.length === 0) {
        console.error('Error fetching profile:', error?.message);
        return;
    }

    const profile = profiles[0];
    console.log(`User: ${profile.email}`);
    console.log(`Database Wallet Balance: ${profile.wallet_balance} NGN`);

    // Check if the balance is actually numeric or weirdly formatted
    console.log(`Type of balance: ${typeof profile.wallet_balance}`);
}

checkUserBalance();
