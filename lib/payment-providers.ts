
// lib/payment-providers.ts

// --- Configuration ---
const STROWALLET_API_KEY = process.env.STROWALLET_API_KEY; // or Public Key
const STROWALLET_SECRET = process.env.STROWALLET_SECRET_KEY;
const STROWALLET_URL = 'https://strowallet.com/api/v1'; // Example URL

const MONNIFY_API_KEY = process.env.MONNIFY_API_KEY;
const MONNIFY_SECRET = process.env.MONNIFY_SECRET_KEY;
const MONNIFY_CONTRACT_CODE = process.env.MONNIFY_CONTRACT_CODE;
const MONNIFY_URL = process.env.MONNIFY_IS_SANDBOX === 'true' 
    ? 'https://sandbox.monnify.com' 
    : 'https://api.monnify.com';

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

// --- Monnify Helpers ---
async function getMonnifyAccessToken() {
    if (!MONNIFY_API_KEY || !MONNIFY_SECRET) {
        throw new Error("MONNIFY_API_KEY or MONNIFY_SECRET_KEY is missing");
    }

    try {
        const credentials = Buffer.from(`${MONNIFY_API_KEY}:${MONNIFY_SECRET}`).toString('base64');
        const response = await fetch(`${MONNIFY_URL}/api/v1/auth/login`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`
            }
        });

        const data = await response.json();
        if (!data.requestSuccessful) {
            throw new Error(data.responseMessage || 'Monnify Authentication Failed');
        }

        return data.responseBody.accessToken;
    } catch (error: any) {
        console.error('Monnify Auth Error:', error);
        throw error;
    }
}

// --- Monnify Integration (Stage 2 - Post KYC) ---
export async function createMonnifyAccount(user: CreateVirtualAccountParams) {
    if (!MONNIFY_API_KEY || !MONNIFY_CONTRACT_CODE) {
        console.warn("Monnify configuration missing. Using Mock Data.");
        return {
            success: true,
            account_number: '9876543210',
            account_name: `Shabalink - ${user.name}`,
            bank_name: 'Wema Bank (Mock)'
        };
    }

    try {
        const token = await getMonnifyAccessToken();

        const payload = {
            accountReference: `SM-${Date.now()}-${user.email.replace(/[@.]/g, '-')}`,
            accountName: user.name,
            currencyCode: "NGN",
            contractCode: MONNIFY_CONTRACT_CODE,
            customerEmail: user.email,
            customerName: user.name,
            getAllAvailableBanks: true,
            // Use BVN if provided for higher tiers/limits
            bvn: user.bvn
        };

        const response = await fetch(`${MONNIFY_URL}/api/v2/bank-transfer/reserved-accounts`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!data.requestSuccessful) {
            throw new Error(data.responseMessage || 'Failed to create Monnify account');
        }

        // Monnify returns accounts in an array
        const account = data.responseBody.accounts[0];

        return {
            success: true,
            account_number: account.accountNumber,
            account_name: account.accountName,
            bank_name: account.bankName,
            bank_code: account.bankCode,
            reservation_reference: data.responseBody.reservationReference
        };
    } catch (error: any) {
        console.error('Monnify API Error:', error);
        throw new Error(error.message);
    }
}

// --- BVN Verification ---
export async function verifyBVN(bvn: string) {
    // TODO: Connect to a KYC provider (e.g., YouVerify, Dojah, or Monnify's BVN lookup)
    console.log('Verifying BVN:', bvn);
    return { success: true, valid: true, data: { firstName: 'Test', lastName: 'User' } };
}
