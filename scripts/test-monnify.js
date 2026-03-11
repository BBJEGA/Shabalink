
require('dotenv').config({ path: ['.env.local', '.env'] });

const MONNIFY_API_KEY = process.env.MONNIFY_API_KEY;
const MONNIFY_SECRET = process.env.MONNIFY_SECRET_KEY;
const MONNIFY_CONTRACT_CODE = process.env.MONNIFY_CONTRACT_CODE;
const MONNIFY_URL = process.env.NODE_ENV === 'production'
    ? 'https://api.monnify.com'
    : 'https://sandbox.monnify.com';

async function testMonnifyAuth() {
    console.log("--- MONNIFY AUTHENTICATION TEST ---");
    console.log(`Using URL: ${MONNIFY_URL}`);

    if (!MONNIFY_API_KEY || !MONNIFY_SECRET) {
        console.error("❌ Missing Monnify Credentials in .env.local");
        return;
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
        if (data.requestSuccessful) {
            console.log("✅ Authentication Successful!");
            console.log("Access Token Obtained (First 10 chars):", data.responseBody.accessToken.substring(0, 10) + "...");

            // Test Account Creation (Mock User)
            await testCreateAccount(data.responseBody.accessToken);
        } else {
            console.error("❌ Authentication Failed:", data.responseMessage);
        }
    } catch (error) {
        console.error("❌ Exception during Auth:", error.message);
    }
}

async function testCreateAccount(token) {
    console.log("\n--- MONNIFY ACCOUNT RESERVATION TEST ---");

    if (!MONNIFY_CONTRACT_CODE) {
        console.error("❌ Missing MONNIFY_CONTRACT_CODE");
        return;
    }

    const payload = {
        accountReference: `TEST-${Date.now()}`,
        accountName: "Test Shabalink User",
        currencyCode: "NGN",
        contractCode: MONNIFY_CONTRACT_CODE,
        customerEmail: "test@shabalink.com",
        customerName: "Test User",
        getAllAvailableBanks: true
    };

    try {
        const response = await fetch(`${MONNIFY_URL}/api/v2/bank-transfer/reserved-accounts`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (data.requestSuccessful) {
            console.log("✅ Account Reserved Successfully!");
            console.log("Bank Accounts:", data.responseBody.accounts.map(a => `${a.bankName}: ${a.accountNumber}`).join(", "));
        } else {
            console.error("❌ Account Reservation Failed:", data.responseMessage);
            console.log("Full Error Response:", JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error("❌ Exception during Reservation:", error.message);
    }
}

testMonnifyAuth();
