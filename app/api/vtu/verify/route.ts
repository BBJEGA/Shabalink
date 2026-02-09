import { NextResponse } from 'next/server';
import { isquare } from '@/lib/isquare';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { type, ...params } = body;

        if (!type) {
            return NextResponse.json({ error: 'Verification type required' }, { status: 400 });
        }

        let data;
        if (type === 'electricity') {
            // params: { disco_id, meter_number, meter_type }
            data = await isquare.verifyElectricity({
                disco_id: params.disco_id,
                meter_number: params.meter_number,
                meter_type: params.meter_type
            });
        } else if (type === 'cable') {
            // params: { cable_id, smartcard }
            data = await isquare.verifySmartcard({
                cable_id: params.cable_id,
                smartcard: params.smartcard
            });
        } else {
            return NextResponse.json({ error: 'Invalid verification type' }, { status: 400 });
        }

        // ISquare usually returns { name: "Customer Name", ... } or throws error
        return NextResponse.json({ success: true, data });

    } catch (error: any) {
        return NextResponse.json({
            error: error.message || 'Verification failed',
            success: false
        }, { status: 500 });
    }
}
