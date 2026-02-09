
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

    private async request(endpoint: string, method: 'GET' | 'POST', body?: any): Promise<APIResponse> {
        if (!this.apiKey) {
            console.warn('ISQUARE_API_KEY is missing.');
            // We do not throw immediately to allow for potential mock handling if configured elsewhere, 
            // but for this "Strict" version we assume keys are present or it will fail at fetch.
        }

        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            // Standard Auth Construction
            // If Username/Password env vars exist, use Basic Auth
            // Else if API Key exists, try Bearer or Basic with Key
            'Authorization': '',
            'Content-Type': 'application/json',
        };

        if (process.env.ISQUARE_USERNAME && process.env.ISQUARE_PASSWORD) {
            const credentials = Buffer.from(`${process.env.ISQUARE_USERNAME}:${process.env.ISQUARE_PASSWORD}`).toString('base64');
            headers['Authorization'] = `Basic ${credentials}`;
        } else if (process.env.ISQUARE_API_KEY) {
            // Fallback: Some APIs use "Token <key>" or "Bearer <key>"
            // Using Bearer as common standard if no specific info
            headers['Authorization'] = `Bearer ${process.env.ISQUARE_API_KEY}`;
        }

        try {
            const response = await fetch(url, {
                method,
                headers,
                body: body ? JSON.stringify(body) : undefined,
            });

            const data = await response.json();

            if (!response.ok) {
                // Return structured error
                throw new Error(data.message || data.error || `API Error: ${response.status}`);
            }

            return data;
        } catch (error: any) {
            console.error(`ISquare API Error [${endpoint}]:`, error);
            throw new Error(error.message || 'Connection to provider failed');
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

    // --- SERVICES & PLANS ---
    async getServices(type: 'data' | 'cable' | 'electricity') {
        try {
            switch (type) {
                case 'data':
                    return await this.getDataPlans();
                case 'cable':
                    // Fetch Cable Packages
                    return await this.request('/cable/', 'GET');
                case 'electricity':
                    // Fetch Discos
                    return await this.request('/electricity/', 'GET');
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
