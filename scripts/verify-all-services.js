require('dotenv').config({ path: ['.env.local', '.env'] });

// Mocking fetch to capture the payload
const originalFetch = global.fetch;
let lastRequest = null;

global.fetch = async (url, options) => {
    lastRequest = { url, options };
    return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ status: "success", message: "Mock Success" }),
        json: async () => ({ status: "success", message: "Mock Success" })
    };
};

// Local implementation of payload shaping for verification
const shaping = {
    buyData: (params) => ({
        network: Number(params.network_id),
        plan: Number(params.plan_id),
        mobile_number: params.phone,
        reference: params.ref,
        Ported_number: true
    }),
    buyAirtime: (params) => ({
        network: params.network_id,
        amount: params.amount,
        phone_number: params.phone,
        reference: params.ref,
        disable_validation: false
    }),
    buyCable: (params) => ({
        cable_id: Number(params.cable_id),
        plan_id: Number(params.plan_id),
        smartcard_number: params.smartcard,
        phone_number: params.phone,
        reference: params.ref
    }),
    payElectricity: (params) => ({
        service_id: params.disco_id,
        meter_number: params.meter_number,
        amount: params.amount,
        phone_number: params.phone,
        reference: params.ref
    })
};

async function verifyAll() {
    console.log("--- DIAGNOSTIC PAYLOAD VERIFICATION ---");

    // 1. DATA (MTN SME)
    const dataPayload = shaping.buyData({
        network_id: "6",
        plan_id: "105",
        phone: "08012345678",
        ref: "TEST-DATA-1"
    });
    console.log("\n[DATA] Payload Shape:");
    console.log(JSON.stringify(dataPayload, null, 2));

    // 2. AIRTIME
    const airtimePayload = shaping.buyAirtime({
        network_id: "1",
        amount: 100,
        phone: "08012345678",
        ref: "TEST-AIR-1"
    });
    console.log("\n[AIRTIME] Payload Shape:");
    console.log(JSON.stringify(airtimePayload, null, 2));

    // 3. CABLE
    const cablePayload = shaping.buyCable({
        cable_id: "1",
        plan_id: "10",
        smartcard: "1234567890",
        phone: "08012345678",
        ref: "TEST-CABLE-1"
    });
    console.log("\n[CABLE] Payload Shape:");
    console.log(JSON.stringify(cablePayload, null, 2));

    // 4. ELECTRICITY
    const elecPayload = shaping.payElectricity({
        disco_id: "1",
        meter_number: "44012345678",
        amount: 2000,
        phone: "08012345678",
        ref: "TEST-ELEC-1"
    });
    console.log("\n[ELECTRICITY] Payload Shape:");
    console.log(JSON.stringify(elecPayload, null, 2));
}

verifyAll().catch(console.error);
