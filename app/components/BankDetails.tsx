'use client';

import { useState } from 'react';
import { Copy, Building2, UserCircle, CheckCircle2 } from 'lucide-react';

interface BankDetailsProps {
    accountName?: string;
    accountNumber?: string;
    bankName?: string;
    monnifyAccountNumber?: string;
    monnifyBankName?: string;
}

export default function BankDetails({ 
    accountName, 
    accountNumber, 
    bankName = "PALMPAY",
    monnifyAccountNumber,
    monnifyBankName
}: BankDetailsProps) {
    const [copiedAccount, setCopiedAccount] = useState<string | null>(null);

    const handleCopy = (accNum?: string) => {
        if (!accNum) return;
        navigator.clipboard.writeText(accNum);
        setCopiedAccount(accNum);
        setTimeout(() => setCopiedAccount(null), 2000);
    };

    const accounts = [
        {
            num: accountNumber,
            bank: bankName,
            name: accountName ? `Shabalink - ${accountName}` : 'Not Assigned',
            isPrimary: true
        }
    ];

    if (monnifyAccountNumber) {
        accounts.push({
            num: monnifyAccountNumber,
            bank: monnifyBankName || "Monnify Bank",
            name: accountName || 'Not Assigned', // Monnify usually doesn't append Shabalink if we didn't explicitly request it
            isPrimary: false
        });
    }

    return (
        <div id="bank-details" className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8 scroll-mt-24">
            <div className="flex items-center gap-2 mb-2">
                <h3 className="font-bold text-gray-800 text-lg">Automated Bank Transfer</h3>
            </div>
            
            <p className="text-xs text-gray-500 mb-6 uppercase tracking-wide leading-relaxed">
                Transfer to your unique account number(s) below. Your wallet will be credited instantly. 
                {accounts.length > 1 && " You can use either account."}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {accounts.map((acc, idx) => {
                    if (!acc.num) return null;
                    const isCopied = copiedAccount === acc.num;

                    return (
                        <div key={idx} className="bg-gray-50 rounded-xl p-4 border border-gray-100 relative overflow-hidden group hover:border-blue-200 transition-colors">
                            {/* Decorative badge */}
                            <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-[10px] font-bold uppercase tracking-wider ${acc.isPrimary ? 'bg-blue-100 text-blue-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                {acc.isPrimary ? 'Primary Account' : 'Business Account'}
                            </div>

                            <div className="mt-4 space-y-4">
                                <div>
                                    <div className="flex items-center gap-1 text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">
                                        <Building2 className="w-3 h-3" /> {acc.bank}
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="font-mono text-2xl font-black text-gray-900 tracking-tight">
                                            {acc.num}
                                        </div>
                                        <button
                                            onClick={() => handleCopy(acc.num)}
                                            className={`p-2 rounded-lg transition-all ${isCopied ? 'bg-green-100 text-green-600' : 'bg-white shadow-sm text-gray-400 hover:text-blue-600 border border-gray-200'}`}
                                            title="Copy Account Number"
                                        >
                                            {isCopied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-sm">
                                    <UserCircle className="w-4 h-4 text-gray-400" />
                                    <span className="font-medium text-gray-700 line-clamp-1">{acc.name}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between text-xs font-medium text-gray-500">
                <span>Deposit Status: <span className="text-green-600 font-bold">Instant Credit</span></span>
                <span>Charges: <span className="px-2 py-0.5 bg-gray-100 rounded-md font-bold">FREE</span></span>
            </div>
        </div>
    );
}
