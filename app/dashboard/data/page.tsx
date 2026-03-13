
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardHeader from '../../components/DashboardHeader';
import { NETWORKS } from '@/lib/isquare';
import { Check, ChevronRight, Loader2, Phone, ShieldCheck, Signal, Wallet, Globe } from 'lucide-react';

export default function BuyDataPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [fetchingPlans, setFetchingPlans] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Data Structure: 
    // groupedPlans keys = "MTN SME", "GLO CORPORATE", etc.
    // values = Array of plans
    const [groupedPlans, setGroupedPlans] = useState<Record<string, any[]>>({});
    const [productTypes, setProductTypes] = useState<string[]>([]);

    // Selection State
    const [selectedProduct, setSelectedProduct] = useState(''); // e.g. "MTN SME"
    const [selectedPlanId, setSelectedPlanId] = useState('');

    // Form Data for Submission
    const [formData, setFormData] = useState({
        network_id: '', // Derived from selectedProduct
        plan_id: '',
        phone: '',
        pin: '',
        amount: 0
    });

    // Category Mapper for ISquare's 18 internal grouped IDs
    const getNetworkCategoryName = (plan: any) => {
        const netId = String(plan.network || '');
        const pName = (plan.name || '').toUpperCase();

        const map: Record<string, string> = {
            '1': 'MTN DATASHARE',
            '2': 'MTN NORMAL DATA',
            '3': 'AIRTEL NORMAL DATA',
            '4': 'MTN CORPORATE DATA',
            '5': '9MOBILE NORMAL DATA',
            '6': 'GLO SME',
            '7': '9MOBILE SME',
            '8': 'MTN AWOOF DATA',
            '9': 'GLO NORMAL DATA',
            '10': 'GLO CORPORATE DATA',
            '11': 'GLO CORPORATE DATA',
            '12': 'MTN NORMAL DATA',
            '15': 'MTN DATA TRANSFER',
            '16': 'AIRTEL AWOOF(LOAN-SENSITIVE)',
            '17': 'MTN SME',
            '18': 'MTN DATA TRANSFER',
        };

        let category = map[netId];

        // Fallback robust mapping if ISquare adds new IDs
        if (!category) {
            let base = 'NORMAL DATA';
            if (pName.includes('SME')) base = 'SME';
            if (pName.includes('CORPORATE') || pName.includes('CORP')) base = 'CORPORATE DATA';
            if (pName.includes('AWOOF')) base = 'AWOOF DATA';
            if (pName.includes('SHARE')) base = 'DATASHARE';
            if (pName.includes('TRANSFER')) base = 'DATA TRANSFER';

            let provider = 'UNKNOWN';
            if (pName.includes('MTN') || pName.includes('THRYVE') || pName.includes('PULSE')) provider = 'MTN';
            else if (pName.includes('GLO')) provider = 'GLO';
            else if (pName.includes('AIRTEL') || pName.includes('BINGE')) provider = 'AIRTEL';
            else if (pName.includes('9MOBILE')) provider = '9MOBILE';

            category = `${provider} ${base}`;
        }

        return category;
    };


    // Fetch ALL plans on mount
    useEffect(() => {
        const fetchAllPlans = async () => {
            setFetchingPlans(true);
            try {
                // Fetch all data plans natively
                const res = await fetch(`/api/vtu/plans?type=data`, { cache: 'no-store' }); // Ensure absolute no-cache
                const data = await res.json();

                if (!res.ok) {
                    setMessage({ type: 'error', text: data.error || `Status ${res.status}` });
                    setFetchingPlans(false);
                    return;
                }

                const allFetchedPlans = data.data || [];

                if (allFetchedPlans.length === 0) {
                    setMessage({ type: 'error', text: 'Error: No plans returned. Check API Keys or Authentication.' });
                    setFetchingPlans(false);
                    return;
                }

                // Group Plans by their exact category
                const groups: Record<string, any[]> = {};

                allFetchedPlans.forEach((plan: any) => {
                    const categoryName = getNetworkCategoryName(plan);

                    if (!groups[categoryName]) groups[categoryName] = [];
                    groups[categoryName].push(plan);
                });

                setGroupedPlans(groups);

                // Sort categories ensuring MTN DATASHARE is early
                const sortedKeys = Object.keys(groups).sort((a, b) => a.localeCompare(b));
                setProductTypes(sortedKeys);

            } catch (e) {
                console.error("Failed to fetch plans", e);
                setMessage({ type: 'error', text: 'Failed to load data plans. Please refresh.' });
            } finally {
                setFetchingPlans(false);
            }
        };

        fetchAllPlans();
    }, []);

    // Handle Product Selection (e.g. "MTN SME")
    const handleProductChange = (productKey: string) => {
        setSelectedProduct(productKey);
        setSelectedPlanId('');

        // Reset form data partially
        setFormData(prev => ({
            ...prev,
            plan_id: '',
            amount: 0,
            network_id: ''
        }));
    };

    // Handle Plan Selection
    const handlePlanChange = (planId: string) => {
        const plans = groupedPlans[selectedProduct] || [];
        const plan = plans.find(p => String(p.id) === String(planId));

        if (plan) {
            setSelectedPlanId(planId);
            
            // ISquareData's buyData API expects the primary network ID (1=MTN, 2=GLO, etc)
            // But the plans list returns a sub-category ID (e.g. 15 for MTN DATA TRANSFER, 6 for GLO SME).
            // We must map it back to the primary network ID.
            const pName = (plan.name || '').toUpperCase();
            let rootNetworkId = String(plan.network); // Fallback
            
            if (pName.includes('MTN') || pName.includes('THRYVE') || pName.includes('PULSE')) rootNetworkId = '1';
            else if (pName.includes('GLO')) rootNetworkId = '2';
            else if (pName.includes('9MOBILE')) rootNetworkId = '3';
            else if (pName.includes('AIRTEL') || pName.includes('BINGE')) rootNetworkId = '4';

            setFormData(prev => ({
                ...prev,
                plan_id: planId,
                amount: plan.amount,
                network_id: rootNetworkId 
            }));
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const res = await fetch('/api/vtu/data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Transaction failed');

            // Success (Reset or redirect)
            alert('Data purchase successful!');
            router.push('/dashboard');
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    // Get available plans for the selected product
    const currentPlans = selectedProduct ? (groupedPlans[selectedProduct] || []) : [];

    return (
        <div className="min-h-screen bg-white pb-20 font-sans">
            <DashboardHeader />

            <div className="max-w-xl mx-auto p-4 pt-8">

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-800">Buy Data</h1>
                </div>

                {message.text && (
                    <div className={`p-4 rounded-xl mb-6 text-sm font-medium ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* 1. Network / Product Type Dropdown */}
                    <div>
                        <label className="block text-sm font-bold text-gray-800 mb-2">
                            Which network would you like to buy?
                        </label>
                        {fetchingPlans ? (
                            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl text-gray-500">
                                <Loader2 className="animate-spin w-4 h-4" /> Loading plans...
                            </div>
                        ) : (
                            <div className="relative">
                                <select
                                    value={selectedProduct}
                                    onChange={(e) => handleProductChange(e.target.value)}
                                    className="w-full p-4 bg-white border border-gray-200 rounded-xl appearance-none font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                                >
                                    <option value="">-- Select a network --</option>
                                    {productTypes.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                    <ChevronRight className="rotate-90 w-5 h-5" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 2. Plan Dropdown */}
                    {selectedProduct && (
                        <div className="animate-in fade-in slide-in-from-top-2">
                            <label className="block text-sm font-bold text-gray-800 mb-2">
                                Select a data plan
                            </label>
                            <div className="relative">
                                <select
                                    value={selectedPlanId}
                                    onChange={(e) => handlePlanChange(e.target.value)}
                                    className="w-full p-4 bg-white border border-blue-500 rounded-xl appearance-none font-medium text-gray-700 focus:outline-none ring-1 ring-blue-500 cursor-pointer"
                                >
                                    <option value="">-- Select a plan --</option>
                                    {currentPlans.map(plan => (
                                        <option key={plan.id} value={plan.id}>
                                            {/* Clean up name: remove product type from name to avoid redundancy if desired, 
                                                but user screenshot shows full name sometimes. 
                                                Let's keep it simple: "NAME => PRICE" 
                                            */}
                                            {plan.name} {`=>`} ₦{plan.amount}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                    <ChevronRight className="rotate-90 w-5 h-5" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 3. Phone Number */}
                    {selectedPlanId && (
                        <div className="animate-in fade-in slide-in-from-top-2">
                            <label className="block text-sm font-bold text-gray-800 mb-2">
                                Recipient Phone Number
                            </label>
                            <div className="relative">
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="080..."
                                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                    required
                                />
                                <Phone className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            </div>
                        </div>
                    )}

                    {/* 4. PIN & Submit */}
                    {selectedPlanId && formData.phone.length >= 10 && (
                        <div className="animate-in fade-in slide-in-from-top-2 pt-4">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 text-center">
                                Transaction PIN
                            </label>
                            <div className="max-w-[200px] mx-auto mb-6">
                                <input
                                    type="password"
                                    name="pin"
                                    value={formData.pin}
                                    onChange={handleChange}
                                    maxLength={4}
                                    placeholder="••••"
                                    className="w-full p-3 text-center text-xl font-bold tracking-[0.5em] bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !formData.pin}
                                className="w-full bg-green-600 text-white py-4 rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-600/20 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : 'Purchase Now'}
                            </button>
                        </div>
                    )}

                </form>
            </div>
        </div>
    );
}
