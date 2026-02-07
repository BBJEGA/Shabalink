
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
    const [user, setUser] = useState<any>(null);
    const [pin, setPin] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
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
                {/* User Info */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
                    <div className="bg-indigo-100 text-indigo-700 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-bold">
                        {user?.user_metadata?.full_name?.split(' ').map((n: any) => n[0]).join('').substring(0, 2).toUpperCase() || user?.email?.substring(0, 2).toUpperCase()}
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">{user?.user_metadata?.full_name || 'User'}</h2>
                    <p className="text-gray-500 text-sm">{user?.email}</p>
                </div>

                {message && (
                    <div className={`p-4 rounded-xl text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                        {message.text}
                    </div>
                )}

                {/* Change Password */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-semibold text-gray-900 mb-4">Change Password</h3>
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
                        <button disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50">
                            Update Password
                        </button>
                    </form>
                </div>

                {/* Change PIN */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-semibold text-gray-900 mb-4">Update Transaction PIN</h3>
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
                        <button disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50">
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
