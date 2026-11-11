import React, { useState } from 'react';
import { X, ArrowRightLeft, Check } from 'lucide-react';
import { Wallet, CurrencyCode } from '../types/expense.ts';
import { formatCurrency } from '../utils/calculations.ts';

interface WalletTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallets: Wallet[];
  currency: CurrencyCode;
  onTransfer: (fromWalletId: string, toWalletId: string, amount: number, note: string) => void;
}

export const WalletTransferModal: React.FC<WalletTransferModalProps> = ({
  isOpen,
  onClose,
  wallets,
  currency,
  onTransfer,
}) => {
  const [fromWalletId, setFromWalletId] = useState(wallets[0]?.id || '');
  const [toWalletId, setToWalletId] = useState(wallets[1]?.id || wallets[0]?.id || '');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const fromWallet = wallets.find((w) => w.id === fromWalletId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid transfer amount.');
      return;
    }
    if (fromWalletId === toWalletId) {
      setError('Source and destination wallets must be different.');
      return;
    }
    if (fromWallet && fromWallet.balance < parsedAmount) {
      setError(`Insufficient balance in ${fromWallet.name}. Available: ${formatCurrency(fromWallet.balance, currency)}`);
      return;
    }

    onTransfer(fromWalletId, toWalletId, parsedAmount, note.trim());
    setAmount('');
    setNote('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden my-8">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Transfer Between Accounts</h3>
              <p className="text-xs text-slate-400">Move money between Cash, Bank, or Mobile wallets</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close transfer modal"
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
              From Wallet (Source) *
            </label>
            <select
              value={fromWalletId}
              onChange={(e) => setFromWalletId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs sm:text-sm focus:outline-none focus:border-cyan-400"
            >
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} — Balance: {formatCurrency(w.balance, currency)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              To Wallet (Destination) *
            </label>
            <select
              value={toWalletId}
              onChange={(e) => setToWalletId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs sm:text-sm focus:outline-none focus:border-cyan-400"
            >
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} — Balance: {formatCurrency(w.balance, currency)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Transfer Amount ({currency}) *
            </label>
            <input
              type="number"
              step="any"
              required
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm font-bold focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Transfer Note / Reason
            </label>
            <input
              type="text"
              placeholder="e.g. ATM cash withdrawal, bKash top-up from bank"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs sm:text-sm focus:outline-none focus:border-cyan-400"
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
              className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
            >
              Complete Transfer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
