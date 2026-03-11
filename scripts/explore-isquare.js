const fs = require('fs');

async function testLegacyVariations() {
    const username = '07035659663';
    const password = '1Ba2sha3r@';
    const credentials = Buffer.from(`${username}:${password}`).toString('base64');
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`
    };

    const endpoints = [
        '/api/network/',
        '/api/v2/variations/data',
        '/api/data/network/',
        '/api/data_network/',
        '/api/data',
    ];

    for (const ep of endpoints) {
        console.log(`\nTesting ${ep}...`);
        try {
            const res = await fetch(`https://isquaredata.com${ep}`, { headers });
            if (res.ok) {
                const text = await res.text();
                console.log(`SUCCESS ${ep}: ${text.substring(0, 500)}`);
            } else {
                console.log(`FAILED ${ep} Status: ${res.status}`);
            }
        } catch (e) {
            console.log(`ERROR ${ep}: ${e.message}`);
        }
    }
}

testLegacyVariations();
