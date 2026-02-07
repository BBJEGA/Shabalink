
'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function CreatePinPage() {
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    const handleSetPin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (pin.length !== 4 || isNaN(Number(pin))) {
            setError("PIN must be 4 digits");
            setLoading(false);
            return;
        }

        if (pin !== confirmPin) {
            setError("PINs do not match");
            setLoading(false);
            return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/login');
            return;
        }

        // Update profile with new PIN
        const { error } = await supabase
            .from('profiles')
            .update({ transaction_pin: pin })
            .eq('id', user.id);

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            router.push('/dashboard');
            router.refresh();
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-sm w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="bg-indigo-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                        🔒
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Create Transaction PIN</h1>
                    <p className="text-gray-500 text-sm">
                        Set a 4-digit PIN to secure your wallet transactions.
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSetPin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Enter 4-Digit PIN</label>
                        <input
                            type="password"
                            inputMode="numeric"
                            maxLength={4}
                            required
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-center text-2xl tracking-widest"
                            placeholder="••••"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm PIN</label>
                        <input
                            type="password"
                            inputMode="numeric"
                            maxLength={4}
                            required
                            value={confirmPin}
                            onChange={(e) => setConfirmPin(e.target.value)}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-center text-2xl tracking-widest"
                            placeholder="••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Saving PIN...' : 'Secure Account'}
                    </button>
                </form>
            </div>
        </div>
    );
}
