
import { NextResponse } from 'next/server';
import { validateVtuRequest } from '../utils';
import { isquare } from '@/lib/isquare';
import { createClient } from '@/utils/supabase/server';
import { calculateVtuPrice } from '@/utils/pricing';

export async function POST(request: Request) {
    const body = await request.json();
    const { cable_id, plan_id, smartcard, phone, pin, action } = body;

    if (action === 'verify') {
        try {
            const verification = await isquare.verifySmartcard({ cable_id, smartcard });
            return NextResponse.json({ success: true, data: verification });
        } catch (error: any) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
    }

    if (action === 'purchase') {
        if (!plan_id) return NextResponse.json({ error: 'Plan required' }, { status: 400 });

        // 1. Get Plan Cost
        let planCost = 0;
        try {
            const services = await isquare.getServices('cable');
            const plan = services.find((p: any) => p.id === plan_id || p.plan_id === plan_id);
            if (!plan) throw new Error('Invalid Plan');
            planCost = Number(plan.amount);
        } catch (e) {
            return NextResponse.json({ error: 'Invalid Plan ID' }, { status: 400 });
        }

        // 2. Validation & Profile
        const validation = await validateVtuRequest(0, pin);
        if (validation.error) {
            return NextResponse.json({ error: validation.error }, { status: validation.status });
        }
        const { user, profile, supabase } = validation as any;

        // 3. Pricing (+100 Fee)
        const pricing = calculateVtuPrice(planCost, 'cable', (profile.tier as any) || 'smart');
        const finalPrice = pricing.sellingPrice;

        // 4. Check Balance
        if (profile.wallet_balance < finalPrice) {
            return NextResponse.json({ error: 'Insufficient funds' }, { status: 400 });
        }

        // 5. Deduct
        const { error: dedError } = await supabase.from('profiles').update({
            wallet_balance: profile.wallet_balance - finalPrice
        }).eq('id', user.id);

        if (dedError) return NextResponse.json({ error: 'Deduction failed' }, { status: 500 });

        // 6. API Call
        try {
            const transactionRef = `CABLE-${Date.now()}-${user.id.slice(0, 4)}`;
            const apiResponse = await isquare.buyCable({
                cable_id,
                plan_id,
                smartcard,
                phone,
                ref: transactionRef
            });

            await supabase.from('transactions').insert({
                user_id: user.id,
                type: 'cable',
                amount: finalPrice,
                reference: transactionRef,
                status: 'success',
                description: `Cable: ${cable_id} Plan ${plan_id}`,
                metadata: {
                    provider_ref: apiResponse.reference || 'N/A',
                    cost_price: planCost,
                    profit: pricing.profit
                }
            });

            return NextResponse.json({ success: true, message: 'Subscription successful', new_balance: profile.wallet_balance - finalPrice });

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
