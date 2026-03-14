import 'dotenv/config';

const MONNIFY_API_KEY = process.env.MONNIFY_API_KEY;
const MONNIFY_SECRET = process.env.MONNIFY_SECRET_KEY;
const MONNIFY_URL = process.env.NODE_ENV === 'production'
    ? 'https://api.monnify.com'
    : 'https://sandbox.monnify.com';

async function testMonnifyAuth() {
    console.log('Testing Monnify Auth...');
    console.log('Environment:', process.env.NODE_ENV);
    console.log('URL:', MONNIFY_URL);
    console.log('Key exists:', !!MONNIFY_API_KEY);
    console.log('Secret exists:', !!MONNIFY_SECRET);

    if (!MONNIFY_API_KEY || !MONNIFY_SECRET) {
        console.error('Keys are missing in .env');
        return;
    }

    try {
        const credentials = Buffer.from(`${MONNIFY_API_KEY}:${MONNIFY_SECRET}`).toString('base64');
        console.log('Credentials length:', credentials.length);

        const response = await fetch(`${MONNIFY_URL}/api/v1/auth/login`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`
            }
        });

        const data = await response.json();
        console.log('Auth Response:', JSON.stringify(data, null, 2));

    } catch (e) {
        console.error('Test script error:', e);
    }
}

testMonnifyAuth();
