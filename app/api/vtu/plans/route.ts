
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { isquare } from '@/lib/isquare';
import { calculateVtuPrice, ServiceType, UserTier } from '@/utils/pricing';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as ServiceType;

    if (!['data', 'cable', 'electricity'].includes(type)) {
        return NextResponse.json({ error: 'Invalid service type' }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Get User Tier
    // We default to 'smart' if not logged in or no profile found
    let userTier: UserTier = 'smart';

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('tier')
            .eq('id', user.id)
            .single();

        if (profile?.tier) {
            userTier = profile.tier as UserTier;
        }
    }

    try {
        // 2. Fetch Base Plans from Provider
        const plans = (await isquare.getServices(type as any)) as any[];

        // 3. Apply Pricing Logic
        const pricedPlans = plans.map(plan => {
            // Basic amount check. Some APIs return string, some number.
            const cost = Number(plan.amount) || 0;
            if (cost === 0) return plan; // No price to calculate (e.g. valid-only check)

            const pricing = calculateVtuPrice(cost, type, userTier);

            return {
                ...plan,
                amount: pricing.sellingPrice,
                original_amount: pricing.costPrice, // Optional: for debugging or strikethrough
                tier_applied: pricing.appliedTier
            };
        });

        return NextResponse.json({ success: true, data: pricedPlans });

    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Failed to fetch plans' }, { status: 500 });
    }
}
