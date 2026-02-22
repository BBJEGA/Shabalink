/* eslint-disable @typescript-eslint/no-require-imports */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: ['.env.local', '.env'] });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase URL or Key environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function keepAlive() {
  console.log('Pinging Supabase to keep it alive...');

  try {
    // 1. Direct API call to a table we know exists
    const { data: dbData, error: dbError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (dbError) {
      console.log('Database ping attempt returned an error:', dbError.message);
    } else {
      console.log('Database ping successful. Data received (count):', dbData?.length || 0);
    }

    // 2. Direct call to Auth API
    if (supabase.auth && supabase.auth.admin) {
      const { data: authData, error: authError } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1
      });

      if (authError) {
        console.log('Auth API ping returned an error:', authError.message);
      } else {
        console.log('Auth API ping successful. Users received (count):', authData?.users?.length || 0);
      }
    }
  } catch (err) {
    console.error('Unexpected error during ping:', err);
    process.exit(1);
  }
}

keepAlive();
