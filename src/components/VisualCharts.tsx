import React, { useState } from 'react';
import {
  PieChart as PieIcon,
  BarChart3,
  SlidersHorizontal,
  ChevronRight,
  TrendingDown,
} from 'lucide-react';
import { Category, CurrencyCode, BudgetStatus } from '../types/expense.ts';
import { formatCurrency } from '../utils/calculations.ts';
import { CategoryIcon } from './CategoryIcon.tsx';

interface VisualChartsProps {
  categoryExpenses: {
    categoryId: string;
    categoryName: string;
    color: string;
    icon: string;
    totalAmount: number;
    percentage: number;
  }[];
  budgetStatuses: BudgetStatus[];
  currency: CurrencyCode;
  onOpenBudgetsModal: () => void;
  totalExpense: number;
}

export const VisualCharts: React.FC<VisualChartsProps> = ({
  categoryExpenses,
  budgetStatuses,
  currency,
  onOpenBudgetsModal,
  totalExpense,
}) => {
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number | null>(null);

  // Calculate SVG Pie / Donut slices
  let cumulativeAngle = 0;
  const radius = 68;
  const strokeWidth = 24;
  const center = 100;
  const circumference = 2 * Math.PI * radius;

  const donutSlices = categoryExpenses.map((cat, index) => {
    const strokeDasharray = `${(cat.percentage / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -cumulativeAngle;
    cumulativeAngle += (cat.percentage / 100) * circumference;

    return {
      ...cat,
      index,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  const highlightedCategory =
    activeSegmentIndex !== null && categoryExpenses[activeSegmentIndex]
      ? categoryExpenses[activeSegmentIndex]
      : categoryExpenses[0] || null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* 1. Spending Breakdown (Donut Chart & Legend) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-cyan-400" />
                Spending by Category
              </h3>
              <p className="text-xs text-slate-400">
                Visual breakdown of total outflows this month
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
              Total: {formatCurrency(totalExpense, currency)}
            </span>
          </div>

          {categoryExpenses.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <PieIcon className="w-10 h-10 text-slate-600 mb-2 stroke-1" />
              <p className="text-sm font-medium">No expenses logged for this month</p>
              <p className="text-xs text-slate-500 mt-1">
                Log your first expense to see the visual breakdown chart.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center pt-2">
              {/* Donut Chart SVG */}
              <div className="sm:col-span-6 flex flex-col items-center justify-center relative">
                <div className="relative w-48 h-48">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
                    <circle
                      cx={center}
                      cy={center}
                      r={radius}
                      fill="transparent"
                      stroke="#1e293b"
                      strokeWidth={strokeWidth}
                    />
                    {donutSlices.map((slice) => (
                      <circle
                        key={slice.categoryId}
                        cx={center}
                        cy={center}
                        r={radius}
                        fill="transparent"
                        stroke={slice.color}
                        strokeWidth={
                          activeSegmentIndex === slice.index ? strokeWidth + 4 : strokeWidth
                        }
                        strokeDasharray={slice.strokeDasharray}
                        strokeDashoffset={slice.strokeDashoffset}
                        className="transition-all duration-300 cursor-pointer hover:opacity-90"
                        onMouseEnter={() => setActiveSegmentIndex(slice.index)}
                        onMouseLeave={() => setActiveSegmentIndex(null)}
                      />
                    ))}
                  </svg>

                  {/* Center Text inside Donut */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
                    {highlightedCategory ? (
                      <>
                        <span className="text-xs font-medium text-slate-400 truncate max-w-[110px]">
                          {highlightedCategory.categoryName}
                        </span>
                        <span className="text-sm font-bold text-white mt-0.5">
                          {formatCurrency(highlightedCategory.totalAmount, currency)}
                        </span>
                        <span
                          className="text-[11px] font-semibold mt-0.5 px-1.5 py-0.2 rounded"
                          style={{
                            color: highlightedCategory.color,
                            backgroundColor: `${highlightedCategory.color}20`,
                          }}
                        >
                          {highlightedCategory.percentage}%
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-xs text-slate-400">Total</span>
                        <span className="text-sm font-bold text-white">
                          {formatCurrency(totalExpense, currency)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">Hover arcs to inspect share</p>
              </div>

              {/* Category Legend List */}
              <div className="sm:col-span-6 space-y-2 max-h-56 overflow-y-auto pr-1">
                {categoryExpenses.map((cat, idx) => (
                  <div
                    key={cat.categoryId}
                    onMouseEnter={() => setActiveSegmentIndex(idx)}
                    onMouseLeave={() => setActiveSegmentIndex(null)}
                    className={`flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer ${
                      activeSegmentIndex === idx
                        ? 'bg-slate-800 border border-slate-700'
                        : 'bg-slate-800/40 hover:bg-slate-800/80 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-xs font-medium text-slate-200 truncate">
                        {cat.categoryName}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-white">
                        {formatCurrency(cat.totalAmount, currency)}
                      </div>
                      <div className="text-[10px] text-slate-400">{cat.percentage}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Budget vs Actual Limits Tracking with 80% & 100% warnings */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-400" />
                Category Budgets & Thresholds
              </h3>
              <p className="text-xs text-slate-400">
                Warnings trigger at 80% and critical alerts at 100%
              </p>
            </div>
            <button
              onClick={onOpenBudgetsModal}
              className="flex items-center gap-1 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Adjust Limits
            </button>
          </div>

          {budgetStatuses.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <SlidersHorizontal className="w-10 h-10 text-slate-600 mb-2 stroke-1" />
              <p className="text-sm font-medium">No category spending limits set</p>
              <button
                onClick={onOpenBudgetsModal}
                className="mt-3 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold"
              >
                Set Category Budgets
              </button>
            </div>
          ) : (
            <div className="space-y-4 max-h-[290px] overflow-y-auto pr-1">
              {budgetStatuses.map((budget) => {
                const isOver = budget.status === 'exceeded';
                const isWarning = budget.status === 'warning';

                return (
                  <div
                    key={budget.categoryId}
                    className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 transition-all"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-white"
                          style={{ backgroundColor: budget.color }}
                        >
                          <CategoryIcon name={budget.categoryIcon} className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-semibold text-white">
                          {budget.categoryName}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-300 font-medium">
                          {formatCurrency(budget.spent, currency)} /{' '}
                          <span className="text-slate-400">
                            {formatCurrency(budget.limit, currency)}
                          </span>
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            isOver
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : isWarning
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {budget.percentUsed}%
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar with 80% mark indicator */}
                    <div className="relative w-full h-2.5 bg-slate-700 rounded-full overflow-hidden">
                      {/* 80% marker line */}
                      <div className="absolute top-0 bottom-0 left-[80%] w-0.5 bg-slate-900/80 z-10" />
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isOver
                            ? 'bg-rose-500'
                            : isWarning
                            ? 'bg-amber-400'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, budget.percentUsed)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between mt-1 text-[11px]">
                      <span className="text-slate-400">
                        {isOver
                          ? `Over budget by ${formatCurrency(Math.abs(budget.remaining), currency)}`
                          : `${formatCurrency(budget.remaining, currency)} remaining`}
                      </span>
                      <span
                        className={`font-semibold ${
                          isOver
                            ? 'text-rose-400'
                            : isWarning
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {isOver ? 'Exceeded' : isWarning ? 'Warning (80%+)' : 'Safe'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
