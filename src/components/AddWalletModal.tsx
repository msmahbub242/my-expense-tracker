import React, { useState } from 'react';
import { X, Plus, Wallet as WalletIcon } from 'lucide-react';
import { Wallet, WalletType, CurrencyCode } from '../types/expense.ts';

interface AddWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency: CurrencyCode;
  onAddWallet: (wallet: Omit<Wallet, 'id'>) => void;
}

export const AddWalletModal: React.FC<AddWalletModalProps> = ({
  isOpen,
  onClose,
  currency,
  onAddWallet,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<WalletType>('mobile_banking');
  const [initialBalance, setInitialBalance] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const balanceNum = parseFloat(initialBalance) || 0;
    if (!name.trim()) {
      setError('Please provide a name for the account/wallet.');
      return;
    }

    const colorMap: Record<WalletType, string> = {
      cash: '#059669',
      bank: '#2563eb',
      mobile_banking: '#db2777',
      credit_card: '#f59e0b',
    };

    onAddWallet({
      name: name.trim(),
      type,
      balance: balanceNum,
      currency,
      color: colorMap[type],
      icon: type === 'cash' ? 'Banknote' : type === 'bank' ? 'Building2' : 'Smartphone',
      accountNumber: accountNumber.trim() || undefined,
    });

    setName('');
    setInitialBalance('');
    setAccountNumber('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden my-8">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Add Payment Account</h3>
              <p className="text-xs text-slate-400">Create a new wallet, bank or mobile account</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close add wallet modal"
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Account / Wallet Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Nagad Personal, BRAC Bank, Upay"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Account Type *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as WalletType)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value="mobile_banking">Mobile Banking (bKash/Nagad)</option>
                <option value="bank">Bank Checking / Savings</option>
                <option value="cash">Cash In Hand</option>
                <option value="credit_card">Credit Card</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Initial Balance ({currency})
              </label>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs sm:text-sm font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Account / Phone Number (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. 018****4321 or ****5678"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
            >
              Create Wallet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
