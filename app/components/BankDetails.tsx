'use client';

import { useState } from 'react';

interface BankDetailsProps {
    accountName?: string;
    accountNumber?: string;
    bankName?: string;
}

export default function BankDetails({ accountName = "User", accountNumber = "6669691730", bankName = "PALMPAY" }: BankDetailsProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(accountNumber);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
            <div className="flex items-center gap-2 mb-4">
                <h3 className="font-bold text-gray-800">Automated Bank Transfer</h3>
                <span className="text-xl">👇👇👇</span>
            </div>

            <p className="text-xs text-gray-500 mb-6 uppercase tracking-wide leading-relaxed">
                Make a transfer to this unique account number given to you, and your wallet will be credited immediately.
            </p>

            <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                    <span className="text-gray-600">Account Number:</span>
                    <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-lg text-gray-900">{accountNumber}</span>
                        <button
                            onClick={handleCopy}
                            className="text-green-500 hover:text-green-600 transition-colors"
                            title="Copy Account Number"
                        >
                            {copied ? (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                    <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-gray-600">Bank Name:</span>
                    <span className="font-bold text-gray-900">{bankName}</span>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-gray-600">Account Name:</span>
                    <span className="font-bold text-gray-900">Shabalink - {accountName}</span>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-gray-600">Charges:</span>
                    <span className="font-bold text-gray-900">FREE</span>
                </div>
            </div>
        </div>
    );
}
