import React, { useState } from 'react';
import {
  WalletCards,
  Plus,
  Download,
  Calendar,
  Layers,
  Repeat,
  Lock,
  Shield,
  Menu,
  X,
  ChevronDown,
  Globe,
  FileSpreadsheet,
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleMobileNavClick = (action: () => void) => {
    action();
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <WalletCards className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-1">
                SpendWise <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-medium border border-emerald-500/30">Pro</span>
              </span>
              <p className="text-[11px] text-slate-400 hidden md:block">Personal Expense & Income Tracker</p>
            </div>
          </div>

          {/* Desktop Center Navigation Shortcuts */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-800/60 p-1 rounded-xl border border-slate-700/60 text-xs font-medium">
            <button
              onClick={onOpenBudgetsModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              Budgets & Limits
            </button>
            <button
              onClick={onOpenCategoriesModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
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

          {/* Right Actions & Mobile Toggle */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Desktop Month Selector */}
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
                  className={`px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-lg transition-all text-[11px] sm:text-xs ${
                    activeCurrency === cur
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title={`${SUPPORTED_CURRENCIES[cur].name} (${SUPPORTED_CURRENCIES[cur].symbol})`}
                >
                  {SUPPORTED_CURRENCIES[cur].symbol} <span className="hidden xs:inline">{cur}</span>
                </button>
              ))}
            </div>

            {/* Desktop Export CSV */}
            <button
              onClick={onExportCsv}
              className="hidden sm:flex p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium items-center gap-1.5 transition-colors cursor-pointer"
              title="Export Transactions to CSV"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span className="hidden md:inline">Export CSV</span>
            </button>

            {/* Desktop Vault Security Settings */}
            <button
              onClick={onOpenSecurityModal}
              className="hidden sm:flex p-2 sm:px-2.5 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium items-center gap-1.5 transition-colors cursor-pointer"
              title="Vault Security & PIN Settings"
            >
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="hidden md:inline">PIN Settings</span>
            </button>

            {/* Desktop Lock CTA */}
            <button
              onClick={onLockApp}
              className="hidden sm:flex p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 hover:border-amber-500/40 text-xs font-medium items-center gap-1.5 transition-colors cursor-pointer"
              title="Lock App with PIN Code"
            >
              <Lock className="w-4 h-4 text-amber-400" />
              <span className="hidden md:inline">Lock</span>
            </button>

            {/* Add Transaction CTA */}
            <button
              onClick={onOpenAddModal}
              className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-1 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span className="hidden xs:inline">Log Entry</span>
              <span className="xs:hidden">Log</span>
            </button>

            {/* Mobile Menu Hamburger Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5 text-emerald-400" /> : <Menu className="w-5 h-5 text-slate-200" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer / Slide-down Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-slate-900 border-b border-slate-800 shadow-2xl animate-fadeIn">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
            {/* Month Selector in Mobile Menu */}
            <div className="flex items-center justify-between bg-slate-800/90 p-3 rounded-2xl border border-slate-700">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-400" /> Selected Month:
              </span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => onMonthChange(e.target.value)}
                className="bg-slate-900 text-emerald-400 font-bold text-xs px-3 py-1.5 rounded-xl border border-slate-700 focus:outline-none cursor-pointer"
              />
            </div>

            {/* Core Features Section */}
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 px-1">Features & Tools</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleMobileNavClick(onOpenBudgetsModal)}
                  className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700/80 text-left transition-colors"
                >
                  <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Budgets & Limits</span>
                </button>

                <button
                  onClick={() => handleMobileNavClick(onOpenCategoriesModal)}
                  className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700/80 text-left transition-colors"
                >
                  <Layers className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Categories</span>
                </button>

                <button
                  onClick={() => handleMobileNavClick(onOpenRecurringModal)}
                  className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700/80 text-left transition-colors"
                >
                  <Repeat className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Recurring Bills</span>
                </button>

                <button
                  onClick={() => handleMobileNavClick(onExportCsv)}
                  className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700/80 text-left transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Security & Vault Section */}
            <div className="pt-2 border-t border-slate-800/80">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 px-1">Security & Vault</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleMobileNavClick(onOpenSecurityModal)}
                  className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold text-left transition-colors"
                >
                  <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>PIN Settings</span>
                </button>

                <button
                  onClick={() => handleMobileNavClick(onLockApp)}
                  className="flex items-center gap-2.5 p-3 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold text-left transition-colors"
                >
                  <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Lock Vault</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
