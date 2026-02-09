
import { NextResponse } from 'next/server';
import { validateVtuRequest } from '../utils';
import { isquare } from '@/lib/isquare';
import { createClient } from '@/utils/supabase/server';
import { calculateVtuPrice } from '@/utils/pricing';

export async function POST(request: Request) {
    const body = await request.json();
    const { network_id, plan_id, phone, pin, amount } = body;
    // amount: Expected to be the Final Selling Price the user saw

    if (!plan_id || !phone) {
        return NextResponse.json({ error: 'Missing plan details' }, { status: 400 });
    }

    // 1. Fetch Plan to get TRUE Cost Price
    let planCost = 0;
    try {
        // In a real app with many plans, we might want a efficient lookup. 
        // For now, getServices returns the list (cached or mock).
        const plans = await isquare.getServices('data');
        const plan = plans.find((p: any) => p.id === plan_id || p.plan_id === plan_id);

        if (!plan) {
            return NextResponse.json({ error: 'Invalid Plan ID' }, { status: 400 });
        }
        planCost = Number(plan.amount); // This is the Provider Price (Cost)
    } catch (e: any) {
        return NextResponse.json({ error: 'Failed to fetch plan details: ' + e.message }, { status: 500 });
    }

    // 2. Validate Request & Get Profile
    // We temporarily pass '0' or 'amount' to validator just to get the user/profile. 
    // We will check balance manually after calculating exact price.
    const validation = await validateVtuRequest(0, pin);
    if (validation.error) {
        return NextResponse.json({ error: validation.error }, { status: validation.status });
    }
    const { user, profile, supabase } = validation as any;

    // 3. Calculate Final Selling Price
    const pricing = calculateVtuPrice(planCost, 'data', (profile.tier as any) || 'smart');
    const finalPrice = pricing.sellingPrice;

    // 4. Verify User Consent (Price Check)
    // If the frontend sent an amount, it must match our calculation (within small margin due to float)
    if (amount) {
        if (Math.abs(Number(amount) - finalPrice) > 2) {
            return NextResponse.json({
                error: `Price mismatch. Expected ₦${finalPrice} but got ₦${amount}. Please refresh plans.`
            }, { status: 400 });
        }
    }

    // 5. Check Balance
    if (profile.wallet_balance < finalPrice) {
        return NextResponse.json({ error: 'Insufficient funds' }, { status: 400 });
    }

    // 6. Deduct
    const { error: dedError } = await supabase.from('profiles').update({
        wallet_balance: profile.wallet_balance - finalPrice
    }).eq('id', user.id);

    if (dedError) return NextResponse.json({ error: 'Deduction failed' }, { status: 500 });

    // 7. Call Provider
    try {
        const transactionRef = `DATA-${Date.now()}-${user.id.slice(0, 4)}`;

        const apiResponse = await isquare.buyData({
            network_id,
            plan_id,
            phone,
            ref: transactionRef
        });

        // 8. Log Success
        await supabase.from('transactions').insert({
            user_id: user.id,
            type: 'data',
            amount: finalPrice,
            reference: transactionRef,
            status: 'success',
            description: `Data: ${network_id} Plan ${plan_id} to ${phone}`,
            metadata: {
                provider_ref: apiResponse.reference || 'N/A',
                plan_id,
                cost_price: planCost,
                profit: pricing.profit
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Data purchase successful',
            new_balance: profile.wallet_balance - finalPrice
        });

    } catch (error: any) {
        // REFUND
        const { data: current } = await supabase.from('profiles').select('wallet_balance').eq('id', user.id).single();
        if (current) {
            await supabase.from('profiles').update({ wallet_balance: current.wallet_balance + finalPrice }).eq('id', user.id);
        }

        return NextResponse.json({ error: error.message || 'Transaction failed' }, { status: 502 });
    }
}
