require('dotenv').config({ path: ['.env.local', '.env'] });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function creditMissingFunds() {
    console.log('Finding the most recently created user to credit 991 NGN...');

    // Find the latest user who successfully created an account
    const { data: profiles, error: pError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

    if (pError || profiles.length === 0) {
        console.error('Error finding profile:', pError?.message);
        return;
    }

    const profile = profiles[0];
    console.log(`Found Profile: ${profile.email} (${profile.id})`);

    const amount = 991.00;
    const newBalance = Number(profile.wallet_balance || 0) + amount;

    // Credit Balance
    const { error: updateError } = await supabase
        .from('profiles')
        .update({ wallet_balance: newBalance })
        .eq('id', profile.id);

    if (updateError) {
        console.error('Error updating balance:', updateError.message);
        return;
    }

    // Insert Transaction Record
    const { error: txError } = await supabase
        .from('transactions')
        .insert([{
            user_id: profile.id,
            type: 'deposit',
            amount: amount,
            reference: `MANUAL-RECOVERY-${Date.now()}`,
            status: 'success',
            description: 'Manual Recovery: Strowallet Virtual Account Deposit'
        }]);

    if (txError) {
        console.error('Warning: Balance credited, but transaction record failed:', txError.message);
    } else {
        console.log(`✅ Successfully recovered and credited 991 NGN to user: ${profile.email}. New Balance: ${newBalance}`);
    }
}

creditMissingFunds();
