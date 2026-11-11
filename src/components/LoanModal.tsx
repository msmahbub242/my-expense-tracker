import React, { useState } from 'react';
import { X, HandCoins, Plus, Calendar, User, FileText, CheckCircle2, RotateCcw } from 'lucide-react';
import { Loan, Wallet, CurrencyCode, LoanType } from '../types/expense.ts';
import { formatCurrency, convertCurrency } from '../utils/calculations.ts';

interface LoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  loans: Loan[];
  wallets: Wallet[];
  currency: CurrencyCode;
  onAddLoan: (loanData: Omit<Loan, 'id' | 'createdAt' | 'userId'>) => void;
  onSettleLoan: (loanId: string) => void;
  onDeleteLoan: (loanId: string) => void;
}

export const LoanModal: React.FC<LoanModalProps> = ({
  isOpen,
  onClose,
  loans,
  wallets,
  currency,
  onAddLoan,
  onSettleLoan,
  onDeleteLoan,
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'add'>('list');
  const [type, setType] = useState<LoanType>('given'); // given = lend, taken = borrow
  const [personName, setPersonName] = useState('');
  const [amount, setAmount] = useState('');
  const [walletId, setWalletId] = useState(wallets[0]?.id || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'settled'>('active');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amount);
    if (!personName.trim() || isNaN(amountNum) || amountNum <= 0) {
      setError('Please provide a valid person name and amount.');
      return;
    }

    onAddLoan({
      type,
      personName: personName.trim(),
      amount: amountNum,
      currency,
      walletId: walletId || wallets[0]?.id || 'w-cash',
      date,
      dueDate: dueDate.trim() || undefined,
      notes: notes.trim() || undefined,
      status: 'active',
    });

    setPersonName('');
    setAmount('');
    setDueDate('');
    setNotes('');
    setError('');
    setActiveTab('list');
  };

  const filteredLoans = loans.filter((l) => {
    if (filterStatus === 'all') return true;
    return l.status === filterStatus;
  }).sort((a, b) => b.date.localeCompare(a.date));

  // Calculate totals
  const totalGivenActive = loans
    .filter((l) => l.type === 'given' && l.status === 'active')
    .reduce((sum, l) => sum + convertCurrency(l.amount, l.currency, currency), 0);

  const totalTakenActive = loans
    .filter((l) => l.type === 'taken' && l.status === 'active')
    .reduce((sum, l) => sum + convertCurrency(l.amount, l.currency, currency), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <HandCoins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Loan Manager (ধার দেওয়া ও নেওয়া)</h3>
              <p className="text-xs text-slate-400">Track money lent to friends or borrowed from others</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3 p-6 pb-2">
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-xs text-emerald-400 font-semibold block mb-1">Total Lent (পাওনা আছে)</span>
            <span className="text-xl font-bold text-emerald-300 tracking-tight">
              {formatCurrency(totalGivenActive, currency)}
            </span>
          </div>
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20">
            <span className="text-xs text-rose-400 font-semibold block mb-1">Total Borrowed (দেনা আছে)</span>
            <span className="text-xl font-bold text-rose-300 tracking-tight">
              {formatCurrency(totalTakenActive, currency)}
            </span>
          </div>
        </div>

        {/* Tabs & Filters */}
        <div className="px-6 py-2 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-900/60">
          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('list')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'list'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Loans ({loans.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('add')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                activeTab === 'add'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              Add Loan
            </button>
          </div>

          {activeTab === 'list' && (
            <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded-xl text-xs">
              <span className="text-slate-400">Status:</span>
              {(['active', 'settled', 'all'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setFilterStatus(st)}
                  className={`px-2 py-0.5 rounded uppercase text-[10px] font-bold cursor-pointer ${
                    filterStatus === st
                      ? 'bg-emerald-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold">
              {error}
            </div>
          )}

          {activeTab === 'add' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Loan Type *</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as LoanType)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="given">Lent to Someone (কাউকে ধার দিয়েছি)</option>
                    <option value="taken">Borrowed from Someone (কারো কাছ থেকে ধার নিয়েছি)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {type === 'given' ? 'Borrower Name (পাওনাদার/ব্যক্তি)' : 'Lender Name (যাকে শোধ করতে হবে)'} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahim Ahmed"
                    value={personName}
                    onChange={(e) => setPersonName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Wallet *</label>
                  <select
                    value={walletId}
                    onChange={(e) => setWalletId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                  >
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({formatCurrency(w.balance, w.currency)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Due Date (Optional)</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Notes / Description</label>
                <textarea
                  placeholder="e.g. Emergency loan for 2 weeks"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md cursor-pointer"
                >
                  Save Loan Record
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              {filteredLoans.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <HandCoins className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No loan records found for this filter.</p>
                </div>
              ) : (
                filteredLoans.map((loan) => {
                  const isGiven = loan.type === 'given';
                  const isSettled = loan.status === 'settled';
                  const wallet = wallets.find((w) => w.id === loan.walletId);

                  return (
                    <div
                      key={loan.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isSettled
                          ? 'bg-slate-900/40 border-slate-800 opacity-70'
                          : isGiven
                          ? 'bg-emerald-950/20 border-emerald-500/30'
                          : 'bg-rose-950/20 border-rose-500/30'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                              isGiven
                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                            }`}
                          >
                            {isGiven ? 'Lent (পাওনা)' : 'Borrowed (দেনা)'}
                          </span>
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                              isSettled ? 'bg-slate-800 text-slate-400' : 'bg-amber-500/20 text-amber-300'
                            }`}
                          >
                            {isSettled ? 'Settled' : 'Active'}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {loan.personName}
                        </h4>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                          <span>Date: {loan.date}</span>
                          {loan.dueDate && <span>Due: {loan.dueDate}</span>}
                          {wallet && <span>Wallet: {wallet.name}</span>}
                          {loan.notes && <span className="italic">"{loan.notes}"</span>}
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4">
                        <span
                          className={`text-lg font-extrabold tracking-tight ${
                            isGiven ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isGiven ? '+' : '-'} {formatCurrency(convertCurrency(loan.amount, loan.currency, currency), currency)}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {!isSettled && (
                            <button
                              type="button"
                              onClick={() => onSettleLoan(loan.id)}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                              title="Mark as Settled / Paid"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Settle
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm('Delete this loan record?')) {
                                onDeleteLoan(loan.id);
                              }
                            }}
                            className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
