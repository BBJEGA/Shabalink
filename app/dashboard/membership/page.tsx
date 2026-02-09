
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Check, Shield, Gem, Crown, Loader2, AlertCircle } from 'lucide-react';

export default function MembershipPage() {
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [upgrading, setUpgrading] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            setProfile(data);
        }
        setLoading(false);
    };

    const handleUpgrade = async (targetTier: string) => {
        if (!confirm(`Are you sure you want to upgrade to ${targetTier}? Fee will be deducted from your wallet.`)) return;

        setUpgrading(targetTier);
        setMessage(null);

        try {
            const res = await fetch('/api/membership/upgrade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ target_tier: targetTier })
            });

            const data = await res.json();

            if (data.success) {
                setMessage({ type: 'success', text: data.message });
                fetchProfile(); // Refresh state
                router.refresh(); // Refresh server components if any
            } else {
                setMessage({ type: 'error', text: data.error });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Upgrade failed. Please try again.' });
        } finally {
            setUpgrading(null);
        }
    };

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;

    const currentTier = profile?.tier || 'smart';

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold">Membership Plans</h1>
                <p className="text-gray-500">Upgrade your account to unlock cheaper rates and exclusive features.</p>
            </div>

            {message && (
                <div className={`p-4 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message.type === 'error' && <AlertCircle size={20} />}
                    {message.text}
                </div>
            )}

            <div className="grid md:grid-cols-3 gap-6">

                {/* SMART PLAN */}
                <div className={`border rounded-2xl p-6 space-y-6 relative bg-white ${currentTier === 'smart' ? 'ring-2 ring-blue-600 shadow-lg' : 'shadow-sm'}`}>
                    {currentTier === 'smart' && <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs px-3 py-1 rounded-bl-xl rounded-tr-xl">CURRENT PLAN</div>}
                    <div className="space-y-2">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                            <Shield size={24} />
                        </div>
                        <h3 className="text-xl font-bold">Smart User</h3>
                        <div className="text-3xl font-bold">Free</div>
                        <p className="text-sm text-gray-500">Perfect for personal use</p>
                    </div>
                    <ul className="space-y-3">
                        <li className="flex gap-2 text-sm"><Check size={16} className="text-blue-600" /> Standard Rates</li>
                        <li className="flex gap-2 text-sm"><Check size={16} className="text-blue-600" /> Instant Delivery</li>
                        <li className="flex gap-2 text-sm"><Check size={16} className="text-blue-600" /> 24/7 Support</li>
                        <li className="flex gap-2 text-sm"><Check size={16} className="text-blue-600" /> No Setup Fee</li>
                    </ul>
                    <button disabled className="w-full py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-400 font-medium cursor-default">
                        {currentTier === 'smart' ? 'Active' : 'Basic Plan'}
                    </button>
                </div>

                {/* RESELLER PLAN */}
                <div className={`border rounded-2xl p-6 space-y-6 relative bg-white ${currentTier === 'reseller' ? 'ring-2 ring-purple-600 shadow-lg' : 'shadow-sm'}`}>
                    {currentTier === 'reseller' && <div className="absolute top-0 right-0 bg-purple-600 text-white text-xs px-3 py-1 rounded-bl-xl rounded-tr-xl">CURRENT PLAN</div>}
                    <div className="space-y-2">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                            <Gem size={24} />
                        </div>
                        <h3 className="text-xl font-bold">Reseller</h3>
                        <div className="text-3xl font-bold">₦2,500</div>
                        <p className="text-sm text-gray-500">For business starters</p>
                    </div>
                    <ul className="space-y-3">
                        <li className="flex gap-2 text-sm"><Check size={16} className="text-purple-600" /> <strong>₦30 Discount</strong> per GB</li>
                        <li className="flex gap-2 text-sm"><Check size={16} className="text-purple-600" /> Cheaper Airtime Rates</li>
                        <li className="flex gap-2 text-sm"><Check size={16} className="text-purple-600" /> Priority Support</li>
                        <li className="flex gap-2 text-sm"><Check size={16} className="text-purple-600" /> One-time Fee</li>
                    </ul>
                    {currentTier === 'reseller' ? (
                        <button disabled className="w-full py-2 rounded-lg bg-purple-600 text-white font-medium opacity-50 cursor-default">
                            Current Plan
                        </button>
                    ) : currentTier === 'partner' ? (
                        <button disabled className="w-full py-2 rounded-lg border border-gray-200 text-gray-400 font-medium">Included</button>
                    ) : (
                        <button
                            onClick={() => handleUpgrade('reseller')}
                            disabled={!!upgrading}
                            className="w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors disabled:opacity-50"
                        >
                            {upgrading === 'reseller' ? 'Processing...' : 'Upgrade to Reseller'}
                        </button>
                    )}
                </div>

                {/* PARTNER PLAN */}
                <div className={`border rounded-2xl p-6 space-y-6 relative bg-gradient-to-b from-gray-900 to-gray-800 text-white shadow-xl transform md:-translate-y-4`}>
                    {currentTier === 'partner' && <div className="absolute top-0 right-0 bg-yellow-500 text-black text-xs px-3 py-1 rounded-bl-xl rounded-tr-xl font-bold">CURRENT PLAN</div>}
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-yellow-500 text-black px-4 py-1 rounded-full text-xs font-bold shadow-lg">
                        BEST VALUE
                    </div>
                    <div className="space-y-2">
                        <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center text-yellow-500">
                            <Crown size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-white">Partner</h3>
                        <div className="text-3xl font-bold text-white">₦10,000</div>
                        <p className="text-sm text-gray-400">Maximum profits & API Access</p>
                    </div>
                    <ul className="space-y-3">
                        <li className="flex gap-2 text-sm"><Check size={16} className="text-yellow-500" /> <strong>Wholesale Rates</strong> (+₦5 Markup)</li>
                        <li className="flex gap-2 text-sm"><Check size={16} className="text-yellow-500" /> <strong>API Access</strong> Integration</li>
                        <li className="flex gap-2 text-sm"><Check size={16} className="text-yellow-500" /> Dedicated Account Manager</li>
                        <li className="flex gap-2 text-sm"><Check size={16} className="text-yellow-500" /> Premium Support</li>
                    </ul>
                    {currentTier === 'partner' ? (
                        <button disabled className="w-full py-2 rounded-lg bg-yellow-500 text-black font-bold opacity-50 cursor-default">
                            Current Plan
                        </button>
                    ) : (
                        <button
                            onClick={() => handleUpgrade('partner')}
                            disabled={!!upgrading}
                            className="w-full py-2 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black font-bold transition-colors disabled:opacity-50"
                        >
                            {upgrading === 'partner' ? 'Processing...' : 'Upgrade to Partner'}
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
}
