require('dotenv').config({ path: '.env.local' });

async function debugEndpoints() {
    console.log('Starting debug script...');

    const headers = {
        'Content-Type': 'application/json',
    };

    if (process.env.ISQUARE_API_KEY) {
        headers['Authorization'] = `Bearer ${process.env.ISQUARE_API_KEY}`;
    } else if (process.env.ISQUARE_USERNAME && process.env.ISQUARE_PASSWORD) {
        const credentials = Buffer.from(`${process.env.ISQUARE_USERNAME}:${process.env.ISQUARE_PASSWORD}`).toString('base64');
        headers['Authorization'] = `Basic ${credentials}`;
        console.log('Using Basic Auth');
    } else {
        console.warn('No credentials found in .env.local');
    }

    const fetchEndpoint = async (url) => {
        const fullUrl = `https://isquaredata.com/api${url}`;
        console.log(`\n\n--- Fetching ${fullUrl} ---`);
        try {
            const res = await fetch(fullUrl, { headers });
            const text = await res.text();
            console.log(`Status: ${res.status}`);
            try {
                const json = JSON.parse(text);
                if (Array.isArray(json)) {
                    console.log('Is Array. First item:', JSON.stringify(json[0], null, 2));
                    console.log(`Total items: ${json.length}`);
                } else if (json.data && Array.isArray(json.data)) {
                    console.log('Is Object with data array. First item:', JSON.stringify(json.data[0], null, 2));
                    console.log(`Total items: ${json.data.length}`);
                } else {
                    console.log('Response:', JSON.stringify(json, null, 2).substring(0, 1000));
                }
            } catch (e) {
                console.log('Response (Non-JSON or parse error):', text.substring(0, 1000));
            }
        } catch (e) {
            console.error('Fetch Error:', e.message);
        }
    };

    // Test Data Plans
    await fetchEndpoint('/data/plans/');

    // Test Cable Services
    await fetchEndpoint('/cable/services/');
    // Try variations?
    await fetchEndpoint('/cable/');

    // Test Electricity
    await fetchEndpoint('/electricity/services/');
}

debugEndpoints();
