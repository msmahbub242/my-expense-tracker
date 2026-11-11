import React, { useState } from 'react';
import { X, SlidersHorizontal, AlertTriangle, ShieldCheck, Plus, Check } from 'lucide-react';
import { Category, Budget, CurrencyCode, BudgetStatus } from '../types/expense.ts';
import { formatCurrency } from '../utils/calculations.ts';
import { CategoryIcon } from './CategoryIcon.tsx';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  budgets: Budget[];
  budgetStatuses: BudgetStatus[];
  currency: CurrencyCode;
  selectedMonth: string;
  onSaveBudgets: (updatedBudgets: Budget[]) => void;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  categories,
  budgets,
  budgetStatuses,
  currency,
  selectedMonth,
  onSaveBudgets,
}) => {
  const expenseCategories = categories.filter((c) => c.type === 'expense' || c.type === 'both');

  // Local state initialized with current budgets
  const [budgetMap, setBudgetMap] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    for (const b of budgets) {
      map[b.categoryId] = b.limitAmount;
    }
    return map;
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleLimitChange = (categoryId: string, val: string) => {
    const parsed = parseFloat(val);
    setBudgetMap((prev) => ({
      ...prev,
      [categoryId]: isNaN(parsed) ? 0 : parsed,
    }));
  };

  const handleSave = () => {
    const updated: Budget[] = [];
    for (const cat of expenseCategories) {
      const limit = budgetMap[cat.id] || 0;
      if (limit > 0) {
        updated.push({
          id: `b-${cat.id}-${selectedMonth}`,
          categoryId: cat.id,
          limitAmount: limit,
          monthYear: selectedMonth,
        });
      }
    }
    onSaveBudgets(updated);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Monthly Budget Limits</h3>
              <p className="text-xs text-slate-400">
                Set category limits ({selectedMonth}). Alerts trigger at 80% & 100%.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close budget modal"
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="p-4 mx-6 mt-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
          <div>
            <span className="font-bold">Automated Guardrails:</span>
            <p className="text-amber-200/80 mt-0.5">
              • Yellow Warning: Triggered automatically when monthly spending reaches 80% of limit.
              <br />• Red Alert: Triggered when spending exceeds 100% of your allocated budget.
            </p>
          </div>
        </div>

        {/* Category Limits List */}
        <div className="p-6 space-y-3.5 max-h-[380px] overflow-y-auto">
          {expenseCategories.map((cat) => {
            const currentLimit = budgetMap[cat.id] ?? '';
            const status = budgetStatuses.find((s) => s.categoryId === cat.id);

            return (
              <div
                key={cat.id}
                className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 hover:border-slate-600 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0"
                    style={{ backgroundColor: `${cat.color}25`, color: cat.color }}
                  >
                    <CategoryIcon name={cat.icon} className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">{cat.name}</h4>
                    <p className="text-xs text-slate-400">
                      Spent this month:{' '}
                      <span className="font-semibold text-slate-200">
                        {status ? formatCurrency(status.spent, currency) : formatCurrency(0, currency)}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <span className="text-xs text-slate-400 font-semibold">{currency} Limit:</span>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    placeholder="0"
                    value={currentLimit}
                    onChange={(e) => handleLimitChange(cat.id, e.target.value)}
                    className="w-28 sm:w-32 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-right font-bold text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-end gap-3 bg-slate-900/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={savedSuccess}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                Saved!
              </>
            ) : (
              'Save Budget Limits'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
