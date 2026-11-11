import React, { useState } from 'react';
import {
  X,
  Repeat,
  Plus,
  Play,
  Calendar,
  Wallet as WalletIcon,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import {
  RecurringRule,
  Category,
  Wallet,
  CurrencyCode,
  TransactionType,
  RecurringFrequency,
} from '../types/expense.ts';
import { formatCurrency, SUPPORTED_CURRENCIES } from '../utils/calculations.ts';
import { CategoryIcon } from './CategoryIcon.tsx';

interface RecurringModalProps {
  isOpen: boolean;
  onClose: () => void;
  recurringRules: RecurringRule[];
  categories: Category[];
  wallets: Wallet[];
  currency: CurrencyCode;
  onAddRule: (rule: Omit<RecurringRule, 'id'>) => void;
  onToggleRule: (ruleId: string) => void;
  onDeleteRule: (ruleId: string) => void;
  onProcessDue: () => void;
  dueCount: number;
}

export const RecurringModal: React.FC<RecurringModalProps> = ({
  isOpen,
  onClose,
  recurringRules,
  categories,
  wallets,
  currency,
  onAddRule,
  onToggleRule,
  onDeleteRule,
  onProcessDue,
  dueCount,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [walletId, setWalletId] = useState(wallets[0]?.id || '');
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');
  const [dayOfMonth, setDayOfMonth] = useState<number>(1);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!title.trim() || isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please provide a valid title and positive amount.');
      return;
    }

    // Next due date calculation
    const today = new Date();
    const targetMonth = today.getDate() > dayOfMonth ? today.getMonth() + 1 : today.getMonth();
    const nextDate = new Date(today.getFullYear(), targetMonth, dayOfMonth);
    const nextDueDate = nextDate.toISOString().split('T')[0];

    onAddRule({
      title: title.trim(),
      type,
      amount: parsedAmount,
      currency,
      categoryId,
      walletId,
      frequency,
      dayOfMonth,
      nextDueDate,
      active: true,
      notes: notes.trim(),
    });

    setTitle('');
    setAmount('');
    setNotes('');
    setShowAddForm(false);
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
              <Repeat className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Recurring Schedules & Automated Bills</h3>
              <p className="text-xs text-slate-400">
                Automate periodic fixed expenses (House Rent, Internet, Payroll)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close recurring modal"
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Due Processor Banner */}
          <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
                <Play className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-purple-200">
                  {dueCount > 0
                    ? `${dueCount} recurring item(s) due today or past due`
                    : 'All recurring logs are up to date'}
                </h4>
                <p className="text-xs text-purple-300/80">
                  Processes and posts automated transactions to your ledger with 1-click.
                </p>
              </div>
            </div>
            <button
              onClick={onProcessDue}
              className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              Post Due Items Now
            </button>
          </div>

          {/* Add Rule Button or Form */}
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full py-2.5 px-4 rounded-xl border border-dashed border-purple-500/40 hover:border-purple-500 bg-purple-500/5 hover:bg-purple-500/10 text-purple-300 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Recurring Bill or Inflow
            </button>
          ) : (
            <form
              onSubmit={handleCreate}
              className="p-4 rounded-2xl bg-slate-800/80 border border-purple-500/40 space-y-3.5"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-purple-400" />
                  New Recurring Schedule
                </h4>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>

              {error && (
                <div className="p-2 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. House Rent, Fiber Internet"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs sm:text-sm focus:outline-none focus:border-purple-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Amount ({currency}) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs sm:text-sm font-bold focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as TransactionType)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-purple-400"
                  >
                    <option value="expense">Expense Outflow</option>
                    <option value="income">Income Inflow</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-purple-400"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Wallet</label>
                  <select
                    value={walletId}
                    onChange={(e) => setWalletId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-purple-400"
                  >
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Frequency
                  </label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-purple-400"
                  >
                    <option value="monthly">Monthly Fixed</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Scheduled Day of Month (1-31)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={dayOfMonth}
                    onChange={(e) => setDayOfMonth(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-bold focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Auto-debit on 5th of every month"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  Save Schedule
                </button>
              </div>
            </form>
          )}

          {/* List of Recurring Rules */}
          <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
            {recurringRules.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                No recurring schedules configured yet.
              </div>
            ) : (
              recurringRules.map((rule) => {
                const cat = categories.find((c) => c.id === rule.categoryId);
                const wallet = wallets.find((w) => w.id === rule.walletId);

                return (
                  <div
                    key={rule.id}
                    className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      rule.active
                        ? 'bg-slate-800/60 border-slate-700/60'
                        : 'bg-slate-900/60 border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0"
                        style={{
                          backgroundColor: `${cat?.color || '#a855f7'}25`,
                          color: cat?.color || '#a855f7',
                        }}
                      >
                        <CategoryIcon name={cat?.icon || 'Repeat'} className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-white">{rule.title}</h4>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                              rule.type === 'expense'
                                ? 'bg-rose-500/20 text-rose-300'
                                : 'bg-emerald-500/20 text-emerald-300'
                            }`}
                          >
                            {rule.type}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {cat?.name} • {wallet?.name} • Next due: {rule.nextDueDate}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <div className="text-right">
                        <span className="text-sm font-bold text-white block">
                          {formatCurrency(rule.amount, currency)}
                        </span>
                        <span className="text-[10px] text-slate-400 capitalize">
                          {rule.frequency} (Day {rule.dayOfMonth})
                        </span>
                      </div>

                      <button
                        onClick={() => onToggleRule(rule.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                          rule.active
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-slate-700 text-slate-400'
                        }`}
                      >
                        {rule.active ? 'Active' : 'Paused'}
                      </button>

                      <button
                        onClick={() => onDeleteRule(rule.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                        title="Delete recurring schedule"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-800 flex justify-end bg-slate-900/60">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
