
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

    // Helper: Categorize Plan Name
    const getPlanType = (plan: any) => {
        const name = (plan.name || '').toUpperCase();
        if (name.includes('SME')) return 'SME';
        if (name.includes('CORPORATE') || name.includes('CG') || name.includes('CORP')) return 'CORPORATE';
        if (name.includes('GIFTING')) return 'GIFTING';
        if (name.includes('AWOOF')) return 'AWOOF';
        if (name.includes('DATA SHARE') || name.includes('SHARE')) return 'DATASHARE';
        return 'NORMAL DATA';
    };

    // Fetch ALL plans on mount
    useEffect(() => {
        const fetchAllPlans = async () => {
            setFetchingPlans(true);
            try {
                // Fetch for all networks (1=MTN, 2=GLO, 3=9MOBILE, 4=AIRTEL)
                const networkIds = ['1', '2', '3', '4'];
                const promises = networkIds.map(id =>
                    fetch(`/api/vtu/plans?type=data&service_id=${id}`).then(res => res.json())
                );

                const results = await Promise.all(promises);
                const allFetchedPlans: any[] = [];

                results.forEach((res, index) => {
                    if (res.success && Array.isArray(res.data)) {
                        // Tag plans with their network ID since we might lose context
                        const networkId = networkIds[index];
                        const plansWithNet = res.data.map((p: any) => ({ ...p, _network_id: networkId }));
                        allFetchedPlans.push(...plansWithNet);
                    }
                });

                // Group Plans
                const groups: Record<string, any[]> = {};

                allFetchedPlans.forEach(plan => {
                    const networkName = NETWORKS.find(n => n.id === plan._network_id)?.name || 'UNKNOWN';
                    const planType = getPlanType(plan);
                    const key = `${networkName} ${planType}`; // e.g. "MTN SME"

                    if (!groups[key]) groups[key] = [];
                    groups[key].push(plan);
                });

                setGroupedPlans(groups);
                setProductTypes(Object.keys(groups).sort());

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
        const plan = plans.find(p => p.id === planId);

        if (plan) {
            setSelectedPlanId(planId);
            setFormData(prev => ({
                ...prev,
                plan_id: planId,
                amount: plan.amount,
                network_id: plan._network_id
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
