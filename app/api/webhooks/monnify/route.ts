import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with Service Role Key to bypass RLS in the webhook
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
    try {
        const payload = await req.json();
        console.log('--- MONNIFY WEBHOOK RECEIVED ---');
        console.log(JSON.stringify(payload, null, 2));

        // Note: Monnify webhooks can be wrapped in `eventData` or sent directly
        const data = payload.eventData || payload;
        const transactionType = payload.eventType || "SUCCESSFUL_TRANSACTION";

        if (transactionType !== "SUCCESSFUL_TRANSACTION") {
            return NextResponse.json({ status: 'ignored', reason: 'Not a successful transaction event' });
        }

        const accountNumber = data.product?.reference || data.accountReference || data.customer?.customerWalletNumber;
        const transactionRef = data.transactionReference || data.paymentReference;
        const amount = parseFloat(data.settlementAmount || data.amountPaid || '0');

        if (!amount || isNaN(amount)) {
            return NextResponse.json({ status: 'ignored', reason: 'No valid amount found' });
        }

        let profile = null;

        // Find user by Monnify Account Number
        if (accountNumber) {
            // First try matching against monnify account column
            const { data: profileByMonnify } = await supabase
                .from('profiles')
                .select('id, wallet_balance')
                .eq('monnify_account_number', accountNumber)
                .single();
            
            profile = profileByMonnify;

            // Fallback to regular account number in case it was stored there during earlier tests
            if (!profile) {
                 const { data: profileByPrimary } = await supabase
                    .from('profiles')
                    .select('id, wallet_balance')
                    .eq('account_number', accountNumber)
                    .single();
                 profile = profileByPrimary;
            }
        }

        if (!profile) {
            console.error('Webhook Error: Could not match Monnify deposit to any user profile.', payload);
            return NextResponse.json({ error: 'User not found for this account' }, { status: 404 });
        }

        // Check Idempotency
        const { data: existingTx } = await supabase
            .from('transactions')
            .select('id')
            .eq('reference', transactionRef)
            .single();

        if (existingTx) {
            console.log('Webhook Warning: Transaction already processed.', transactionRef);
            return NextResponse.json({ status: 'duplicate' });
        }

        // 1. Log Deposit Transaction
        const { error: txError } = await supabase
            .from('transactions')
            .insert([{
                user_id: profile.id,
                type: 'deposit',
                amount: amount,
                reference: transactionRef,
                status: 'success',
                description: 'Monnify Virtual Account Deposit',
                metadata: payload
            }]);

        if (txError) {
            console.error('Failed to insert transaction:', txError);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        // 2. Update Balance
        const newBalance = Number(profile.wallet_balance || 0) + amount;

        const { error: balanceError } = await supabase
            .from('profiles')
            .update({ wallet_balance: newBalance })
            .eq('id', profile.id);

        if (balanceError) {
            console.error('Failed to update balance:', balanceError);
            return NextResponse.json({ error: 'Balance update failed' }, { status: 500 });
        }

        console.log(`Successfully credited ${amount} to user ${profile.id} via Monnify.`);
        return NextResponse.json({ success: true, status: 'credited' });

    } catch (error: any) {
        console.error('Monnify Webhook Error:', error.message);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
