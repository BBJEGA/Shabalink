
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
            const { NETWORKS } = require('@/lib/isquare');
            const networkName = NETWORKS.find((n: any) => n.id === serviceId)?.name?.toUpperCase();

            // Filter logic:
            // 1. Strict ID match (if field exists)
            // 2. Fuzzy Name match (if plan name contains 'MTN', etc)
            const filtered = plans.filter((p: any) => {
                const pNetworkId = String(p.network || p.network_id || p.service_id || '');
                const pName = String(p.name || p.variation_name || '').toUpperCase();

                const idMatch = pNetworkId === String(serviceId);
                const nameMatch = networkName ? pName.includes(networkName) : false;

                // If the plan has a explicit network ID, trust it.
                // If not, rely on name match.
                return pNetworkId ? idMatch : nameMatch;
            });

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
                plan.price ||
                plan.cost ||
                plan.rate ||
                plan.api_price
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
