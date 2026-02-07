
'use client';

import Link from 'next/link';

interface DashboardHeaderProps {
    userEmail?: string;
    fullName?: string;
}

export default function DashboardHeader({ userEmail, fullName }: DashboardHeaderProps) {
    // Get initials: "Bala Bello" -> "BB", "User" -> "US", "email@..." -> "EM"
    const getInitials = () => {
        if (fullName) {
            const names = fullName.split(' ');
            if (names.length >= 2) {
                return (names[0][0] + names[1][0]).toUpperCase();
            }
            return names[0].substring(0, 2).toUpperCase();
        }
        if (userEmail) {
            return userEmail.substring(0, 2).toUpperCase();
        }
        return 'US'; // User
    };

    return (
        <header className="bg-white p-4 flex justify-between items-center sticky top-0 z-20 shadow-sm">
            <h1 className="text-xl font-bold text-indigo-600">Shabalink</h1>
            <Link href="/profile">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm cursor-pointer hover:bg-indigo-200 transition-colors border border-indigo-200">
                    {getInitials()}
                </div>
            </Link>
        </header>
    );
}
