const fs = require('fs');

async function dumpApi() {
    const url = 'https://isquaredata.com/api/data/plans/';
    const username = '07035659663';
    const password = '1Ba2sha3r@';

    const credentials = Buffer.from(`${username}:${password}`).toString('base64');

    try {
        const res = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${credentials}`
            }
        });
        const text = await res.text();
        fs.writeFileSync('isquare_dump.json', text);
        console.log("Dumped to isquare_dump.json");
    } catch (e) {
        console.error("Fetch Error:", e.message);
    }
}

dumpApi();
