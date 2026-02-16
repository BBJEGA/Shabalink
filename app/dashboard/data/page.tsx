
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardHeader from '../../components/DashboardHeader';
import { NETWORKS } from '@/lib/isquare';
import { Check, ChevronRight, Loader2, Phone, ShieldCheck, Signal, Wallet, Globe } from 'lucide-react';

export default function BuyDataPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [fetchingPlans, setFetchingPlans] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Data
    const [allPlans, setAllPlans] = useState<any[]>([]);
    const [planTypes, setPlanTypes] = useState<string[]>([]);
    const [selectedType, setSelectedType] = useState<string>('');

    // Form
    const [formData, setFormData] = useState({
        network_id: '',
        plan_id: '',
        phone: '',
        pin: '',
        amount: 0 // Will store the SELLING PRICE
    });

    // Helper: Categorize Plan Name
    const getPlanType = (plan: any) => {
        // If API provides a type, usage it? (Usually API types are 'data', 'airtime', not 'sme')
        // So we rely on the name.
        const name = (plan.name || '').toUpperCase();

        if (name.includes('SME')) return 'SME';
        if (name.includes('CORPORATE') || name.includes('CG') || name.includes('CORP')) return 'CORPORATE';
        if (name.includes('GIFTING')) return 'GIFTING';
        if (name.includes('AWOOF')) return 'AWOOF';
        if (name.includes('DATA SHARE') || name.includes('SHARE')) return 'DATA SHARE';

        // If no keywords match, it might be the "Normal" or "Direct" plan.
        return 'GIFTING/NORMAL';
    };

    // 1. Fetch Plans on demand when network is selected
    const handleNetworkSelect = async (id: string) => {
        setFormData(prev => ({ ...prev, network_id: id, plan_id: '', amount: 0 }));
        setSelectedType('');
        setFetchingPlans(true);
        setAllPlans([]);
        setPlanTypes([]);
        setMessage({ type: '', text: '' });

        try {
            const res = await fetch(`/api/vtu/plans?type=data&service_id=${id}`);
            const json = await res.json();
            if (json.success) {
                const plans = json.data;
                setAllPlans(plans);

                if (plans.length === 0) {
                    setMessage({ type: 'error', text: 'No plans available for this network at the moment.' });
                } else {
                    // Extract unique types
                    const types = Array.from(new Set(plans.map((p: any) => getPlanType(p)))).sort();
                    setPlanTypes(types as string[]);
                }
            } else {
                setMessage({ type: 'error', text: json.error || 'Failed to fetch plans' });
            }
        } catch (e) {
            console.error("Failed to fetch plans", e);
            setMessage({ type: 'error', text: 'Connection error. Please try again.' });
        } finally {
            setFetchingPlans(false);
        }
    };

    const handleTypeSelect = (type: string) => {
        setSelectedType(type);
        setFormData(prev => ({ ...prev, plan_id: '', amount: 0 }));
    };

    const handlePlanSelect = (plan: any) => {
        setFormData(prev => ({ ...prev, plan_id: plan.id, amount: plan.amount }));
        // Automatically go to next step after selecting plan? 
        // Or keep "Next Step" button. Keeping button is safer for UX.
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleNext = (e: React.FormEvent) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        if (step === 1) {
            if (!formData.network_id) {
                setMessage({ type: 'error', text: 'Select a network' });
                return;
            }
            if (!selectedType && planTypes.length > 0) {
                setMessage({ type: 'error', text: 'Select a plan type' });
                return;
            }
            if (!formData.plan_id) {
                setMessage({ type: 'error', text: 'Select a data plan' });
                return;
            }
        }
        if (step === 2 && !formData.phone) {
            setMessage({ type: 'error', text: 'Enter phone number' });
            return;
        }
        setStep(prev => prev + 1);
    };

    const handleBack = () => setStep(prev => prev - 1);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/vtu/data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Transaction failed');

            // Success Step
            setStep(4);
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    // Filter available plans based on selected type
    const filteredPlans = allPlans.filter(p => getPlanType(p) === selectedType);

    return (
        <div className="min-h-screen bg-green-50/30 pb-20 font-sans">
            <DashboardHeader />

            <div className="max-w-xl mx-auto p-4 pt-8">

                {/* Progress Bar */}
                <div className="flex items-center justify-between mb-8 px-4">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${step >= s ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'
                                }`}>
                                {step > s ? <Check size={16} /> : s}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">

                    {/* Header */}
                    <div className="bg-green-600 p-6 text-white text-center">
                        <h1 className="text-xl font-bold">Buy Data Bundle</h1>
                        <p className="text-green-100 text-sm mt-1">Stay connected with affordable plans</p>
                    </div>

                    <div className="p-6">
                        {message.text && (
                            <div className={`p-4 rounded-xl mb-6 text-sm font-medium ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                {message.text}
                            </div>
                        )}

                        {/* STEP 1: NETWORK & PLAN SELECTION */}
                        {step === 1 && (
                            <div className="space-y-6">
                                {/* 1. Network */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Select Network</label>
                                    <div className="grid grid-cols-4 gap-3">
                                        {NETWORKS.map((net) => (
                                            <button
                                                key={net.id}
                                                onClick={() => handleNetworkSelect(net.id)}
                                                className={`aspect-square rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${formData.network_id === net.id
                                                    ? 'border-green-600 bg-green-50 text-green-700'
                                                    : 'border-gray-100 hover:border-gray-200 text-gray-500'
                                                    }`}
                                            >
                                                <Signal size={20} strokeWidth={2.5} />
                                                <span className="text-[10px] font-bold">{net.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* 2. Plan Type (Dynamic) */}
                                {formData.network_id && !fetchingPlans && planTypes.length > 0 && (
                                    <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Select Plan Type</label>
                                        <div className="flex flex-wrap gap-2">
                                            {planTypes.map((type) => (
                                                <button
                                                    key={type}
                                                    onClick={() => handleTypeSelect(type)}
                                                    className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all ${selectedType === type
                                                        ? 'border-green-600 bg-green-50 text-green-700'
                                                        : 'border-gray-100 text-gray-500 hover:border-gray-200'
                                                        }`}
                                                >
                                                    {type}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Loading State */}
                                {fetchingPlans && (
                                    <div className="flex justify-center p-8"><Loader2 className="animate-spin text-green-600" /></div>
                                )}

                                {/* 3. Available Bundles */}
                                {selectedType && (
                                    <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Available Bundles</label>
                                        <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                                            {filteredPlans.map((plan) => (
                                                <button
                                                    key={plan.id}
                                                    onClick={() => handlePlanSelect(plan)}
                                                    className={`p-4 rounded-2xl border text-left transition-all ${formData.plan_id === plan.id
                                                        ? 'border-green-500 bg-green-50 ring-1 ring-green-500'
                                                        : 'border-gray-100 hover:border-green-200 bg-gray-50/50'
                                                        }`}
                                                >
                                                    <div className="font-bold text-gray-800 text-sm">{plan.name.replace(selectedType, '').replace(NETWORKS.find(n => n.id === formData.network_id)?.name || '', '').trim()}</div>
                                                    <div className="text-green-600 font-bold mt-1">₦{plan.amount}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={handleNext}
                                    disabled={!formData.plan_id}
                                    className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition-transform active:scale-95 shadow-lg shadow-green-600/20 disabled:opacity-50 disabled:scale-100 mt-4"
                                >
                                    Next Step <ChevronRight size={18} />
                                </button>
                            </div>
                        )}

                        {/* STEP 2: PHONE */}
                        {step === 2 && (
                            <form onSubmit={handleNext} className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Recipient Number</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><Phone size={18} /></span>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-green-500/20 font-medium text-gray-800"
                                            placeholder="080..."
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <button type="button" onClick={handleBack} className="flex-1 py-4 bg-gray-100 rounded-2xl font-bold text-gray-600">Back</button>
                                    <button type="submit" className="flex-[2] bg-green-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-green-600/20">Review</button>
                                </div>
                            </form>
                        )}


                        {/* STEP 3: CONFIRM & PIN */}
                        {step === 3 && (
                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="text-center space-y-2">
                                    <div className="text-gray-400 text-sm font-medium uppercase tracking-widest">Confirm Transaction</div>
                                    <div className="text-3xl font-black text-gray-800">₦{Number(formData.amount).toFixed(2)}</div>
                                    <div className="text-sm text-gray-500">Data Bundle • {NETWORKS.find(n => n.id === formData.network_id)?.name}</div>
                                </div>

                                <div className="bg-green-50 p-5 rounded-2xl space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Number</span>
                                        <span className="font-bold text-gray-800">{formData.phone}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Plan</span>
                                        {/* Find plan in allPlans since filteredPlans might logically change if state resets, though safe here */}
                                        <span className="font-bold text-gray-800">{allPlans.find(p => p.id === formData.plan_id)?.name}</span>
                                    </div>
                                    <div className="h-px bg-green-200"></div>
                                    <div className="flex justify-between text-base">
                                        <span className="text-green-800 font-bold">Total Pay</span>
                                        <span className="font-black text-green-800">₦{formData.amount}</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 text-center">Enter Transaction PIN</label>
                                    <div className="relative max-w-[200px] mx-auto">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><ShieldCheck size={18} /></span>
                                        <input
                                            type="password"
                                            name="pin"
                                            value={formData.pin}
                                            onChange={handleChange}
                                            maxLength={4}
                                            className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl border-2 focus:border-green-500 focus:ring-0 text-center font-bold tracking-[0.5em] text-gray-800"
                                            placeholder="••••"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <button type="button" onClick={handleBack} className="py-4 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors">
                                        Back
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="py-4 rounded-xl font-bold text-white bg-green-600 hover:bg-green-700 transition-all shadow-lg shadow-green-600/20 disabled:opacity-70 flex items-center justify-center gap-2"
                                    >
                                        {loading ? <Loader2 className="animate-spin" /> : <><Wallet size={20} /> Purchase</>}
                                    </button>
                                </div>
                            </form>
                        )}


                        {/* STEP 4: SUCCESS */}
                        {step === 4 && (
                            <div className="text-center py-10">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
                                    <Check size={40} strokeWidth={3} />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800 mb-2">Success!</h2>
                                <p className="text-gray-500 mb-8">Your data plan has been activated.</p>

                                <button
                                    onClick={() => router.push('/dashboard')}
                                    className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold hover:bg-black transition-colors"
                                >
                                    Done
                                </button>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
}
