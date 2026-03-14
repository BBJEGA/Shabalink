
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [pin, setPin] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [bvn, setBvn] = useState('');
    const [dob, setDob] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const supabase = createClient();
    const router = useRouter();

    const fetchProfile = async (userId: string) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        if (!error) setProfile(data);
    };

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            if (user) fetchProfile(user.id);
        };
        getUser();
    }, [supabase]);

    const updatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        if (password !== confirmPassword) {
            setMessage({ type: 'error', text: "Passwords do not match" });
            setLoading(false);
            return;
        }

        const { error } = await supabase.auth.updateUser({ password });

        if (error) {
            setMessage({ type: 'error', text: error.message });
        } else {
            setMessage({ type: 'success', text: "Password updated successfully!" });
            setPassword('');
            setConfirmPassword('');
        }
        setLoading(false);
    };

    const updatePin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        if (pin.length !== 4) {
            setMessage({ type: 'error', text: "PIN must be 4 digits" });
            setLoading(false);
            return;
        }

        const { error } = await supabase
            .from('profiles')
            .update({ transaction_pin: pin })
            .eq('id', user?.id);

        if (error) {
            setMessage({ type: 'error', text: error.message });
        } else {
            setMessage({ type: 'success', text: "Transaction PIN updated successfully!" });
            setPin('');
        }
        setLoading(false);
    };

    const handleUpgrade = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        if (bvn.length !== 11) {
            setMessage({ type: 'error', text: "BVN must be 11 digits" });
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/profile/upgrade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bvn, dob })
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Upgrade failed');

            setMessage({ type: 'success', text: "Account upgraded to Tier 2 successfully!" });
            setBvn('');
            if (user) fetchProfile(user.id);
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 pb-20">
            {/* Header */}
            <header className="bg-white p-4 flex justify-between items-center sticky top-0 z-20 shadow-sm rounded-2xl mb-6">
                <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-900">
                    ← Back
                </button>
                <h1 className="text-lg font-bold text-gray-900">My Profile</h1>
                <div className="w-8"></div> {/* Spacer */}
            </header>

            <div className="max-w-md mx-auto space-y-6">
                {/* User Info & Tier */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
                    <div className="relative inline-block">
                        <div className="bg-indigo-100 text-indigo-700 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-bold">
                            {user?.user_metadata?.full_name?.split(' ').map((n: any) => n[0]).join('').substring(0, 2).toUpperCase() || user?.email?.substring(0, 2).toUpperCase()}
                        </div>
                        <div className={`absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shadow-sm ${profile?.tier === 'level_2' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                            {profile?.tier === 'level_2' ? 'Tier 2' : 'Tier 1'}
                        </div>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">{profile?.full_name || user?.user_metadata?.full_name || 'User'}</h2>
                    <p className="text-gray-500 text-sm mb-4">{user?.email}</p>

                    {/* Active Bank Account */}
                    {profile?.account_number && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100 inline-block text-left w-full">
                            <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Active Funding Account</p>
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-lg font-mono font-bold text-gray-900">{profile.account_number}</p>
                                    <p className="text-xs text-indigo-600 font-medium">{profile.bank_name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-gray-400 uppercase font-bold">Limit</p>
                                    <p className="text-xs font-bold text-gray-700">{profile?.tier === 'level_2' ? '₦1,000,000+' : '₦50,000'}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {message && (
                    <div className={`p-4 rounded-xl text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                        {message.text}
                    </div>
                )}

                {/* Tier 2 Upgrade (Only show for Tier 1) */}
                {profile?.tier !== 'level_2' && (
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-100 bg-indigo-50/30">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-indigo-600 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm">
                                🚀
                            </div>
                            <h3 className="font-bold text-gray-900 font-outfit">Upgrade to Tier 2</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                            Get a personal business account (Monnify) with higher transaction limits and instant settlement.
                            <br/><span className="text-red-600 font-bold text-xs">Note: A non-refundable ₦50 BVN Verification fee applies.</span>
                        </p>
                        <form onSubmit={handleUpgrade} className="space-y-4">
                            <input
                                type="text"
                                inputMode="numeric"
                                placeholder="Enter 11-Digit BVN"
                                required
                                maxLength={11}
                                value={bvn}
                                onChange={(e) => setBvn(e.target.value.replace(/\D/g, ''))}
                                className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none text-lg tracking-widest text-center"
                            />
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Date of Birth</label>
                                <input
                                    type="date"
                                    required
                                    value={dob}
                                    onChange={(e) => setDob(e.target.value)}
                                    className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none text-center text-gray-700 font-medium"
                                />
                            </div>
                            <button disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {loading ? 'Processing...' : 'Verify & Upgrade (₦50)'}
                            </button>
                            <p className="text-[10px] text-gray-400 text-center italic">
                                Your BVN and DOB are only used for identity verification as required by CBN.
                            </p>
                        </form>
                    </div>
                )}

                {/* Change Password */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-semibold text-gray-900 mb-4 font-outfit">Change Password</h3>
                    <form onSubmit={updatePassword} className="space-y-4">
                        <input
                            type="password"
                            placeholder="New Password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                            minLength={6}
                        />
                        <input
                            type="password"
                            placeholder="Confirm New Password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                            minLength={6}
                        />
                        <button disabled={loading} className="w-full bg-gray-800 hover:bg-black text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50">
                            Update Password
                        </button>
                    </form>
                </div>

                {/* Change PIN */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-semibold text-gray-900 mb-4 font-outfit">Update Transaction PIN</h3>
                    <form onSubmit={updatePin} className="space-y-4">
                        <input
                            type="password"
                            inputMode="numeric"
                            placeholder="New 4-Digit PIN"
                            required
                            maxLength={4}
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-center tracking-widest text-lg"
                        />
                        <button disabled={loading} className="w-full bg-gray-800 hover:bg-black text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50">
                            Update PIN
                        </button>
                    </form>
                </div>

                <button
                    onClick={async () => {
                        await supabase.auth.signOut();
                        router.push('/login');
                    }}
                    className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-4 rounded-xl transition-colors"
                >
                    Sign Out
                </button>

            </div>
        </div>
    );
}

