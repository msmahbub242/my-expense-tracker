import React, { useState } from 'react';
import {
  Search,
  Filter,
  Calendar,
  X,
  Trash2,
  Edit2,
  Repeat,
  ArrowDownLeft,
  ArrowUpRight,
  SlidersHorizontal,
  FileSpreadsheet,
  HandCoins,
} from 'lucide-react';
import {
  Transaction,
  Category,
  Wallet,
  CurrencyCode,
  MonthlySummary,
} from '../types/expense.ts';
import { formatCurrency, convertCurrency } from '../utils/calculations.ts';
import { CategoryIcon } from './CategoryIcon.tsx';

interface TransactionListProps {
  transactions: Transaction[];
  filteredTransactions: Transaction[];
  categories: Category[];
  wallets: Wallet[];
  currency: CurrencyCode;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryFilterChange: (catId: string) => void;
  selectedWallet: string;
  onWalletFilterChange: (walletId: string) => void;
  selectedType: 'all' | 'expense' | 'income';
  onTypeFilterChange: (type: 'all' | 'expense' | 'income') => void;
  startDate: string;
  onStartDateChange: (date: string) => void;
  endDate: string;
  onEndDateChange: (date: string) => void;
  onResetFilters: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  monthlySummary: MonthlySummary;
  onOpenLoanModal?: () => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  filteredTransactions,
  categories,
  wallets,
  currency,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryFilterChange,
  selectedWallet,
  onWalletFilterChange,
  selectedType,
  onTypeFilterChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  onResetFilters,
  onEditTransaction,
  onDeleteTransaction,
  monthlySummary,
  onOpenLoanModal,
}) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const walletMap = new Map(wallets.map((w) => [w.id, w]));

  const hasActiveFilters =
    searchQuery ||
    selectedCategory !== 'all' ||
    selectedWallet !== 'all' ||
    selectedType !== 'all' ||
    startDate ||
    endDate;

  const loanSum = monthlySummary.loanSummary;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-5">
      {/* 1. Monthly Text Summary Banner */}
      <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Monthly Summary Overview ({monthlySummary.monthYear})
            </span>
            <p className="text-xs text-slate-300 mt-1">
              Logged <span className="font-bold text-white">{monthlySummary.transactionCount} transactions</span> this month.
              {monthlySummary.topSpendingCategory && (
                <>
                  {' '}
                  Top expenditure was in{' '}
                  <span className="font-semibold text-amber-300">
                    {monthlySummary.topSpendingCategory.name} (
                    {formatCurrency(monthlySummary.topSpendingCategory.amount, currency)})
                  </span>
                  .
                </>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80">
              <span className="text-slate-400">Total Outflow:</span>{' '}
              <span className="font-bold text-rose-400">
                {formatCurrency(monthlySummary.totalExpense, currency)}
              </span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80">
              <span className="text-slate-400">Net Saved:</span>{' '}
              <span className="font-bold text-emerald-400">
                {formatCurrency(monthlySummary.netSavings, currency)} ({monthlySummary.savingsRate}%)
              </span>
            </div>
          </div>
        </div>

        {/* Loan Activity Sub-Summary */}
        {loanSum && (
          <div className="pt-2.5 border-t border-slate-700/50 flex flex-wrap items-center justify-between gap-2.5 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-purple-300 font-semibold">
                <HandCoins className="w-4 h-4 text-purple-400" />
                <span>Loans Overview (ঋণ দেন-পাওনা):</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                  Lent (পাবো): <strong className="font-bold">{formatCurrency(loanSum.totalLent, currency)}</strong>
                </span>
                <span className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300">
                  Borrowed (দেবো): <strong className="font-bold">{formatCurrency(loanSum.totalBorrowed, currency)}</strong>
                </span>
                {loanSum.monthlyRepaid > 0 && (
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300">
                    Repaid This Month: {formatCurrency(loanSum.monthlyRepaid, currency)}
                  </span>
                )}
                {loanSum.monthlyCollected > 0 && (
                  <span className="px-2 py-0.5 rounded bg-teal-500/10 border border-teal-500/20 text-teal-300">
                    Recovered This Month: {formatCurrency(loanSum.monthlyCollected, currency)}
                  </span>
                )}
              </div>
            </div>

            {onOpenLoanModal && (
              <button
                onClick={onOpenLoanModal}
                className="px-2.5 py-1 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer"
              >
                <HandCoins className="w-3.5 h-3.5" />
                Manage Loans (ঋণ সূচি)
              </button>
            )}
          </div>
        )}
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          {/* Keyword Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by note, category, wallet, or amount..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500 placeholder:text-slate-500"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Type Filter Tabs */}
          <div className="flex items-center bg-slate-800 p-0.5 rounded-xl border border-slate-700 text-xs font-medium">
            <button
              onClick={() => onTypeFilterChange('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedType === 'all'
                  ? 'bg-slate-700 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => onTypeFilterChange('expense')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedType === 'expense'
                  ? 'bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Expenses
            </button>
            <button
              onClick={() => onTypeFilterChange('income')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedType === 'income'
                  ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Income
            </button>
          </div>

          {/* Advanced Filter Toggle */}
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              showAdvancedFilters || hasActiveFilters
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>
        </div>

        {/* Expandable Advanced Filters Drawer */}
        {showAdvancedFilters && (
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Category Filter */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Filter by Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => onCategoryFilterChange(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Wallet Filter */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Filter by Wallet / Account
              </label>
              <select
                value={selectedWallet}
                onChange={(e) => onWalletFilterChange(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="all">All Accounts</option>
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date From */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => onEndDateChange(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {hasActiveFilters && (
              <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
                <button
                  onClick={onResetFilters}
                  className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Transaction Items List */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-medium">
          <span>
            Showing <strong className="text-white">{filteredTransactions.length}</strong> of{' '}
            {transactions.length} entries
          </span>
          <span>Sorted by latest date</span>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="py-12 text-center p-6 border border-dashed border-slate-800 rounded-2xl">
            <FileSpreadsheet className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-slate-300">No transactions match your search</h4>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your search keywords, clearing filters, or log a new transaction.
            </p>
            {hasActiveFilters && (
              <button
                onClick={onResetFilters}
                className="mt-3 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          filteredTransactions.map((tx) => {
            const cat = categoryMap.get(tx.categoryId);
            const wallet = walletMap.get(tx.walletId);
            const isIncome = tx.type === 'income';

            return (
              <div
                key={tx.id}
                className="p-3.5 sm:p-4 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/50 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: `${cat?.color || '#94a3b8'}20`,
                      color: cat?.color || '#94a3b8',
                    }}
                  >
                    <CategoryIcon name={cat?.icon || 'Tag'} className="w-5 h-5" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-white tracking-tight truncate">
                        {cat?.name || 'Uncategorized'}
                      </span>
                      {wallet && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                          {wallet.name}
                        </span>
                      )}
                      {tx.isRecurring && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                          <Repeat className="w-2.5 h-2.5" />
                          Recurring
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                      <span>{tx.date}</span>
                      {tx.notes && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[220px] sm:max-w-md text-slate-300">
                            {tx.notes}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 self-end sm:self-auto shrink-0">
                  <div className="text-right">
                    <span
                      className={`text-base font-extrabold flex items-center justify-end gap-1 ${
                        isIncome ? 'text-teal-400' : 'text-slate-100'
                      }`}
                    >
                      {isIncome ? '+' : '-'} {formatCurrency(tx.amount, tx.currency)}
                    </span>
                    {tx.currency !== currency && (
                      <span className="text-[10px] text-slate-400 block">
                        ≈ {formatCurrency(convertCurrency(tx.amount, tx.currency, currency), currency)}
                      </span>
                    )}
                  </div>

                  {/* Actions: Edit & Delete */}
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onEditTransaction(tx)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/60 transition-colors cursor-pointer"
                      title="Edit transaction"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteTransaction(tx.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Delete transaction"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
