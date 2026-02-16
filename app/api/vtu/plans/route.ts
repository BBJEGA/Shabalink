
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { isquare } from '@/lib/isquare';
import { calculateVtuPrice, ServiceType, UserTier } from '@/utils/pricing';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as ServiceType;
    const serviceId = searchParams.get('service_id');

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
        // 2. Fetch Base Plans from Provider V2 Variations
        const apiType = type === 'cable' ? 'tv' : (type as any);
        const response = await isquare.getVariations(apiType, serviceId || undefined);
        const plans = Array.isArray(response) ? response : (response.data || response.variations || []);

        // 3. Filter Plans (if API returned all)
        // If type is data, we expect serviceId (network_id) to match
        let distinctPlans = plans;
        if (type === 'data' && serviceId) {
            // Try to filter by network if the field exists
            const filtered = plans.filter((p: any) =>
                String(p.network || p.network_id || p.service_id) === String(serviceId)
            );
            if (filtered.length > 0) {
                distinctPlans = filtered;
            }
        }

        // 3. Apply Pricing Logic
        const pricedPlans = distinctPlans.map((plan: Record<string, unknown>) => {
            // Extended Price Mapping
            const cost = Number(
                plan.variation_amount ||
                plan.amount ||
                plan.price ||
                plan.cost ||
                plan.rate
            ) || 0;

            if (cost === 0) return plan; // Or skip?

            const pricing = calculateVtuPrice(cost, type, userTier);

            return {
                ...plan,
                id: plan.variation_id || plan.id || plan.variation_code,
                name: plan.name || plan.variation_name || plan.description,
                amount: pricing.sellingPrice,
                original_amount: pricing.costPrice,
                tier_applied: pricing.appliedTier
            };
        });

        // Debug: Log first plan to help user if price is still missing
        if (pricedPlans.length > 0) {
            console.log('[Debug] First Plan:', JSON.stringify(pricedPlans[0]));
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
