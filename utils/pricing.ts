
export type ServiceType = 'airtime' | 'data' | 'electricity' | 'cable';
// 'smart' is the default free tier. 'reseller' and 'partner' are paid tiers.
export type UserTier = 'smart' | 'reseller' | 'partner';

interface PricingResult {
    costPrice: number;
    sellingPrice: number;
    profit: number;
    appliedTier: UserTier;
}

/**
 * Calculates the final selling price based on service type and user tier.
 * 
 * Rules:
 * - Smart (Default): Base Price + ₦50
 * - Reseller: Base Price + ₦20
 * - Partner: Base Price + ₦5
 * 
 * Note: Base Price = Provider Cost.
 */
export function calculateVtuPrice(costPrice: number, type: ServiceType, tier: UserTier = 'smart'): PricingResult {
    const faceValue = Number(costPrice);

    if (type === 'airtime') {
        // Airtime: Selling Price is always the Face Value.
        // User pays 100 for 100 airtime.
        // Profit is the commission/discount from the provider (e.g. 2.5%).
        const commissionRate = 0.025; // 2.5% typical
        const profit = faceValue * commissionRate;
        const shabalinkCost = faceValue - profit;

        return {
            costPrice: Number(shabalinkCost.toFixed(2)),
            sellingPrice: faceValue,
            profit: Number(profit.toFixed(2)),
            appliedTier: tier
        };
    }

    // 1. Determine Markup based on Tier for other services (Data, Bills)
    let markup = 50; // Default (Smart)

    if (tier === 'reseller') {
        markup = 20;
    } else if (tier === 'partner') {
        markup = 5;
    }

    const sellingPrice = faceValue + markup;
    const profit = markup; // For Data/Bills, profit is the fixed markup.

    return {
        costPrice: faceValue,
        sellingPrice: Number(sellingPrice.toFixed(2)),
        profit: Number(profit.toFixed(2)),
        appliedTier: tier
    };
}
