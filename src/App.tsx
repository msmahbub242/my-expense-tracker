import React, { useState, useEffect, useMemo } from 'react';
import {
  CurrencyCode,
  Transaction,
  Category,
  Wallet,
  Budget,
  RecurringRule,
  TransactionType,
  RecurringFrequency,
} from './types/expense.ts';
import {
  calculateTotals,
  calculateCategoryExpenses,
  calculateBudgetStatuses,
  filterTransactions,
  recalculateWalletBalances,
  processRecurringRules,
  exportToCsv,
  generateMonthlySummary,
  convertCurrency,
} from './utils/calculations.ts';
import { storageService } from './services/storage.ts';
import { Navbar } from './components/Navbar.tsx';
import { BalanceCards } from './components/BalanceCards.tsx';
import { WalletOverview } from './components/WalletOverview.tsx';
import { VisualCharts } from './components/VisualCharts.tsx';
import { TransactionList } from './components/TransactionList.tsx';
import { TransactionModal } from './components/TransactionModal.tsx';
import { BudgetModal } from './components/BudgetModal.tsx';
import { CategoryModal } from './components/CategoryModal.tsx';
import { RecurringModal } from './components/RecurringModal.tsx';
import { WalletTransferModal } from './components/WalletTransferModal.tsx';
import { AddWalletModal } from './components/AddWalletModal.tsx';
import { CheckCircle2, RotateCcw } from 'lucide-react';

export default function App() {
  // 1. Core State
  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    storageService.getTransactions()
  );
  const [categories, setCategories] = useState<Category[]>(() =>
    storageService.getCategories()
  );
  const [initialWallets, setInitialWallets] = useState<Wallet[]>(() =>
    storageService.getWallets()
  );
  const [budgets, setBudgets] = useState<Budget[]>(() =>
    storageService.getBudgets()
  );
  const [recurringRules, setRecurringRules] = useState<RecurringRule[]>(() =>
    storageService.getRecurring()
  );
  const [activeCurrency, setActiveCurrency] = useState<CurrencyCode>(() =>
    storageService.getActiveCurrency()
  );

  // Month selector (defaults to current system month "YYYY-MM")
  const currentMonthStr = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }, []);

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);

  // 2. Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [selectedWalletFilter, setSelectedWalletFilter] = useState('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  // 3. Modal Dialog States
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isAddWalletModalOpen, setIsAddWalletModalOpen] = useState(false);

  // 4. Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync state changes with storage
  useEffect(() => {
    storageService.saveTransactions(transactions);
  }, [transactions]);

  useEffect(() => {
    storageService.saveCategories(categories);
  }, [categories]);

  useEffect(() => {
    storageService.saveWallets(initialWallets);
  }, [initialWallets]);

  useEffect(() => {
    storageService.saveBudgets(budgets);
  }, [budgets]);

  useEffect(() => {
    storageService.saveRecurring(recurringRules);
  }, [recurringRules]);

  useEffect(() => {
    storageService.saveActiveCurrency(activeCurrency);
  }, [activeCurrency]);

  // Dynamic wallet balances (calculated from initial balance plus income/expense deltas)
  const wallets = useMemo(() => {
    return recalculateWalletBalances(initialWallets, transactions);
  }, [initialWallets, transactions]);

  // Selected Month Transactions
  const monthTransactions = useMemo(() => {
    return transactions.filter((tx) => tx.date.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  // Totals for the selected month
  const monthTotals = useMemo(() => {
    return calculateTotals(monthTransactions, activeCurrency);
  }, [monthTransactions, activeCurrency]);

  // Casual vs Salary income breakdown
  const incomeBreakdown = useMemo(() => {
    let salary = 0;
    let casual = 0;
    for (const tx of monthTransactions) {
      if (tx.type === 'income') {
        const converted = convertCurrency(tx.amount, tx.currency, activeCurrency);
        if (tx.categoryId === 'cat-salary') {
          salary += converted;
        } else {
          casual += converted;
        }
      }
    }
    return { salary, casual };
  }, [monthTransactions, activeCurrency]);

  // Category expenses for charts
  const categoryExpenses = useMemo(() => {
    return calculateCategoryExpenses(monthTransactions, categories, activeCurrency);
  }, [monthTransactions, categories, activeCurrency]);

  // Budget statuses with 80% and 100% alerts
  const budgetStatuses = useMemo(() => {
    return calculateBudgetStatuses(
      transactions,
      budgets,
      categories,
      selectedMonth,
      activeCurrency
    );
  }, [transactions, budgets, categories, selectedMonth, activeCurrency]);

  // Filtered transactions for the ledger list
  const filteredTransactions = useMemo(() => {
    return filterTransactions(transactions, categories, wallets, {
      searchQuery,
      categoryId: selectedCategoryFilter,
      walletId: selectedWalletFilter,
      type: selectedTypeFilter,
      startDate: startDateFilter,
      endDate: endDateFilter,
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [
    transactions,
    categories,
    wallets,
    searchQuery,
    selectedCategoryFilter,
    selectedWalletFilter,
    selectedTypeFilter,
    startDateFilter,
    endDateFilter,
  ]);

  // Monthly summary insights
  const monthlySummary = useMemo(() => {
    return generateMonthlySummary(transactions, selectedMonth, categories, activeCurrency);
  }, [transactions, selectedMonth, categories, activeCurrency]);

  // Check how many recurring rules are due
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const dueRecurringCount = useMemo(() => {
    return recurringRules.filter((r) => r.active && r.nextDueDate <= todayStr).length;
  }, [recurringRules, todayStr]);

  // Handlers
  const handleSaveTransaction = (txData: {
    type: TransactionType;
    amount: number;
    currency: CurrencyCode;
    categoryId: string;
    walletId: string;
    date: string;
    notes: string;
    isRecurring: boolean;
    recurringFrequency?: RecurringFrequency;
  }) => {
    if (editingTransaction) {
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === editingTransaction.id
            ? {
                ...t,
                type: txData.type,
                amount: txData.amount,
                currency: txData.currency,
                categoryId: txData.categoryId,
                walletId: txData.walletId,
                date: txData.date,
                notes: txData.notes,
                isRecurring: txData.isRecurring,
              }
            : t
        )
      );
      showToast('Transaction updated successfully');
      setEditingTransaction(null);
    } else {
      const newTx: Transaction = {
        id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        type: txData.type,
        amount: txData.amount,
        currency: txData.currency,
        categoryId: txData.categoryId,
        walletId: txData.walletId,
        date: txData.date,
        notes: txData.notes,
        isRecurring: txData.isRecurring,
        createdAt: new Date().toISOString(),
      };
      setTransactions((prev) => [newTx, ...prev]);

      // If marked as recurring, also add a recurring rule
      if (txData.isRecurring) {
        const cat = categories.find((c) => c.id === txData.categoryId);
        const nextDate = new Date(txData.date);
        nextDate.setMonth(nextDate.getMonth() + 1);

        const newRule: RecurringRule = {
          id: `rec-${Date.now()}`,
          title: txData.notes || cat?.name || 'Recurring Item',
          type: txData.type,
          amount: txData.amount,
          currency: txData.currency,
          categoryId: txData.categoryId,
          walletId: txData.walletId,
          frequency: txData.recurringFrequency || 'monthly',
          dayOfMonth: new Date(txData.date).getDate(),
          nextDueDate: nextDate.toISOString().split('T')[0],
          active: true,
          notes: txData.notes,
        };
        setRecurringRules((prev) => [newRule, ...prev]);
        showToast('Transaction logged and recurring schedule created');
      } else {
        showToast(`${txData.type === 'income' ? 'Income' : 'Expense'} entry saved`);
      }
    }
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    showToast('Transaction deleted');
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsTxModalOpen(true);
  };

  const handleAddCategory = (categoryData: Omit<Category, 'id'>) => {
    const newCat: Category = {
      ...categoryData,
      id: `cat-custom-${Date.now()}`,
    };
    setCategories((prev) => [...prev, newCat]);
    showToast(`Added custom category: ${newCat.name}`);
  };

  const handleDeleteCategory = (categoryId: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== categoryId));
    showToast('Category deleted');
  };

  const handleSaveBudgets = (updatedBudgets: Budget[]) => {
    setBudgets(updatedBudgets);
    showToast('Category budget limits updated');
  };

  const handleAddRecurringRule = (ruleData: Omit<RecurringRule, 'id'>) => {
    const newRule: RecurringRule = {
      ...ruleData,
      id: `rec-${Date.now()}`,
    };
    setRecurringRules((prev) => [...prev, newRule]);
    showToast(`Recurring schedule "${newRule.title}" created`);
  };

  const handleToggleRecurringRule = (ruleId: string) => {
    setRecurringRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, active: !r.active } : r))
    );
  };

  const handleDeleteRecurringRule = (ruleId: string) => {
    setRecurringRules((prev) => prev.filter((r) => r.id !== ruleId));
    showToast('Recurring schedule removed');
  };

  const handleProcessDueRecurring = () => {
    const result = processRecurringRules(recurringRules, todayStr);
    if (result.dueTransactions.length === 0) {
      showToast('No recurring transactions are due right now.');
      return;
    }

    const createdTxs: Transaction[] = result.dueTransactions.map((item, idx) => ({
      ...item,
      id: `tx-rec-${Date.now()}-${idx}`,
      createdAt: new Date().toISOString(),
    }));

    setTransactions((prev) => [...createdTxs, ...prev]);
    setRecurringRules(result.updatedRules);
    showToast(`Logged ${createdTxs.length} automated recurring transaction(s)!`);
  };

  const handleWalletTransfer = (
    fromWalletId: string,
    toWalletId: string,
    amount: number,
    note: string
  ) => {
    const fromW = wallets.find((w) => w.id === fromWalletId);
    const toW = wallets.find((w) => w.id === toWalletId);

    // Create a paired transaction (transfer outflow from source, transfer inflow to destination)
    const outTx: Transaction = {
      id: `tx-tf-out-${Date.now()}`,
      type: 'expense',
      amount,
      currency: activeCurrency,
      categoryId: 'cat-bills', // or internal transfer
      walletId: fromWalletId,
      date: todayStr,
      notes: `Transfer to ${toW?.name || 'Wallet'}: ${note}`.trim(),
      createdAt: new Date().toISOString(),
    };

    const inTx: Transaction = {
      id: `tx-tf-in-${Date.now()}`,
      type: 'income',
      amount,
      currency: activeCurrency,
      categoryId: 'cat-casual-income',
      walletId: toWalletId,
      date: todayStr,
      notes: `Transfer from ${fromW?.name || 'Wallet'}: ${note}`.trim(),
      createdAt: new Date().toISOString(),
    };

    setTransactions((prev) => [outTx, inTx, ...prev]);
    showToast(`Transferred ${amount} ${activeCurrency} from ${fromW?.name} to ${toW?.name}`);
  };

  const handleAddWallet = (walletData: Omit<Wallet, 'id'>) => {
    const newWallet: Wallet = {
      ...walletData,
      id: `w-${Date.now()}`,
    };
    setInitialWallets((prev) => [...prev, newWallet]);
    showToast(`Account "${newWallet.name}" created`);
  };

  const handleExportCsv = () => {
    const csvData = exportToCsv(filteredTransactions, categories, wallets);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `spendwise_transactions_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Transactions exported to CSV!');
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategoryFilter('all');
    setSelectedWalletFilter('all');
    setSelectedTypeFilter('all');
    setStartDateFilter('');
    setEndDateFilter('');
  };

  const handleResetDemoData = () => {
    if (confirm('Reset application state back to clean default demo data?')) {
      storageService.resetToDefault();
      setTransactions(storageService.getTransactions());
      setCategories(storageService.getCategories());
      setInitialWallets(storageService.getWallets());
      setBudgets(storageService.getBudgets());
      setRecurringRules(storageService.getRecurring());
      setActiveCurrency(storageService.getActiveCurrency());
      showToast('Reset to default seed data');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-500 text-slate-950 px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs sm:text-sm font-bold animate-bounce">
          <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main App Bar */}
      <Navbar
        activeCurrency={activeCurrency}
        onCurrencyChange={setActiveCurrency}
        onOpenAddModal={() => {
          setEditingTransaction(null);
          setIsTxModalOpen(true);
        }}
        onOpenCategoriesModal={() => setIsCategoryModalOpen(true)}
        onOpenBudgetsModal={() => setIsBudgetModalOpen(true)}
        onOpenRecurringModal={() => setIsRecurringModalOpen(true)}
        onExportCsv={handleExportCsv}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
      />

      {/* Main Content Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* 1. Core Balance & Inflow/Outflow Cards + Budget Warning Alerts */}
        <BalanceCards
          totalIncome={monthTotals.totalIncome}
          totalExpense={monthTotals.totalExpense}
          netSavings={monthTotals.netSavings}
          savingsRate={monthTotals.savingsRate}
          currency={activeCurrency}
          budgetStatuses={budgetStatuses}
          onOpenBudgetsModal={() => setIsBudgetModalOpen(true)}
          salaryIncome={incomeBreakdown.salary}
          casualIncome={incomeBreakdown.casual}
        />

        {/* 2. Multiple Wallets Overview (Cash, Bank, bKash/Nagad) */}
        <WalletOverview
          wallets={wallets}
          activeCurrency={activeCurrency}
          onOpenTransferModal={() => setIsTransferModalOpen(true)}
          onOpenAddWalletModal={() => setIsAddWalletModalOpen(true)}
        />

        {/* 3. Visual Charts: Spending by Category & Budget Guardrails */}
        <VisualCharts
          categoryExpenses={categoryExpenses}
          budgetStatuses={budgetStatuses}
          currency={activeCurrency}
          onOpenBudgetsModal={() => setIsBudgetModalOpen(true)}
          totalExpense={monthTotals.totalExpense}
        />

        {/* 4. Transaction List with Search & Advanced Filters */}
        <TransactionList
          transactions={transactions}
          filteredTransactions={filteredTransactions}
          categories={categories}
          wallets={wallets}
          currency={activeCurrency}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategoryFilter}
          onCategoryFilterChange={setSelectedCategoryFilter}
          selectedWallet={selectedWalletFilter}
          onWalletFilterChange={setSelectedWalletFilter}
          selectedType={selectedTypeFilter}
          onTypeFilterChange={setSelectedTypeFilter}
          startDate={startDateFilter}
          onStartDateChange={setStartDateFilter}
          endDate={endDateFilter}
          onEndDateChange={setEndDateFilter}
          onResetFilters={handleResetFilters}
          onEditTransaction={handleEditTransaction}
          onDeleteTransaction={handleDeleteTransaction}
          monthlySummary={monthlySummary}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            SpendWise • Personal Expense & Income Tracker
          </p>
          <div className="flex items-center gap-4">
            <button
              onClick={handleResetDemoData}
              className="flex items-center gap-1 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Demo Data
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => {
          setIsTxModalOpen(false);
          setEditingTransaction(null);
        }}
        onSave={handleSaveTransaction}
        categories={categories}
        wallets={wallets}
        activeCurrency={activeCurrency}
        onOpenCategoriesModal={() => setIsCategoryModalOpen(true)}
        initialData={editingTransaction}
      />

      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        categories={categories}
        budgets={budgets}
        budgetStatuses={budgetStatuses}
        currency={activeCurrency}
        selectedMonth={selectedMonth}
        onSaveBudgets={handleSaveBudgets}
      />

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        onAddCategory={handleAddCategory}
        onDeleteCategory={handleDeleteCategory}
      />

      <RecurringModal
        isOpen={isRecurringModalOpen}
        onClose={() => setIsRecurringModalOpen(false)}
        recurringRules={recurringRules}
        categories={categories}
        wallets={wallets}
        currency={activeCurrency}
        onAddRule={handleAddRecurringRule}
        onToggleRule={handleToggleRecurringRule}
        onDeleteRule={handleDeleteRecurringRule}
        onProcessDue={handleProcessDueRecurring}
        dueCount={dueRecurringCount}
      />

      <WalletTransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        wallets={wallets}
        currency={activeCurrency}
        onTransfer={handleWalletTransfer}
      />

      <AddWalletModal
        isOpen={isAddWalletModalOpen}
        onClose={() => setIsAddWalletModalOpen(false)}
        currency={activeCurrency}
        onAddWallet={handleAddWallet}
      />
    </div>
  );
}
