const fs = require('fs');

function analyzePayload() {
    const raw = fs.readFileSync('isquare_dump.json', 'utf8');
    const plans = JSON.parse(raw);

    const categories = {};

    plans.forEach(plan => {
        if (!categories[plan.network]) {
            categories[plan.network] = [];
        }
        categories[plan.network].push(`${plan.name} (ID: ${plan.id}, API: ${plan.api_amount})`);
    });

    for (const [netId, netPlans] of Object.entries(categories)) {
        console.log(`\nNetwork ID: ${netId}`);
        for (let i = 0; i < Math.min(3, netPlans.length); i++) {
            console.log(`  - ${netPlans[i]}`);
        }
        console.log(`  ... (${netPlans.length} plans total)`);
    }
}

analyzePayload();
