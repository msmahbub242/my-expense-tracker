import React from 'react';
import {
  WalletCards,
  Plus,
  Download,
  Calendar,
  Layers,
  Repeat,
  Lock,
  Cloud,
  Shield,
} from 'lucide-react';
import { CurrencyCode } from '../types/expense.ts';
import { SUPPORTED_CURRENCIES } from '../utils/calculations.ts';

interface NavbarProps {
  activeCurrency: CurrencyCode;
  onCurrencyChange: (code: CurrencyCode) => void;
  onOpenAddModal: () => void;
  onOpenCategoriesModal: () => void;
  onOpenBudgetsModal: () => void;
  onOpenRecurringModal: () => void;
  onOpenSecurityModal: () => void;
  onExportCsv: () => void;
  onLockApp: () => void;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  isCloudSynced?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeCurrency,
  onCurrencyChange,
  onOpenAddModal,
  onOpenCategoriesModal,
  onOpenBudgetsModal,
  onOpenRecurringModal,
  onOpenSecurityModal,
  onExportCsv,
  onLockApp,
  selectedMonth,
  onMonthChange,
  isCloudSynced = true,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <WalletCards className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                SpendWise <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-medium border border-emerald-500/30">Pro</span>
              </span>
              <p className="text-xs text-slate-400 hidden sm:block">Personal Expense & Income Tracker</p>
            </div>
          </div>

          {/* Center Navigation Shortcuts */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-800/60 p-1 rounded-xl border border-slate-700/60 text-xs font-medium">
            <button
              onClick={onOpenBudgetsModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              Budgets & Limits
            </button>
            <button
              onClick={onOpenCategoriesModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              Categories
            </button>
            <button
              onClick={onOpenRecurringModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <Repeat className="w-3.5 h-3.5 text-purple-400" />
              Recurring Bills
            </button>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Month Selector */}
            <div className="hidden md:flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-700 text-xs">
              <span className="text-slate-400">Month:</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => onMonthChange(e.target.value)}
                className="bg-transparent text-white focus:outline-none cursor-pointer font-medium"
              />
            </div>

            {/* Currency Switcher */}
            <div className="flex items-center bg-slate-800 rounded-xl border border-slate-700 p-0.5 text-xs font-semibold">
              {(Object.keys(SUPPORTED_CURRENCIES) as CurrencyCode[]).map((cur) => (
                <button
                  key={cur}
                  onClick={() => onCurrencyChange(cur)}
                  className={`px-2.5 py-1.5 rounded-lg transition-all ${
                    activeCurrency === cur
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title={`${SUPPORTED_CURRENCIES[cur].name} (${SUPPORTED_CURRENCIES[cur].symbol})`}
                >
                  {SUPPORTED_CURRENCIES[cur].symbol} {cur}
                </button>
              ))}
            </div>

            {/* Export CSV button */}
            <button
              onClick={onExportCsv}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Export Transactions to CSV"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            {/* Vault Security Settings CTA */}
            <button
              onClick={onOpenSecurityModal}
              className="p-2 sm:px-2.5 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Vault Security & PIN Settings"
            >
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">PIN Settings</span>
            </button>

            {/* Lock App CTA */}
            <button
              onClick={onLockApp}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 hover:border-amber-500/40 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Lock App with PIN Code"
            >
              <Lock className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Lock</span>
            </button>

            {/* Add Transaction CTA */}
            <button
              onClick={onOpenAddModal}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-semibold text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Log Entry</span>
            </button>
          </div>
        </div>

        {/* Mobile Submenu Bar */}
        <div className="flex lg:hidden items-center justify-between py-2 border-t border-slate-800/80 text-xs overflow-x-auto gap-2">
          <button
            onClick={onOpenBudgetsModal}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-300 shrink-0"
          >
            <Calendar className="w-3 h-3 text-amber-400" />
            Budgets
          </button>
          <button
            onClick={onOpenCategoriesModal}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-300 shrink-0"
          >
            <Layers className="w-3 h-3 text-cyan-400" />
            Categories
          </button>
          <button
            onClick={onOpenRecurringModal}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-300 shrink-0 cursor-pointer"
          >
            <Repeat className="w-3 h-3 text-purple-400" />
            Recurring
          </button>
          <button
            onClick={onOpenSecurityModal}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 text-emerald-300 border border-emerald-500/30 shrink-0 cursor-pointer"
          >
            <Shield className="w-3 h-3 text-emerald-400" />
            PIN Settings
          </button>
          <button
            onClick={onLockApp}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0 cursor-pointer"
          >
            <Lock className="w-3 h-3" />
            Lock App
          </button>
        </div>
      </div>
    </header>
  );
};
