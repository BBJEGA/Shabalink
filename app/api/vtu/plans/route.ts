
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { isquare } from '@/lib/isquare';
import { calculateVtuPrice, ServiceType, UserTier } from '@/utils/pricing';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as ServiceType;

    if (!['data', 'cable', 'electricity'].includes(type)) {
        return NextResponse.json({ error: 'Invalid service type' }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Get User Tier
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
        const apiType = type === 'cable' ? 'tv' : (type as any);
        const response = await isquare.getVariations(apiType); // NO serviceId restriction
        let rawPlans = Array.isArray(response) ? response : (response.data || response.variations || []);

        let plans = rawPlans;
        if (type === 'cable') {
            const flattened: any[] = [];
            for (const provider of rawPlans) {
                if (provider.plans && Array.isArray(provider.plans)) {
                    for (const p of provider.plans) {
                        flattened.push({
                            ...p,
                            cable_id: String(provider.id),
                            cable_name: provider.name
                        });
                    }
                }
            }
            if (flattened.length > 0) plans = flattened;
        }

        // 3. Apply Pricing Logic
        const pricedPlans = plans.map((plan: Record<string, unknown>) => {
            // Extended Price Mapping
            const cost = Number(
                plan.api_amount ||
                plan.reseller_amount ||
                plan.enduser_amount ||
                plan.variation_amount ||
                plan.amount ||
                plan.price ||
                plan.cost
            ) || 0;

            const pricing = calculateVtuPrice(cost, type, userTier);

            // Ensure we fallback to the raw cost if pricing fails or cost is 0 (to avoid undefined)
            const finalAmount = pricing.sellingPrice || cost;

            return {
                ...plan,
                id: plan.variation_id || plan.id || plan.variation_code,
                name: plan.name || plan.variation_name || plan.description,
                type: plan.type || plan.variation_type, // Pass through type if it exists
                amount: finalAmount, // Ensure this is always set
                original_amount: cost,
                tier_applied: pricing.appliedTier
            };
        });

        // Debug: Log first plan keys to help debug missing fields
        if (pricedPlans.length > 0) {
            const first = pricedPlans[0];
            console.log('[Debug] First Plan Keys:', Object.keys(first));
            console.log('[Debug] First Plan Amount:', first.amount);
        }

        return NextResponse.json({
            success: true,
            data: pricedPlans,
            debug_raw: response
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Failed to fetch plans' }, { status: 500 });
    }
}
