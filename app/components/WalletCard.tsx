
import Link from 'next/link';

export default function WalletCard() {
    return (
        <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-lg mb-8 relative overflow-hidden">
            <div className="relative z-10">
                <p className="text-indigo-100 text-sm font-medium mb-1">Wallet Balance</p>
                <h2 className="text-3xl font-bold">₦ 0.00</h2>
            </div>

            {/* Decorative background circles */}
            <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
        </div>
    );
}
