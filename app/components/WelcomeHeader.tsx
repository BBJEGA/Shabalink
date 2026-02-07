
import Link from 'next/link';

interface WelcomeHeaderProps {
    name?: string;
}

export default function WelcomeHeader({ name = "User" }: WelcomeHeaderProps) {
    return (
        <div className="bg-blue-50 rounded-2xl p-6 mb-6 flex flex-col items-center text-center relative overflow-hidden">
            <div className="relative z-10 w-full max-w-sm">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                    Welcome back, <br /> <span className="text-indigo-600">{name}!</span>
                </h2>
                <p className="text-gray-600 text-sm mb-6">
                    Your account has been verified successfully.
                </p>

                <div className="space-y-3">
                    <button className="w-full bg-lime-500 hover:bg-lime-600 text-white font-bold py-3 px-6 rounded-xl shadow-sm transition-colors">
                        Fund Wallet
                    </button>
                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-sm transition-colors">
                        Update Your KYC
                    </button>
                </div>
            </div>

            {/* Decorative illustration placeholder */}
            <div className="hidden md:block absolute right-0 bottom-0 h-full w-1/3 bg-contain bg-no-repeat bg-right-bottom opacity-20" style={{ backgroundImage: 'url(/illustration.png)' }}></div>
        </div>
    );
}
