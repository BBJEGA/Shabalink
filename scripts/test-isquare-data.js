require('dotenv').config({ path: ['.env.local', '.env'] });
// Native fetch available in Node 18+

const ISQUARE_API_BASE = 'https://isquaredata.com/api';
const username = process.env.ISQUARE_USERNAME;
const password = process.env.ISQUARE_PASSWORD;

async function testBuyData() {
    if (!username || !password) {
        console.error("Missing ISQUARE credentials");
        return;
    }

    const credentials = Buffer.from(`${username}:${password}`).toString('base64');
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`
    };

    // Test with a sample plan ID from the dump (e.g. MTN 1GB = ID 2)
    // Using a fake but valid-format phone number
    const payload = {
        network: 1,      // MTN
        plan: 2,         // 1GB
        mobile_number: "08012345678",
        reference: `TEST-${Date.now()}`,
        Ported_number: true
    };

    console.log("Testing buyData with payload:", payload);

    try {
        const response = await fetch(`${ISQUARE_API_BASE}/data/buy/`, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });

        const status = response.status;
        const text = await response.text();
        console.log(`Status: ${status}`);
        console.log("Response Body:", text);

    } catch (error) {
        console.error("Test Request Failed:", error);
    }
}

testBuyData();
