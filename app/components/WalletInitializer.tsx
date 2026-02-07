
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function WalletInitializer({
    userEmail,
    userName
}: {
    userEmail: string,
    userName: string
}) {
    const router = useRouter();
    const [initializing, setInitializing] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const initWallet = async () => {
            try {
                const res = await fetch('/api/wallet/init', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email: userEmail, name: userName })
                });

                const data = await res.json();

                if (!res.ok) {
                    // If already exists, just refresh to show it
                    if (data.message?.includes('already has')) {
                        router.refresh();
                        return;
                    }
                    throw new Error(data.error || 'Failed to initialize wallet');
                }

                // Success - refresh page to show new account number
                router.refresh();

            } catch (err: any) {
                console.error('Wallet Init Error:', err);
                setError(err.message);
            } finally {
                setInitializing(false);
            }
        };

        initWallet();
    }, [userEmail, userName, router]);

    if (error) {
        return (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-6 border border-red-100">
                Note: Virtual Account generation failed. ({error}). Please contact support or try again later.
            </div>
        );
    }

    return (
        <div className="bg-indigo-50 text-indigo-700 p-4 rounded-xl text-sm mb-6 border border-indigo-100 flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            Creating your dedicated virtual account...
        </div>
    );
}
