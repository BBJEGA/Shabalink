
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardHeader from '../../components/DashboardHeader';
import { Check, ChevronRight, Loader2, MonitorPlay, ShieldCheck, Wallet } from 'lucide-react';

export default function CablePage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [fetchingPlans, setFetchingPlans] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const [allPlans, setAllPlans] = useState<any[]>([]);
    const [availablePlans, setAvailablePlans] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        cable_id: '',
        plan_id: '',
        smartcard: '',
        phone: '',
        pin: '',
        amount: 0,
        customer_name: ''
    });

    useEffect(() => {
        setFetchingPlans(true);
        fetch('/api/vtu/plans?type=cable')
            .then(res => res.json())
            .then(json => { if (json.success) setAllPlans(json.data); })
            .finally(() => setFetchingPlans(false));
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'cable_id') {
            const filtered = allPlans.filter(p => p.cable_id === value);
            setAvailablePlans(filtered);
            setFormData(prev => ({ ...prev, plan_id: '', cable_id: value }));
        }
    };

    const handlePlanSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const plan = availablePlans.find(p => p.id === e.target.value);
        setFormData(prev => ({ ...prev, plan_id: e.target.value, amount: plan?.amount || 0 }));
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });
        setVerifying(true);
        try {
            const res = await fetch('/api/vtu/verify', {
                method: 'POST', body: JSON.stringify({ type: 'cable', ...formData })
            });
            const data = await res.json();
            if (data.success) {
                setFormData(prev => ({ ...prev, customer_name: data.data?.name || data.data?.customer_name || 'Verified User' }));
                setStep(2);
            } else {
                throw new Error(data.error || 'Verification failed');
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
            if (process.env.NODE_ENV === 'development') {
                setFormData(prev => ({ ...prev, customer_name: 'Test Cable User' }));
                setStep(2);
            }
        } finally {
            setVerifying(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/vtu/cable', {
                method: 'POST', body: JSON.stringify({ ...formData, action: 'purchase' })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setStep(4);
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-purple-50/30 pb-20 font-sans">
            <DashboardHeader />
            <div className="max-w-xl mx-auto p-4 pt-8">
                {/* Progress */}
                <div className="flex items-center justify-between mb-8 px-8">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= s ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-500'}`}>{step > s ? <Check size={16} /> : s}</div>
                    ))}
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-purple-600 p-6 text-white text-center">
                        <h1 className="text-xl font-bold">Pay TV Subscription</h1>
                        <p className="text-purple-100 text-sm mt-1">DSTV • GOTV • Startimes</p>
                    </div>

                    <div className="p-6">
                        {message.text && <div className="p-4 bg-red-50 text-red-600 rounded-xl mb-6 text-sm">{message.text}</div>}

                        {/* STEP 1: VERIFY */}
                        {step === 1 && (
                            <form onSubmit={handleVerify} className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Provider</label>
                                    <select name="cable_id" value={formData.cable_id} onChange={handleChange} className="w-full p-4 rounded-xl border border-gray-200 focus:ring-purple-500" required>
                                        <option value="">Select Provider</option>
                                        <option value="dstv">DSTV</option>
                                        <option value="gotv">GOTV</option>
                                        <option value="startimes">Startimes</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">IUC / Smartcard</label>
                                    <input type="text" name="smartcard" value={formData.smartcard} onChange={handleChange} className="w-full p-4 rounded-xl border border-gray-200" required placeholder="Header No." />
                                </div>
                                <button type="submit" disabled={verifying || !formData.cable_id} className="w-full bg-purple-600 text-white p-4 rounded-2xl font-bold flex justify-center items-center gap-2">
                                    {verifying ? <Loader2 className="animate-spin" /> : 'Verify IUC'} <ChevronRight size={18} />
                                </button>
                            </form>
                        )}

                        {/* STEP 2: PACKAGE */}
                        {step === 2 && (
                            <form onSubmit={(e) => { e.preventDefault(); setStep(3); }} className="space-y-8">
                                <div className="bg-purple-50 p-4 rounded-xl flex items-center gap-3 text-purple-800">
                                    <div className="bg-purple-100 p-2 rounded-full"><MonitorPlay size={16} /></div>
                                    <div className="font-bold">{formData.customer_name}</div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Select Package</label>
                                    <select name="plan_id" onChange={handlePlanSelect} className="w-full p-4 rounded-xl border border-gray-200" required>
                                        <option value="">Select...</option>
                                        {availablePlans.map(p => (
                                            <option key={p.id} value={p.id}>{p.name} - ₦{p.amount}</option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-gray-400 mt-2">Plus ₦100 Service Fee</p>
                                </div>

                                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full p-4 rounded-xl border-gray-200 bg-gray-50" placeholder="Phone Number" required />
                                <button type="submit" disabled={!formData.plan_id} className="w-full bg-purple-600 text-white p-4 rounded-2xl font-bold">Continue</button>
                            </form>
                        )}

                        {/* STEP 3: PIN */}
                        {step === 3 && (
                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="text-center">
                                    <div className="text-3xl font-black text-gray-800">₦{(Number(formData.amount) + 100).toFixed(2)}</div>
                                    <div className="text-sm text-gray-500">{formData.customer_name}</div>
                                </div>
                                <div className="relative max-w-[200px] mx-auto">
                                    <input type="password" name="pin" value={formData.pin} onChange={handleChange} maxLength={4} className="w-full p-4 text-center tracking-[0.5em] font-bold border-2 rounded-xl border-purple-500 focus:ring-0" placeholder="••••" required />
                                </div>
                                <div className="flex gap-3">
                                    <button type="button" onClick={() => setStep(2)} className="flex-1 bg-gray-100 p-4 rounded-xl font-bold text-gray-500">Back</button>
                                    <button type="submit" disabled={loading} className="flex-[2] bg-purple-600 text-white p-4 rounded-xl font-bold flex justify-center gap-2">
                                        {loading ? <Loader2 className="animate-spin" /> : 'Pay'}
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* STEP 4: SUCCESS */}
                        {step === 4 && (
                            <div className="text-center py-10">
                                <div className="text-green-500 mb-4 mx-auto"><Check size={60} /></div>
                                <h2 className="text-2xl font-bold text-gray-800">Subscription Successful!</h2>
                                <button onClick={() => router.push('/dashboard')} className="mt-8 w-full bg-gray-900 text-white p-4 rounded-xl font-bold">Done</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
