const fs = require('fs');

async function dumpOtherServices() {
    const username = '07035659663';
    const password = '1Ba2sha3r@';
    const credentials = Buffer.from(`${username}:${password}`).toString('base64');
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`
    };

    const endpoints = [
        { name: 'cable', url: '/api/cable/' },
        { name: 'cable_plans', url: '/api/cable/plans/' }, // testing variants
        { name: 'electricity', url: '/api/electricity/services/' },
        { name: 'electricity_alt', url: '/api/electricity/' }
    ];

    for (const ep of endpoints) {
        console.log(`\nTesting ${ep.url}...`);
        try {
            const res = await fetch(`https://isquaredata.com${ep.url}`, { headers });
            if (res.ok) {
                const text = await res.text();
                fs.writeFileSync(`isquare_${ep.name}_dump.json`, text);
                console.log(`SUCCESS: Dumped to isquare_${ep.name}_dump.json (Length: ${text.length})`);
            } else {
                console.log(`FAILED: Status ${res.status}`);
            }
        } catch (e) {
            console.log(`ERROR: ${e.message}`);
        }
    }
}

dumpOtherServices();
