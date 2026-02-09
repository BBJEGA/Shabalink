
import { createClient } from '@/utils/supabase/server';

export async function validateVtuRequest(amount: number, pin: string) {
    const supabase = await createClient();

    // 1. Authenticate User
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return { error: 'Unauthorized', status: 401 };
    }

    // 2. Fetch Profile (Balance & PIN)
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('wallet_balance, transaction_pin, tier')
        .eq('id', user.id)
        .single();

    if (profileError || !profile) {
        return { error: 'Profile not found', status: 404 };
    }

    // 3. Validate PIN
    if (profile.transaction_pin !== pin) {
        return { error: 'Invalid PIN', status: 403 };
    }

    // 4. Validate Balance
    if (profile.wallet_balance < amount) {
        return { error: 'Insufficient funds', status: 402 };
    }

    return { user, profile, supabase };
}
