
// lib/payment-providers.ts

// --- Configuration ---
const STROWALLET_API_KEY = process.env.STROWALLET_API_KEY; // or Public Key
const STROWALLET_SECRET = process.env.STROWALLET_SECRET_KEY;
const STROWALLET_URL = 'https://strowallet.com/api/v1'; // Example URL

const MONNIFY_API_KEY = process.env.MONNIFY_API_KEY;
const MONNIFY_SECRET = process.env.MONNIFY_SECRET_KEY;
const MONNIFY_CONTRACT_CODE = process.env.MONNIFY_CONTRACT_CODE;
const MONNIFY_URL = process.env.NODE_ENV === 'production'
    ? 'https://api.monnify.com'
    : 'https://sandbox.monnify.com';

// --- Types ---
interface CreateVirtualAccountParams {
    email: string;
    name: string;
    phone?: string;
    bvn?: string; // Required for Tier 2/Monnify
}

// --- Strowallet Integration (Stage 1) ---
export async function createStrowalletAccount(user: CreateVirtualAccountParams) {
    if (!STROWALLET_API_KEY) {
        console.warn("STROWALLET_API_KEY is missing. Using Mock Data.");
        return {
            success: true,
            account_number: '1234567890',
            account_name: `Shabalink - ${user.name}`,
            bank_name: 'Palmpay (Mock)'
        };
    }

    try {
        // 1. Create a user/wallet on Strowallet
        // Note: Endpoint and payload structure should be verified with Strowallet docs
        const response = await fetch(`${STROWALLET_URL}/create-account`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${STROWALLET_API_KEY}` // or whatever auth scheme they use
            },
            body: JSON.stringify({
                customer_name: user.name,
                customer_email: user.email,
                customer_phone: user.phone || '',
                nin: '', // Optional/Required depending on provider
                bvn: ''  // Not needed for Tier 1 usually
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to create Strowallet account');
        }

        return {
            success: true,
            account_number: data.account_number,
            account_name: data.account_name,
            bank_name: data.bank_name || 'Palmpay'
        };
    } catch (error: any) {
        console.error('Strowallet API Error:', error);
        throw new Error(error.message);
    }
}

// --- Monnify Integration (Stage 2 - Post KYC) ---
export async function createMonnifyAccount(user: CreateVirtualAccountParams) {
    // TODO: Implement actual API call
    // 1. Authenticate (Get Bearer Token)
    // 2. Call Create Account endpoint
    console.log('Creating Monnify account for:', user.email);

    // Mock Response
    return {
        success: true,
        account_number: '9876543210',
        account_name: `Shabalink - ${user.name}`,
        bank_name: 'Wema Bank'
    };
}

// --- BVN Verification ---
export async function verifyBVN(bvn: string) {
    // TODO: Connect to a KYC provider (e.g., YouVerify, Dojah, or Monnify's BVN lookup)
    console.log('Verifying BVN:', bvn);
    return { success: true, valid: true, data: { firstName: 'Test', lastName: 'User' } };
}
