
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
    // TODO: Implement actual API call
    console.log('Creating Strowallet account for:', user.email);

    // Mock Response
    return {
        success: true,
        account_number: '1234567890',
        account_name: `Shabalink - ${user.name}`,
        bank_name: 'Palmpay'
    };
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
