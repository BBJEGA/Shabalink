
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { UserTier } from '@/utils/pricing';

export async function POST(request: Request) {
    const body = await request.json();
    const { target_tier } = body; // 'reseller' or 'partner'

    if (!['reseller', 'partner'].includes(target_tier)) {
        return NextResponse.json({ error: 'Invalid tier selection' }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Get User & Profile
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

    // 2. Determine Upgrade Fee
    let fee = 0;
    if (target_tier === 'reseller') fee = 2500;
    if (target_tier === 'partner') fee = 10000;

    // 3. Validation
    if (profile.tier === target_tier) {
        return NextResponse.json({ error: 'You are already on this plan' }, { status: 400 });
    }
    // Prevent downgrade for now? Or allow? Assuming Upgrades only for MVP logic or just charge clean fee.
    // User request: "When a user pays the upgrade fee, automatically update this field"

    if (profile.wallet_balance < fee) {
        return NextResponse.json({ error: `Insufficient funds. You need ₦${fee.toLocaleString()}` }, { status: 400 });
    }

    // 4. Process Payment & Upgrade
    // Transaction: Deduct Balance
    const { error: updateError } = await supabase.from('profiles').update({
        wallet_balance: profile.wallet_balance - fee,
        tier: target_tier
    }).eq('id', user.id);

    if (updateError) {
        return NextResponse.json({ error: 'Upgrade failed' }, { status: 500 });
    }

    // 5. Log Transaction
    await supabase.from('transactions').insert({
        user_id: user.id,
        type: 'upgrade',
        amount: fee,
        reference: `UPG-${Date.now()}-${user.id.slice(0, 4)}`,
        status: 'success',
        description: `Upgrade to ${target_tier.toUpperCase()} Plan`
    });

    return NextResponse.json({
        success: true,
        message: `Successfully upgraded to ${target_tier}`,
        tier: target_tier
    });
}
