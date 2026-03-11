require('dotenv').config({ path: '.env.local' });

async function testStrowalletPalmpay() {
    const pubKey = process.env.STROWALLET_API_KEY;

    const payload = {
        public_key: pubKey,
        first_name: "Palm",
        last_name: "Test",
        phone: "08123456789",
        email: `palmpay.test.${Date.now()}@shabalink.com`,
        account_name: "Palm Test",
        webhook_url: "https://shabalink.vercel.app/api/webhooks/strowallet"
    };

    console.log(`\nTesting POST https://strowallet.com/api/virtual-bank/palmpay/ ...`);
    try {
        const res = await fetch(`https://strowallet.com/api/virtual-bank/palmpay/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const text = await res.text();
        console.log(`Status: ${res.status}`);
        console.log(`Response: ${text.substring(0, 500)}`);

    } catch (e) {
        console.log(`ERROR: ${e.message}`);
    }
}

testStrowalletPalmpay();
