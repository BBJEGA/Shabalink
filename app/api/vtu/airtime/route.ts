
import { NextResponse } from 'next/server';
import { validateVtuRequest } from '../utils';
import { isquare } from '@/lib/isquare';
import { createClient } from '@/utils/supabase/server';
import { calculateVtuPrice } from '@/utils/pricing';

export async function POST(request: Request) {
    const body = await request.json();
    const { network_id, phone, pin, amount } = body;
    // amount: The Face Value (Cost) of airtime to buy.
    // We need to charge Cost * 1.03

    if (!amount || !phone || !network_id) {
        return NextResponse.json({ error: 'Missing details' }, { status: 400 });
    }

    const faceValue = Number(amount);

    // 1. Validation & Profile
    const validation = await validateVtuRequest(0, pin);
    if (validation.error) {
        return NextResponse.json({ error: validation.error }, { status: validation.status });
    }
    const { user, profile, supabase } = validation as any;

    // 2. Calculate Pricing
    const pricing = calculateVtuPrice(faceValue, 'airtime', (profile.tier as any) || 'smart');
    const finalPrice = pricing.sellingPrice;

    // 3. Check Balance
    if (profile.wallet_balance < finalPrice) {
        return NextResponse.json({ error: 'Insufficient funds' }, { status: 400 });
    }

    // 4. Deduct
    const { error: dedError } = await supabase.from('profiles').update({
        wallet_balance: profile.wallet_balance - finalPrice
    }).eq('id', user.id);

    if (dedError) return NextResponse.json({ error: 'Deduction failed' }, { status: 500 });

    // 5. Call Provider (We send Face Value 'amount')
    try {
        const transactionRef = `AIR-${Date.now()}-${user.id.slice(0, 4)}`;

        const apiResponse = await isquare.buyAirtime({
            network_id,
            amount: faceValue,
            phone,
            ref: transactionRef
        });

        // 6. Log Success
        await supabase.from('transactions').insert({
            user_id: user.id,
            type: 'airtime',
            amount: finalPrice,
            reference: transactionRef,
            status: 'success',
            description: `Airtime: ${network_id} ₦${faceValue} to ${phone}`,
            metadata: {
                provider_ref: apiResponse.reference || 'N/A',
                cost_price: faceValue,
                profit: pricing.profit
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Airtime purchase successful',
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
