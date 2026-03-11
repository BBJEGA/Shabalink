import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with Service Role Key to bypass RLS in the webhook
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
    try {
        const payload = await req.json();
        console.log('--- STROWALLET WEBHOOK RECEIVED ---');
        console.log(JSON.stringify(payload, null, 2));

        // Strowallet webhook payloads vary, safely extract identifying data
        const accountNumber = payload.account_number || payload.data?.account_number || payload.virtual_account_number || payload.data?.virtual_account_number;
        const sessionId = payload.session_id || payload.data?.session_id || payload.reference || payload.data?.reference || payload.transactionReference;
        const customerEmail = payload.customer_email || payload.customer?.email || payload.data?.customer?.email || payload.email;
        const amountStr = payload.settled_amount || payload.amount || payload.data?.settled_amount || payload.data?.amount || payload.settledAmount;

        let amount = parseFloat(amountStr);

        // If it's a test event or missing core financial data, ignore it gracefully
        if (!amount || isNaN(amount)) {
            return NextResponse.json({ status: 'ignored', reason: 'No valid settled_amount found' });
        }

        let profile = null;

        // Find user by Account Number
        if (accountNumber) {
            const { data } = await supabase
                .from('profiles')
                .select('id, wallet_balance')
                .eq('account_number', accountNumber)
                .single();
            profile = data;
        }

        // If not found by account number, maybe Strowallet sends email or metadata
        if (!profile && payload.customer_email) {
            const { data } = await supabase
                .from('profiles')
                .select('id, wallet_balance')
                .eq('email', payload.customer_email)
                .single();
            profile = data;
        }

        if (!profile) {
            console.error('Webhook Error: Could not match deposit to any user profile.', payload);
            return NextResponse.json({ error: 'User not found for this account' }, { status: 404 });
        }

        const transactionRef = sessionId || `STRO-${Date.now()}-${Math.random().toString(36).substring(7)}`;

        // Check if transaction already exists (Idempotency)
        const { data: existingTx } = await supabase
            .from('transactions')
            .select('id')
            .eq('reference', transactionRef)
            .single();

        if (existingTx) {
            console.log('Webhook Warning: Transaction already processed.', transactionRef);
            return NextResponse.json({ status: 'duplicate' });
        }

        // 1. Log the Deposit Transaction
        const { error: txError } = await supabase
            .from('transactions')
            .insert([{
                user_id: profile.id,
                type: 'deposit',
                amount: amount,
                reference: transactionRef,
                status: 'success',
                description: 'Strowallet Virtual Account Deposit',
                metadata: payload
            }]);

        if (txError) {
            console.error('Failed to insert transaction:', txError);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        // 2. Update User Wallet Balance
        const newBalance = Number(profile.wallet_balance || 0) + amount;

        const { error: balanceError } = await supabase
            .from('profiles')
            .update({ wallet_balance: newBalance })
            .eq('id', profile.id);

        if (balanceError) {
            console.error('Failed to update balance:', balanceError);
            // We inserted the transaction, but balance failed. Requires manual sync in a real app.
            return NextResponse.json({ error: 'Balance update failed' }, { status: 500 });
        }

        console.log(`Successfully credited ${amount} to user ${profile.id}. New Balance: ${newBalance}`);
        return NextResponse.json({ success: true, status: 'credited' });

    } catch (error: any) {
        console.error('Webhook Processing Error:', error.message);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
