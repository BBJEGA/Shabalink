
// Helper for ISquareData API

const ISQUARE_API_BASE = 'https://api.isquaredata.com/api/v1'; // Replace with actual base URL if different

interface BuyDataParams {
    network_id: string;
    plan_id: string;
    phone: string;
}

export async function purchaseData({ network_id, plan_id, phone }: BuyDataParams) {
    const apiKey = process.env.ISQUARE_API_KEY;

    if (!apiKey) {
        throw new Error('ISQUARE_API_KEY is not configured');
    }

    // NOTE: This structure depends on the specific ISquareData API documentation.
    // Using a generic structure common to VTU APIs.
    const response = await fetch(`${ISQUARE_API_BASE}/data`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            network: network_id,
            plan: plan_id,
            mobile_number: phone,
            Ported_number: true, // Example param, might need adjustment
        }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to purchase data from provider');
    }

    return data;
}

// Network Mapping (Example)
export const NETWORKS = [
    { id: '1', name: 'MTN', icon: '/mtn.png' },
    { id: '2', name: 'GLO', icon: '/glo.png' },
    { id: '3', name: '9MOBILE', icon: '/9mobile.png' },
    { id: '4', name: 'AIRTEL', icon: '/airtel.png' },
];

export const DATA_TYPES = [
    { id: 'SME', name: 'SME' },
    { id: 'GIFTING', name: 'Gifting' },
    { id: 'CORPORATE', name: 'Corporate Gifting' },
];
