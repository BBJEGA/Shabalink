import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import WelcomeHeader from '../components/WelcomeHeader';
import BankDetails from '../components/BankDetails';
import WalletCard from '../components/WalletCard';
import ServiceCard from '../components/ServiceCard';
import WalletInitializer from '../components/WalletInitializer';
import DashboardHeader from '../components/DashboardHeader';

const services = [
    {
        title: 'Buy Data',
        href: '/dashboard/data',
        color: 'bg-green-50 text-green-600',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12h1.5m-1.5 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z" />
            </svg>
        )
    },
    {
        title: 'Airtime',
        href: '/dashboard/airtime',
        color: 'bg-blue-50 text-blue-600',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
            </svg>
        )
    },
    {
        title: 'Electricity',
        href: '/dashboard/electricity',
        color: 'bg-yellow-50 text-yellow-600',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
        )
    },
    {
        title: 'Cable TV',
        href: '/dashboard/cable',
        color: 'bg-purple-50 text-purple-600',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 20.25h12m-7.5-3v3m3-3v3m-10.125-3h17.25c.621 0 1.125-.504 1.125-1.125V4.875c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125z" />
            </svg>
        )
    },
    {
        title: 'Membership',
        href: '/dashboard/membership',
        color: 'bg-indigo-50 text-indigo-600',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
        )
    },
];

export default async function Dashboard() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/'); // Or /login if you have one
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    // Logic: If no account number, we show the Initializer.
    // If account number exists, we show BankDetails.

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <DashboardHeader
                userEmail={user.email}
                fullName={profile?.full_name}
            />

            <div className="max-w-7xl mx-auto p-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column (Desktop) / Top (Mobile) */}
                    <div className="lg:col-span-2">
                        <div className="lg:grid lg:grid-cols-2 lg:gap-6">
                            <div className="lg:col-span-2">
                                <WelcomeHeader name={profile?.full_name || user.email?.split('@')[0]} />
                            </div>
                            <div className="lg:col-span-1">
                                {profile?.account_number ? (
                                    <BankDetails
                                        accountName={profile.account_name || profile.full_name}
                                        accountNumber={profile.account_number}
                                        bankName={profile.bank_name || 'PALMPAY'}
                                    />
                                ) : (
                                    <WalletInitializer
                                        userEmail={user.email || ''}
                                        userName={profile?.full_name || 'User'}
                                    />
                                )}
                            </div>
                            <div className="lg:col-span-1">
                                <WalletCard balance={profile?.wallet_balance || 0} />
                            </div>
                        </div>
                    </div>

                    {/* Right Column (Desktop) / Bottom (Mobile) - Services */}
                    <div className="lg:col-span-1">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full">
                            <h3 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">Services</h3>
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                {services.map((service) => (
                                    <ServiceCard
                                        key={service.title}
                                        title={service.title}
                                        icon={service.icon}
                                        href={service.href}
                                        colorClass={service.color}
                                    />
                                ))}
                            </div>

                            <h3 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">Recent Activity</h3>
                            <div className="bg-gray-50 rounded-xl p-4 text-center text-gray-500 py-12">
                                <p className="text-sm">No recent transactions</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
