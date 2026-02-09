
import { NextResponse } from 'next/server';
import { validateVtuRequest } from '../utils';
import { isquare } from '@/lib/isquare';
import { createClient } from '@/utils/supabase/server';
import { calculateVtuPrice } from '@/utils/pricing';

export async function POST(request: Request) {
    const body = await request.json();
    const { disco_id, meter_number, meter_type, amount, phone, pin, action } = body;

    // Verify Action
    if (action === 'verify') {
        try {
            const verification = await isquare.verifyElectricity({ disco_id, meter_number, meter_type });
            return NextResponse.json({ success: true, data: verification });
        } catch (error: any) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
    }

    // Purchase Action
    if (action === 'purchase') {
        const billAmount = Number(amount);
        if (!billAmount) return NextResponse.json({ error: 'Amount required' }, { status: 400 });

        // 1. Validation & Profile
        const validation = await validateVtuRequest(0, pin);
        if (validation.error) {
            return NextResponse.json({ error: validation.error }, { status: validation.status });
        }
        const { user, profile, supabase } = validation as any;

        // 2. Pricing (+100 Service Fee)
        const pricing = calculateVtuPrice(billAmount, 'electricity', (profile.tier as any) || 'smart');
        const finalPrice = pricing.sellingPrice;

        // 3. Balance Check
        if (profile.wallet_balance < finalPrice) {
            return NextResponse.json({ error: 'Insufficient funds' }, { status: 400 });
        }

        // 4. Deduct
        const { error: dedError } = await supabase.from('profiles').update({
            wallet_balance: profile.wallet_balance - finalPrice
        }).eq('id', user.id);

        if (dedError) return NextResponse.json({ error: 'Deduction failed' }, { status: 500 });

        // 5. API Call
        try {
            const transactionRef = `ELEC-${Date.now()}-${user.id.slice(0, 4)}`;
            const apiResponse = await isquare.payElectricity({
                disco_id,
                meter_number,
                amount: billAmount, // Send actual bill amount
                phone,
                ref: transactionRef
            });

            // 6. Log
            await supabase.from('transactions').insert({
                user_id: user.id,
                type: 'electricity',
                amount: finalPrice,
                reference: transactionRef,
                status: 'success',
                description: `Electricity: ${disco_id} ${meter_number}`,
                metadata: {
                    provider_ref: apiResponse.reference || 'N/A',
                    cost_price: billAmount,
                    profit: pricing.profit
                }
            });

            return NextResponse.json({ success: true, message: 'Payment successful', new_balance: profile.wallet_balance - finalPrice });

        } catch (error: any) {
            // Refund
            const { data: current } = await supabase.from('profiles').select('wallet_balance').eq('id', user.id).single();
            if (current) {
                await supabase.from('profiles').update({ wallet_balance: current.wallet_balance + finalPrice }).eq('id', user.id);
            }
            return NextResponse.json({ error: error.message || 'Transaction failed' }, { status: 502 });
        }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
