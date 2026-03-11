const fs = require('fs');

async function testCableDeductions() {
    const username = '07035659663';
    const password = '1Ba2sha3r@';
    const credentials = Buffer.from(`${username}:${password}`).toString('base64');
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`
    };

    const endpoints = [
        '/api/cable-tv/',
        '/api/cable-tv/plans/',
        '/api/cabletv-plans/',
        '/api/tv-subscription/',
        '/api/cable_plans/',
        '/api/data/cable/',
        '/api/variations/cable/',
        '/api/cable_tv/',
        '/api/cable/cables/',
        '/api/cable/providers/',
        '/api/cable/bouquets/',
        '/api/cable/plans/',
        '/api/tv/bouquets/'
    ];

    for (const ep of endpoints) {
        console.log(`\nTesting ${ep}...`);
        try {
            const res = await fetch(`https://isquaredata.com${ep}`, { headers });
            if (res.ok) {
                const text = await res.text();
                console.log(`SUCCESS ${ep}: ${text.substring(0, 300)}...`);
                fs.writeFileSync('isquare_cable_dump.json', text);
                return; // Stop if we find it
            } else {
                console.log(`FAILED ${ep} Status: ${res.status}`);
            }
        } catch (e) {
            console.log(`ERROR ${ep}: ${e.message}`);
        }
    }
}

testCableDeductions();
