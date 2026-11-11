import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  AlertTriangle,
  AlertOctagon,
  Percent,
} from 'lucide-react';
import { CurrencyCode, BudgetStatus } from '../types/expense.ts';
import { formatCurrency } from '../utils/calculations.ts';

interface BalanceCardsProps {
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  savingsRate: number;
  currency: CurrencyCode;
  budgetStatuses: BudgetStatus[];
  onOpenBudgetsModal: () => void;
  casualIncome: number;
  salaryIncome: number;
}

export const BalanceCards: React.FC<BalanceCardsProps> = ({
  totalIncome,
  totalExpense,
  netSavings,
  savingsRate,
  currency,
  budgetStatuses,
  onOpenBudgetsModal,
  casualIncome,
  salaryIncome,
}) => {
  const warnings = budgetStatuses.filter((b) => b.status === 'warning');
  const exceeded = budgetStatuses.filter((b) => b.status === 'exceeded');

  return (
    <div className="space-y-4">
      {/* Alert Warning Banners if any budget hits 80% or 100% */}
      {(exceeded.length > 0 || warnings.length > 0) && (
        <div className="space-y-2">
          {exceeded.map((b) => (
            <div
              key={b.categoryId}
              className="bg-rose-500/15 border border-rose-500/40 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 text-rose-200 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
                  <AlertOctagon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-rose-300">
                    Budget Exceeded Alert: {b.categoryName}
                  </h4>
                  <p className="text-xs text-rose-300/80">
                    You spent {formatCurrency(b.spent, currency)} of your{' '}
                    {formatCurrency(b.limit, currency)} monthly limit ({b.percentUsed}%).
                  </p>
                </div>
              </div>
              <button
                onClick={onOpenBudgetsModal}
                className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-semibold border border-rose-500/30 shrink-0 cursor-pointer"
              >
                Manage Budget
              </button>
            </div>
          ))}

          {warnings.map((b) => (
            <div
              key={b.categoryId}
              className="bg-amber-500/15 border border-amber-500/40 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 text-amber-200"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-300">
                    Budget Warning: {b.categoryName} crossed 80%
                  </h4>
                  <p className="text-xs text-amber-300/80">
                    You have spent {formatCurrency(b.spent, currency)} of{' '}
                    {formatCurrency(b.limit, currency)} limit ({b.percentUsed}%). Only{' '}
                    {formatCurrency(b.remaining, currency)} remaining.
                  </p>
                </div>
              </div>
              <button
                onClick={onOpenBudgetsModal}
                className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs font-semibold border border-amber-500/30 shrink-0 cursor-pointer"
              >
                Inspect
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Net Balance / Savings */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Current Net Balance
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <PiggyBank className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${netSavings >= 0 ? 'text-white' : 'text-rose-400'}`}>
              {formatCurrency(netSavings, currency)}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md font-semibold ${
                netSavings >= 0
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
              }`}>
                <Percent className="w-3 h-3" />
                {savingsRate}% Savings Rate
              </span>
              <span className="text-xs text-slate-400">Income minus Expenses</span>
            </div>
          </div>
        </div>

        {/* Total Monthly Income */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl group-hover:bg-teal-500/10 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Total Inflow (Income)
            </span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-teal-300 tracking-tight">
              {formatCurrency(totalIncome, currency)}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className="text-slate-300">
                Salary: {formatCurrency(salaryIncome, currency)}
              </span>
              <span>•</span>
              <span className="text-slate-300">
                Casual/Gigs: {formatCurrency(casualIncome, currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Total Monthly Expense */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Total Outflow (Expenses)
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-rose-400 tracking-tight">
              {formatCurrency(totalExpense, currency)}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
              <span>{budgetStatuses.length} budgeted categories</span>
              <span className={exceeded.length > 0 ? 'text-rose-400 font-medium' : 'text-slate-400'}>
                {exceeded.length} over limit
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
