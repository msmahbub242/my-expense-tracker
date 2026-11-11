import React, { useState } from 'react';
import {
  Wallet as WalletIcon,
  Plus,
  ArrowRightLeft,
  Smartphone,
  Building2,
  Banknote,
  CreditCard,
} from 'lucide-react';
import { Wallet, CurrencyCode } from '../types/expense.ts';
import { formatCurrency, convertCurrency } from '../utils/calculations.ts';

interface WalletOverviewProps {
  wallets: Wallet[];
  activeCurrency: CurrencyCode;
  onOpenTransferModal: () => void;
  onOpenAddWalletModal: () => void;
}

export const WalletOverview: React.FC<WalletOverviewProps> = ({
  wallets,
  activeCurrency,
  onOpenTransferModal,
  onOpenAddWalletModal,
}) => {
  const getWalletIcon = (type: Wallet['type']) => {
    switch (type) {
      case 'cash':
        return <Banknote className="w-5 h-5 text-emerald-400" />;
      case 'bank':
        return <Building2 className="w-5 h-5 text-blue-400" />;
      case 'mobile_banking':
        return <Smartphone className="w-5 h-5 text-pink-400" />;
      case 'credit_card':
        return <CreditCard className="w-5 h-5 text-amber-400" />;
      default:
        return <WalletIcon className="w-5 h-5 text-indigo-400" />;
    }
  };

  const getWalletBadge = (type: Wallet['type']) => {
    switch (type) {
      case 'cash':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'bank':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'mobile_banking':
        return 'bg-pink-500/10 text-pink-400 border-pink-500/20';
      case 'credit_card':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <WalletIcon className="w-4 h-4 text-emerald-400" />
            Accounts & Payment Wallets
          </h3>
          <p className="text-xs text-slate-400">
            Real-time balance across Cash, Bank Accounts, and bKash / Nagad
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenTransferModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-cyan-400" />
            Transfer Funds
          </button>
          <button
            onClick={onOpenAddWalletModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            Add Wallet
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {wallets.map((wallet) => (
          <div
            key={wallet.id}
            className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-slate-600/80 transition-all flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700/80">
                  {getWalletIcon(wallet.type)}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white tracking-tight">{wallet.name}</h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${getWalletBadge(
                        wallet.type
                      )}`}
                    >
                      {wallet.type.replace('_', ' ')}
                    </span>
                    {wallet.accountNumber && (
                      <span className="text-[11px] text-slate-400 font-mono">
                        {wallet.accountNumber}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-700/40 flex items-baseline justify-between">
              <span className="text-xs text-slate-400">Available Balance:</span>
              <div className="text-right">
                <span className="text-lg font-bold text-white tracking-tight">
                  {formatCurrency(
                    convertCurrency(wallet.balance, wallet.currency, activeCurrency),
                    activeCurrency
                  )}
                </span>
                {wallet.currency !== activeCurrency && (
                  <span className="text-[10px] text-slate-400 block font-medium">
                    Native: {formatCurrency(wallet.balance, wallet.currency)}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
