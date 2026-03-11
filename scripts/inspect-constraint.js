require('dotenv').config({ path: ['.env.local', '.env'] });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
// We only need to read the constraints, so Anon key works
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectConstraint() {
    console.log('Querying Postgres to read the check_tier_values constraint...');

    // Since we don't have direct access to postgres system tables via the standard client without RPC,
    // let's just attempt different values to brute-force the answer or pull a row.
    const values = ['level_1', 'level 1', 'Level 1', 'Tier 1', 'tier_1', '1', 'basic'];

    for (let testVal of values) {
        console.log(`Testing constraint with tier = '${testVal}'...`);
        const { error } = await supabase
            .from('profiles')
            .insert([{
                id: '00000000-0000-0000-0000-000000000001',
                email: 'constraint@test.com',
                full_name: 'test',
                wallet_balance: 0,
                tier: testVal
            }]);

        if (error && error.message.includes('violates check constraint')) {
            console.log(`❌ '${testVal}' failed check constraint.`);
        } else if (error && error.message.includes('violates row-level security')) {
            console.log(`✅ '${testVal}' passed check constraint (failed on RLS, which means schema accepted it).`);
            break;
        } else if (error) {
            console.log(`⚠️ '${testVal}' failed with other error:`, error.message);
            // Even if it fails foreign key, it passed check constraint
            if (error.message.includes('foreign key constraint')) {
                console.log(`✅ '${testVal}' passed check constraint.`);
                break;
            }
        } else {
            console.log(`✅ '${testVal}' Success!`);
            break;
        }
    }
}

inspectConstraint();
