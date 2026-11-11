import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Wallet as WalletIcon, RotateCcw } from 'lucide-react';
import { Wallet, CurrencyCode } from '../types/expense.ts';

interface EditWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: Wallet | null;
  currency: CurrencyCode;
  onSave: (updatedWallet: Wallet) => void;
  onDelete?: (walletId: string) => void;
}

export const EditWalletModal: React.FC<EditWalletModalProps> = ({
  isOpen,
  onClose,
  wallet,
  currency,
  onSave,
  onDelete,
}) => {
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  useEffect(() => {
    if (wallet) {
      setName(wallet.name);
      setBalance(wallet.balance.toString());
      setAccountNumber(wallet.accountNumber || '');
    }
  }, [wallet]);

  if (!isOpen || !wallet) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const balanceNum = parseFloat(balance) || 0;

    onSave({
      ...wallet,
      name: name.trim() || wallet.name,
      balance: balanceNum,
      accountNumber: accountNumber.trim() || undefined,
    });
    onClose();
  };

  const handleSetZero = () => {
    setBalance('0');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden my-8">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <WalletIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Edit Wallet / Starting Balance</h3>
              <p className="text-xs text-slate-400">Update account details or set balance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Account Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-300">
                Current / Starting Balance ({currency})
              </label>
              <button
                type="button"
                onClick={handleSetZero}
                className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Set to 0 ৳
              </button>
            </div>
            <input
              type="number"
              step="any"
              required
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm font-bold focus:outline-none focus:border-emerald-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Since you are starting out, you can keep this at 0 or set your actual cash in hand.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Account / Phone Number (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. 017****9210 or ****4892"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <div className="pt-2 flex items-center justify-between gap-3">
            {onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Delete wallet "${wallet.name}"?`)) {
                    onDelete(wallet.id);
                    onClose();
                  }
                }}
                className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4 stroke-[2.5]" />
                Save Balance
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
