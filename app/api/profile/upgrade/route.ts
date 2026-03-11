
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createMonnifyAccount, verifyBVN } from '@/lib/payment-providers';

export async function POST(request: Request) {
    const supabase = await createClient();

    // 1. Get User Session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { bvn } = body;

    if (!bvn) {
        return NextResponse.json({ error: 'BVN is required for Tier 2 upgrade' }, { status: 400 });
    }

    try {
        // 2. Fetch current profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profileError || !profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        if (profile.tier === 'level_2') {
            return NextResponse.json({ error: 'Already upgraded to Tier 2' }, { status: 400 });
        }

        // 3. Verify BVN (Mock/External Provider)
        const vResult = await verifyBVN(bvn);
        if (!vResult.success) {
            return NextResponse.json({ error: 'BVN verification failed' }, { status: 400 });
        }

        // 4. Create Monnify Account
        const monnifyResult = await createMonnifyAccount({
            email: user.email!,
            name: profile.full_name || 'Shabalink User',
            bvn: bvn
        });

        if (!monnifyResult.success) {
            return NextResponse.json({ error: 'Failed to generate Monnify account' }, { status: 500 });
        }

        // 5. Update Profile
        // We store the first Monnify account as the primary for Tier 2
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                tier: 'level_2',
                bvn: bvn,
                account_number: monnifyResult.account_number,
                bank_name: monnifyResult.bank_name,
                // We could also store both Strowallet and Monnify in a 'payment_accounts' table if we wanted to scale
            })
            .eq('id', user.id);

        if (updateError) {
            console.error('Update Error:', updateError);
            return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Successfully upgraded to Tier 2',
            account: {
                account_number: monnifyResult.account_number,
                bank_name: monnifyResult.bank_name
            }
        });

    } catch (error: any) {
        console.error('Upgrade Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
