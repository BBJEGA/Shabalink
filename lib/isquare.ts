
// Helper for ISquareData API
// Documentation Patterns Inferred:
// Airtime: POST /airtime/buy/
// Data: POST /data/buy/
// Cable: POST /cable/buy/
// Electricity: POST /electricity/buy/

const ISQUARE_API_BASE = 'https://isquaredata.com/api';

interface APIResponse {
    status: string | boolean;
    message?: string;
    [key: string]: any;
}

export class ISquareClient {
    private apiKey: string;
    private baseUrl: string;

    constructor() {
        // Use environment variable or fallback for safety (though usage requires env var)
        this.apiKey = process.env.ISQUARE_API_KEY || '';
        this.baseUrl = ISQUARE_API_BASE;
    }

    private async request(endpoint: string, method: 'GET' | 'POST', body?: Record<string, unknown>): Promise<APIResponse> {
        const url = `${this.baseUrl}${endpoint}`;
        console.log(`[ISquare] Requesting: ${method} ${url}`); // User-visible log for debugging
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        // 1. API Key / Secret Key Custom Headers (Preferred)
        if (process.env.ISQUARE_API_KEY) {
            headers['api-key'] = process.env.ISQUARE_API_KEY;
        }
        if (process.env.ISQUARE_SECRET_KEY) {
            headers['secret-key'] = process.env.ISQUARE_SECRET_KEY;
        }

        // 2. Authorization Header Strategy
        if (!headers['api-key']) {
            if (process.env.ISQUARE_API_KEY) {
                // Bearer Fallback
                headers['Authorization'] = `Bearer ${process.env.ISQUARE_API_KEY}`;
            } else if (process.env.ISQUARE_USERNAME && process.env.ISQUARE_PASSWORD) {
                // Basic Auth Fallback (User provided valid credentials)
                const credentials = Buffer.from(`${process.env.ISQUARE_USERNAME}:${process.env.ISQUARE_PASSWORD}`).toString('base64');
                headers['Authorization'] = `Basic ${credentials}`;
            } else {
                console.warn("Missing ISQUARE credentials (API_KEY or USERNAME/PASSWORD)");
            }
        }

        try {
            const response = await fetch(url, {
                method,
                headers,
                body: body ? JSON.stringify(body) : undefined,
            });

            const text = await response.text();
            let data: any;

            try {
                data = JSON.parse(text);
            } catch {
                // If JSON parse fails, it's likely HTML (Error Page)
                console.error(`ISquare API returned non-JSON [${endpoint}]:`, text.substring(0, 200)); // Log first 200 chars
                throw new Error(`API Error: Received invalid response from provider (Status ${response.status})`);
            }

            if (!response.ok) {
                console.error(`ISquare API Error [${endpoint}] Status ${response.status}:`, data);
                throw new Error(data.message || data.error || `API Error: ${response.status}`);
            }

            return data;
        } catch (error: any) {
            const errorMessage = error instanceof Error ? error.message : 'Connection to provider failed';
            console.error(`ISquare API Exception [${endpoint}]:`, error);
            throw new Error(errorMessage);
        }
    }

    // --- PRICING LOGIC ---
    // Global Markup: +50 Naira (Legacy helper, now handled by pricing module but kept for ref)
    public applyMarkup(costPrice: number): number {
        return Number(costPrice) + 50;
    }

    // --- AIRTIME ---
    async buyAirtime(params: { network_id: string; amount: number; phone: string; ref: string }) {
        // Endpoint: /airtime/buy/
        return this.request('/airtime/buy/', 'POST', {
            network: params.network_id,
            amount: params.amount,
            phone_number: params.phone,
            reference: params.ref,
            disable_validation: false
        });
    }

    // --- DATA ---
    async buyData(params: { network_id: string; plan_id: string; phone: string; ref: string }) {
        // Endpoint: /data/buy/
        return this.request('/data/buy/', 'POST', {
            network: params.network_id,
            plan: params.plan_id,
            mobile_number: params.phone,
            reference: params.ref,
            Ported_number: true
        });
    }

    async getDataPlans() {
        // Endpoint: /data/ (Confirmed list endpoint)
        return await this.request('/data/', 'GET');
    }

    // --- V2 VARIATIONS & SYNC ---
    async getVariations(type: 'data' | 'tv' | 'electricity', serviceId?: string) {
        // Final Fix: Validated Endpoints based on documentation search
        let endpoint = '';

        switch (type) {
            case 'data':
                // Verified: /data/plans/
                endpoint = '/data/plans/';
                break;
            case 'tv':
                // User reported /cable/services/ failed.
                // Trying base /cable/ which often lists categories/plans in REST APIs
                endpoint = '/cable/';
                break;
            case 'electricity':
                // Verified: /electricity/services/
                endpoint = '/electricity/services/';
                break;
            default:
                throw new Error(`Unknown variation type: ${type}`);
        }

        if (serviceId) {
            if (type === 'data') {
                // params: ?network=1
                endpoint += `?network=${serviceId}`;
            } else if (type === 'electricity') {
                // electricity often doesn't filter by param on the services list, 
                // but let's keep it if the API ignores it.
                // Actually, usually /electricity/services/ returns all providers.
            }
        }

        return this.request(endpoint, 'GET');
    }

    async verifyCustomer(params: { service_id: string; customer_id: string; type: 'tv' | 'electricity' }) {
        return this.request('/v2/verify-customer/', 'POST', {
            service_id: params.service_id,
            customer_id: params.customer_id,
            type: params.type
        });
    }

    // --- SERVICES & PLANS (LEGACY/FALLBACK) ---
    async getServices(type: 'data' | 'cable' | 'electricity'): Promise<any> {
        try {
            switch (type) {
                case 'data':
                    return await this.request('/v2/variations/data', 'GET');
                case 'cable':
                    return await this.request('/v2/variations/tv', 'GET');
                case 'electricity':
                    return await this.request('/v2/variations/electricity', 'GET');
                default:
                    return [];
            }
        } catch (error) {
            console.error(`Failed to fetch ${type} services from API.`, error);
            throw error;
        }
    }

    // --- ELECTRICITY ---
    async verifyElectricity(params: { disco_id: string; meter_number: string; meter_type: string }) {
        return this.request('/electricity/verify/', 'POST', {
            service_id: params.disco_id,
            meter_number: params.meter_number,
            meter_type: params.meter_type
        });
    }

    async payElectricity(params: { disco_id: string; meter_number: string; amount: number; phone: string; ref: string }) {
        return this.request('/electricity/buy/', 'POST', {
            service_id: params.disco_id,
            meter_number: params.meter_number,
            amount: params.amount,
            phone_number: params.phone,
            reference: params.ref
        });
    }

    // --- CABLE TV ---
    async verifySmartcard(params: { cable_id: string; smartcard: string }) {
        return this.request('/cable/verify/', 'POST', { // Standardized endpoint
            cable_id: params.cable_id,
            smartcard_number: params.smartcard, // Common param name
            smartcard: params.smartcard, // Fallback common param name
            service_id: params.cable_id // Fallback
        });
    }

    async buyCable(params: { cable_id: string; plan_id: string; smartcard: string; phone: string; ref: string }) {
        return this.request('/cable/buy/', 'POST', {
            cable_id: params.cable_id,
            plan_id: params.plan_id,
            smartcard: params.smartcard,
            phone_number: params.phone,
            reference: params.ref
        });
    }
}

// Instantiate singleton
export const isquare = new ISquareClient();

// Constants
export const NETWORKS = [
    { id: '1', name: 'MTN', icon: '/mtn.png' },
    { id: '2', name: 'GLO', icon: '/glo.png' },
    { id: '3', name: '9MOBILE', icon: '/9mobile.png' },
    { id: '4', name: 'AIRTEL', icon: '/airtel.png' },
];
