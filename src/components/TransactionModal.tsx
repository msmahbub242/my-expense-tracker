import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Wallet as WalletIcon,
  Tag,
  Repeat,
  FileText,
} from 'lucide-react';
import {
  Category,
  Wallet,
  CurrencyCode,
  Transaction,
  TransactionType,
  RecurringFrequency,
} from '../types/expense.ts';
import { SUPPORTED_CURRENCIES } from '../utils/calculations.ts';
import { CategoryIcon } from './CategoryIcon.tsx';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transactionData: {
    type: TransactionType;
    amount: number;
    currency: CurrencyCode;
    categoryId: string;
    walletId: string;
    date: string;
    notes: string;
    isRecurring: boolean;
    recurringFrequency?: RecurringFrequency;
  }) => void;
  categories: Category[];
  wallets: Wallet[];
  activeCurrency: CurrencyCode;
  onOpenCategoriesModal: () => void;
  initialData?: Transaction | null;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  categories,
  wallets,
  activeCurrency,
  onOpenCategoriesModal,
  initialData,
}) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState<string>('');
  const [currency, setCurrency] = useState<CurrencyCode>(activeCurrency);
  const [categoryId, setCategoryId] = useState<string>('');
  const [walletId, setWalletId] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [recurringFrequency, setRecurringFrequency] = useState<RecurringFrequency>('monthly');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setAmount(initialData.amount.toString());
      setCurrency(initialData.currency);
      setCategoryId(initialData.categoryId);
      setWalletId(initialData.walletId);
      setDate(initialData.date);
      setNotes(initialData.notes || '');
      setIsRecurring(!!initialData.isRecurring);
    } else {
      // Default selections
      setType('expense');
      setAmount('');
      setCurrency(activeCurrency);
      setDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      setIsRecurring(false);
      setRecurringFrequency('monthly');
      setError('');

      const filteredCats = categories.filter((c) => c.type === 'expense' || c.type === 'both');
      if (filteredCats.length > 0) {
        setCategoryId(filteredCats[0].id);
      }
      if (wallets.length > 0) {
        setWalletId(wallets[0].id);
      }
    }
  }, [initialData, isOpen, activeCurrency, categories, wallets]);

  // Update categories selection when type flips
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    const available = categories.filter((c) => c.type === newType || c.type === 'both');
    if (available.length > 0 && !available.some((c) => c.id === categoryId)) {
      setCategoryId(available[0].id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }
    if (!categoryId) {
      setError('Please select a category.');
      return;
    }
    if (!walletId) {
      setError('Please select an account or wallet.');
      return;
    }
    if (!date) {
      setError('Please select a transaction date.');
      return;
    }

    onSave({
      type,
      amount: parsedAmount,
      currency,
      categoryId,
      walletId,
      date,
      notes: notes.trim(),
      isRecurring,
      recurringFrequency: isRecurring ? recurringFrequency : undefined,
    });
    onClose();
  };

  if (!isOpen) return null;

  const filteredCategories = categories.filter((c) => c.type === type || c.type === 'both');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`p-2 rounded-xl ${
                type === 'expense' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
              }`}
            >
              {type === 'expense' ? (
                <ArrowDownLeft className="w-5 h-5" />
              ) : (
                <ArrowUpRight className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {initialData ? 'Edit Transaction' : 'Log New Transaction'}
              </h3>
              <p className="text-xs text-slate-400">Record income or track daily expenditures</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close transaction modal"
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Type Toggle: Expense vs Income */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-800/80 rounded-2xl border border-slate-700/60">
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                type === 'expense'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              Expense Outflow
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                type === 'income'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              Income Inflow
            </button>
          </div>

          {/* Amount & Currency Fields */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Amount & Currency *
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-bold text-lg focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-500"
                />
              </div>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-semibold text-sm focus:outline-none focus:border-emerald-500"
              >
                {(Object.keys(SUPPORTED_CURRENCIES) as CurrencyCode[]).map((c) => (
                  <option key={c} value={c}>
                    {SUPPORTED_CURRENCIES[c].symbol} {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category Selector with Quick Add */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300">Category *</label>
              <button
                type="button"
                onClick={onOpenCategoriesModal}
                className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                Manage Categories
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-1 bg-slate-800/40 rounded-xl border border-slate-700/60">
              {filteredCategories.map((cat) => {
                const isSelected = categoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={`flex items-center gap-2 p-2 rounded-xl text-left transition-all border cursor-pointer ${
                      isSelected
                        ? 'bg-slate-700 border-emerald-500/80 text-white shadow-sm'
                        : 'bg-slate-800/60 border-transparent text-slate-300 hover:bg-slate-700/60'
                    }`}
                  >
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${cat.color}30`, color: cat.color }}
                    >
                      <CategoryIcon name={cat.icon} className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-medium truncate">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Wallet Selector & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Payment Wallet / Account *
              </label>
              <select
                value={walletId}
                onChange={(e) => setWalletId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Date *</label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Notes / Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Notes & Description
            </label>
            <input
              type="text"
              placeholder="e.g. Grocery bazaar, Internet bill, Freelance milestone..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500 placeholder:text-slate-500"
            />
          </div>

          {/* Recurring Option */}
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
                <Repeat className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-white">Recurring Schedule</span>
                <p className="text-[11px] text-slate-400">
                  Automate monthly fixed bills (Rent, Utilities, Salary)
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-500" />
            </label>
          </div>

          {isRecurring && (
            <div className="p-3 bg-purple-950/30 border border-purple-800/40 rounded-xl flex items-center justify-between text-xs">
              <span className="text-purple-300 font-medium">Frequency:</span>
              <select
                value={recurringFrequency}
                onChange={(e) => setRecurringFrequency(e.target.value as RecurringFrequency)}
                className="bg-slate-800 border border-purple-700/60 rounded-lg px-2.5 py-1 text-white text-xs font-semibold"
              >
                <option value="monthly">Monthly Fixed</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-5 py-2.5 rounded-xl text-slate-950 font-bold text-xs sm:text-sm shadow-lg transition-all active:scale-95 cursor-pointer ${
                type === 'expense'
                  ? 'bg-rose-400 hover:bg-rose-300 shadow-rose-500/20'
                  : 'bg-emerald-400 hover:bg-emerald-300 shadow-emerald-500/20'
              }`}
            >
              {initialData ? 'Update Transaction' : 'Save Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
