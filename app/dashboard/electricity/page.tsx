
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardHeader from '../../components/DashboardHeader';
import { Check, ChevronRight, Loader2, Phone, ShieldCheck, Wallet, Zap } from 'lucide-react';

export default function ElectricityPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Data
    const [discos, setDiscos] = useState<any[]>([]);

    // Form
    const [formData, setFormData] = useState({
        disco_id: '',
        meter_number: '',
        meter_type: 'prepaid',
        amount: '',
        phone: '',
        pin: '',
        customer_name: '' // verified name
    });

    useEffect(() => {
        // Fetch Discos on mount
        fetch('/api/vtu/plans?type=electricity')
            .then(res => res.json())
            .then(json => { if (json.success) setDiscos(json.data); });
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        if (!formData.disco_id || !formData.meter_number) {
            setMessage({ type: 'error', text: 'Fill all fields' }); return;
        }

        setVerifying(true);
        try {
            const res = await fetch('/api/vtu/verify', {
                method: 'POST', body: JSON.stringify({ type: 'electricity', ...formData })
            });
            const data = await res.json();
            if (data.success) {
                // My new route returns { success: true, data: { name: ... } }
                // ISquare usually returns { name: "Customer Name" } or similar inside 'data'.
                // Adjusting to match common pattern:
                setFormData(prev => ({ ...prev, customer_name: data.data?.name || data.data?.customer_name || 'Verified Meter' }));
                setStep(2);
            } else {
                throw new Error(data.error || 'Verification failed');
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
            // Dev Mock
            if (process.env.NODE_ENV === 'development') {
                setFormData(prev => ({ ...prev, customer_name: 'Mr Test User' }));
                setStep(2);
            }
        } finally {
            setVerifying(false);
        }
    };

    const handleNext = (e: React.FormEvent) => {
        e.preventDefault();
        setStep(prev => prev + 1);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/vtu/electricity', {
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
        <div className="min-h-screen bg-yellow-50/30 pb-20 font-sans">
            <DashboardHeader />
            <div className="max-w-xl mx-auto p-4 pt-8">

                {/* Progress */}
                <div className="flex items-center justify-between mb-8 px-8">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= s ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-500'}`}>{step > s ? <Check size={16} /> : s}</div>
                    ))}
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-yellow-500 p-6 text-white text-center">
                        <h1 className="text-xl font-bold">Pay Electricity Bill</h1>
                        <p className="text-yellow-50 text-sm mt-1">Instant token generation</p>
                    </div>

                    <div className="p-6">
                        {message.text && <div className="p-4 bg-red-50 text-red-600 rounded-xl mb-6 text-sm">{message.text}</div>}

                        {/* STEP 1: VERIFY */}
                        {step === 1 && (
                            <form onSubmit={handleVerify} className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Provider</label>
                                    <select name="disco_id" value={formData.disco_id} onChange={handleChange} className="w-full p-4 rounded-xl border border-gray-200 focus:ring-yellow-500" required>
                                        <option value="">Select Disco</option>
                                        {discos.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Type</label>
                                        <select name="meter_type" onChange={handleChange} className="w-full p-4 rounded-xl border border-gray-200" value={formData.meter_type}>
                                            <option value="prepaid">Prepaid</option>
                                            <option value="postpaid">Postpaid</option>
                                        </select>
                                    </div>
                                    <div className="flex-[2]">
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Meter Number</label>
                                        <input type="text" name="meter_number" value={formData.meter_number} onChange={handleChange} className="w-full p-4 rounded-xl border border-gray-200" required placeholder="1234..." />
                                    </div>
                                </div>
                                <button type="submit" disabled={verifying} className="w-full bg-yellow-500 text-white p-4 rounded-2xl font-bold flex justify-center items-center gap-2">
                                    {verifying ? <Loader2 className="animate-spin" /> : 'Verify Meter'} <ChevronRight size={18} />
                                </button>
                            </form>
                        )}

                        {/* STEP 2: AMOUNT */}
                        {step === 2 && (
                            <form onSubmit={handleNext} className="space-y-6">
                                <div className="bg-green-50 p-4 rounded-xl flex items-center gap-3 text-green-800">
                                    <div className="bg-green-100 p-2 rounded-full"><Check size={16} /></div>
                                    <div className="font-bold">{formData.customer_name}</div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Amount to Buy</label>
                                    <input type="number" name="amount" value={formData.amount} onChange={handleChange} className="w-full p-4 rounded-xl border-gray-200 bg-gray-50 text-lg font-bold" placeholder="0.00" required />
                                    <p className="text-xs text-gray-400 mt-2">Service Fee: ₦100</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Phone</label>
                                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full p-4 rounded-xl border-gray-200 bg-gray-50" placeholder="081..." required />
                                </div>
                                <button type="submit" className="w-full bg-yellow-500 text-white p-4 rounded-2xl font-bold">Continue</button>
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
                                    <input type="password" name="pin" value={formData.pin} onChange={handleChange} maxLength={4} className="w-full p-4 text-center tracking-[0.5em] font-bold border-2 rounded-xl border-yellow-500 focus:ring-0" placeholder="••••" required />
                                </div>
                                <div className="flex gap-3">
                                    <button type="button" onClick={() => setStep(2)} className="flex-1 bg-gray-100 p-4 rounded-xl font-bold text-gray-500">Back</button>
                                    <button type="submit" disabled={loading} className="flex-[2] bg-yellow-500 text-white p-4 rounded-xl font-bold flex justify-center gap-2">
                                        {loading ? <Loader2 className="animate-spin" /> : 'Pay'}
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* STEP 4: SUCCESS */}
                        {step === 4 && (
                            <div className="text-center py-10">
                                <div className="text-green-500 mb-4 mx-auto"><Check size={60} /></div>
                                <h2 className="text-2xl font-bold text-gray-800">Payment Successful!</h2>
                                <button onClick={() => router.push('/dashboard')} className="mt-8 w-full bg-gray-900 text-white p-4 rounded-xl font-bold">Done</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
