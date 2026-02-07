
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Mock Data (Replace with API call or DB fetch)
const NETWORKS = [
    { id: '1', name: 'MTN', color: 'bg-yellow-400' },
    { id: '2', name: 'GLO', color: 'bg-green-600' },
    { id: '3', name: 'AIRTEL', color: 'bg-red-600' },
    { id: '4', name: '9MOBILE', color: 'bg-green-800' },
];

const DATA_TYPES = ['SME', 'Gifting', 'Corporate Gifting'];

const PLANS = {
    '1-SME': [
        { id: '101', name: '500MB', price: 135 },
        { id: '102', name: '1GB', price: 260 },
        { id: '103', name: '2GB', price: 520 },
    ],
    '1-Gifting': [
        { id: '104', name: '1GB', price: 300 },
    ],
    // Add more mappings...
};

export default function BuyDataPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [network, setNetwork] = useState('');
    const [dataType, setDataType] = useState('');
    const [plan, setPlan] = useState<any>(null);
    const [phone, setPhone] = useState('');
    const [pin, setPin] = useState('');
    const [bypass, setBypass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleBuy = async () => {
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/data/buy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    network_id: network,
                    plan_id: plan.id,
                    phone,
                    pin,
                    amount: plan.price,
                    bypass_validation: bypass,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Transaction failed');

            alert('Data Purchase Successful!');
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto min-h-screen bg-gray-50 pb-20 p-4">
            <h1 className="text-xl font-bold text-gray-900 mb-6">Buy Data Bundle</h1>

            {/* Step 1: Network Selection */}
            <div className="bg-white p-6 rounded-2xl shadow-sm mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Network</label>
                <div className="grid grid-cols-2 gap-3">
                    {NETWORKS.map((net) => (
                        <button
                            key={net.id}
                            onClick={() => { setNetwork(net.id); setStep(2); setDataType(''); setPlan(null); }}
                            className={`p-4 rounded-xl text-white font-bold transition-transform active:scale-95 ${net.color} ${network === net.id ? 'ring-4 ring-offset-2 ring-indigo-500' : ''}`}
                        >
                            {net.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Step 2: Data Type */}
            {step >= 2 && (
                <div className="bg-white p-6 rounded-2xl shadow-sm mb-4 animate-in slide-in-from-bottom-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Data Type</label>
                    <select
                        value={dataType}
                        onChange={(e) => { setDataType(e.target.value); setStep(3); }}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                        <option value="">Select Type</option>
                        {DATA_TYPES.map((type) => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </div>
            )}

            {/* Step 3: Plan Selection */}
            {step >= 3 && dataType && (
                <div className="bg-white p-6 rounded-2xl shadow-sm mb-4 animate-in slide-in-from-bottom-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Plan</label>
                    <select
                        onChange={(e) => {
                            const selectedPlan = PLANS[`${network}-${dataType}` as keyof typeof PLANS]?.find(p => p.id === e.target.value);
                            setPlan(selectedPlan);
                            setStep(4);
                        }}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                        <option value="">Choose data plan</option>
                        {PLANS[`${network}-${dataType}` as keyof typeof PLANS]?.map((p) => (
                            <option key={p.id} value={p.id}>{p.name} - ₦{p.price}</option>
                        )) || <option disabled>No plans available</option>}
                    </select>
                </div>
            )}

            {/* Step 4: Phone Number & PIN */}
            {step >= 4 && plan && (
                <div className="bg-white p-6 rounded-2xl shadow-sm mb-4 animate-in slide-in-from-bottom-4">
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="08123456789"
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Transaction PIN</label>
                        <input
                            type="password"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            placeholder="****"
                            maxLength={4}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>

                    <div className="flex items-center gap-2 mb-6">
                        <input
                            type="checkbox"
                            id="bypass"
                            checked={bypass}
                            onChange={(e) => setBypass(e.target.checked)}
                            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                        <label htmlFor="bypass" className="text-sm text-gray-600">Bypass Phone Number Validation</label>
                    </div>

                    {error && <p className="text-red-500 text-sm mb-4 bg-red-50 p-3 rounded-lg">{error}</p>}

                    <button
                        onClick={handleBuy}
                        disabled={loading || !phone || !pin}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Processing...' : `Buy Now (₦${plan.price})`}
                    </button>
                </div>
            )}
        </div>
    );
}
