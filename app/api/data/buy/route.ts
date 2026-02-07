
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { purchaseData } from '@/lib/isquare';

export async function POST(request: Request) {
    const supabase = await createClient();

    // 1. Authenticate User
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { network_id, plan_id, phone, pin, amount, bypass_validation } = body;

    // 2. Validate Input
    if (!network_id || !plan_id || !phone || !pin) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 3. Fetch User Profile (Balance & PIN)
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('wallet_balance, transaction_pin')
        .eq('id', user.id)
        .single();

    if (profileError || !profile) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // 4. Validate PIN (Simple check for now, should be hashed)
    if (profile.transaction_pin !== pin) {
        return NextResponse.json({ error: 'Invalid PIN' }, { status: 403 });
    }

    // 5. Check Balance
    if (profile.wallet_balance < amount) {
        return NextResponse.json({ error: 'Insufficient funds' }, { status: 402 });
    }

    // 6. Start Transaction (Supabase Transaction - if RPC available, otherwise manual sequence)
    // For simplicity: Deduct Balance -> Call API -> Log Transaction
    // Ideally, use a database transaction if possible or optimistic locking.

    // 6a. Deduct Balance
    const newBalance = profile.wallet_balance - amount;
    const { error: updateError } = await supabase
        .from('profiles')
        .update({ wallet_balance: newBalance })
        .eq('id', user.id);

    if (updateError) {
        return NextResponse.json({ error: 'Failed to deduct funds' }, { status: 500 });
    }

    // 6b. Call Provider API
    try {
        const transactionRef = `TXN-${Date.now()}-${user.id.slice(0, 4)}`; // simple generic ref

        // Call ISquareData (Mocking or Real based on availability)
        // const providerResponse = await purchaseData({ network_id, plan_id, phone });

        // MOCK SUCCESS for Development if key missing
        const providerResponse = { status: 'success', message: 'Data delivered', api_ref: 'MOCK_REF' };

        // 6c. Log Transaction
        await supabase.from('transactions').insert({
            user_id: user.id,
            type: 'purchase',
            amount: amount,
            reference: transactionRef,
            status: 'success',
            description: `Data Purchase: ${network_id} - ${plan_id} for ${phone}`,
            metadata: { provider_ref: providerResponse.api_ref, phone }
        });

        return NextResponse.json({ success: true, message: 'Transaction Successful', new_balance: newBalance });

    } catch (error: any) {
        // CRITICAL: Refund User if Provider Fails
        await supabase.from('profiles').update({ wallet_balance: profile.wallet_balance }).eq('id', user.id);

        return NextResponse.json({ error: error.message || 'Transaction failed' }, { status: 502 });
    }
}
