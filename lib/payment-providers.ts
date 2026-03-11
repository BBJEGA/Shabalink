
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
        const nameParts = user.name.split(' ');
        const firstName = nameParts[0] || 'Shabalink';
        const lastName = nameParts.slice(1).join(' ') || 'User';

        const payload = {
            public_key: STROWALLET_API_KEY,
            first_name: firstName,
            last_name: lastName,
            phone: user.phone || '00000000000',
            email: user.email,
            account_name: user.name, // Required by Strowallet
            // Base URL webhook logic or hardcoded string if needed
            webhook_url: process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/strowallet` : "https://shabalink.vercel.app/api/webhooks/strowallet"
        };

        const response = await fetch(`https://strowallet.com/api/virtual-bank/palmpay/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!data.success) {
            // Check for validation errors like data.message.account_name
            const errMsg = typeof data.message === 'object' ? JSON.stringify(data.message) : data.message;
            throw new Error(errMsg || 'Failed to create Strowallet account');
        }

        return {
            success: true,
            account_number: data.account_number,
            account_name: data.account_name,
            bank_name: data.bank_name
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
