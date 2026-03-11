
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { createStrowalletAccount } from '@/lib/payment-providers';

export async function POST(request: Request) {
    const supabase = await createClient();

    // 1. Authenticate User
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // 2. Check if user already has an account
        let { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('account_number, full_name, email')
            .eq('id', user.id)
            .single();

        // Lazy Initialization: If the trigger failed or was dropped, create the profile securely here.
        if (profileError || !profile) {
            console.log('Profile not found, performing lazy initialization...');

            const newProfile = {
                id: user.id,
                email: user.email,
                full_name: user.user_metadata?.full_name || 'Shabalink User',
                wallet_balance: 0.00,
                tier: 'level_1'
            };

            const { error: insertError } = await supabase
                .from('profiles')
                .insert([newProfile]);

            if (insertError) {
                console.error('Lazy init insert error:', insertError.message);
                return NextResponse.json({ error: 'Failed to initialize new profile: ' + insertError.message }, { status: 500 });
            }

            profile = newProfile as any;
        }

        if (profile?.account_number) {
            return NextResponse.json({ message: 'User already has a virtual account', account: profile.account_number });
        }

        // 3. Generate Virtual Account (Tier 1)
        const accountData = await createStrowalletAccount({
            email: profile?.email || user.email || '',
            name: profile?.full_name || 'Shabalink User',
        });

        if (!accountData.success) {
            throw new Error('Failed to generate account provider');
        }

        // 4. Update Profile
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                account_number: accountData.account_number,
                account_name: accountData.account_name,
                bank_name: accountData.bank_name,
                tier: 'level_1'
            })
            .eq('id', user.id);

        if (updateError) {
            throw new Error('Failed to update profile with account details');
        }

        return NextResponse.json({ success: true, account: accountData });

    } catch (error: any) {
        console.error('Wallet Init Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
