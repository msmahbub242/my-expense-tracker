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
import { getOrCreateUserId, validateFirestoreConnection } from './services/firebase.ts';
import { firestoreStorage } from './services/firestoreStorage.ts';
import { getPinConfig, PinData } from './services/pinService.ts';
import {
  INITIAL_CATEGORIES,
  INITIAL_WALLETS,
  INITIAL_BUDGETS,
  INITIAL_RECURRING,
  INITIAL_TRANSACTIONS,
} from './services/storage.ts';
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
import { EditWalletModal } from './components/EditWalletModal.tsx';
import { SecuritySettingsModal } from './components/SecuritySettingsModal.tsx';
import { PinLockScreen } from './components/PinLockScreen.tsx';
import { CheckCircle2, RotateCcw, Cloud, ShieldCheck, Shield } from 'lucide-react';

export default function App() {
  // 1. Firebase & PIN Security State
  const [userId, setUserId] = useState<string>('');
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [pinConfig, setPinConfig] = useState<PinData | null>(null);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(true);

  // 2. Data State
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [initialWallets, setInitialWallets] = useState<Wallet[]>(INITIAL_WALLETS);
  const [budgets, setBudgets] = useState<Budget[]>(INITIAL_BUDGETS);
  const [recurringRules, setRecurringRules] = useState<RecurringRule[]>(INITIAL_RECURRING);
  const [activeCurrency, setActiveCurrency] = useState<CurrencyCode>('BDT');

  // Month selector
  const currentMonthStr = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }, []);

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);

  // 3. Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [selectedWalletFilter, setSelectedWalletFilter] = useState('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  // 4. Modal Dialog States
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isAddWalletModalOpen, setIsAddWalletModalOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);

  // 5. Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Initialize Firebase User & Real-Time Firestore Sync
  useEffect(() => {
    let unsubscribeSync: (() => void) | undefined;

    async function initFirebase() {
      try {
        setIsAuthLoading(true);
        const uid = getOrCreateUserId();
        setUserId(uid);

        await validateFirestoreConnection();

        // Check if user has a configured PIN in Firestore
        const pinData = await getPinConfig(uid);
        setPinConfig(pinData);

        // Seed initial collections in Firestore if empty
        await firestoreStorage.initializeUserCollectionsIfEmpty(uid);

        // Subscribe to real-time updates from Firestore
        unsubscribeSync = firestoreStorage.subscribeToAllUserData(uid, {
          onTransactions: (txs) => setTransactions(txs),
          onCategories: (cats) => setCategories(cats),
          onWallets: (w) => setInitialWallets(w),
          onBudgets: (b) => setBudgets(b),
          onRecurring: (r) => setRecurringRules(r),
          onCurrency: (cur) => setActiveCurrency(cur),
        });

        setIsCloudSynced(true);
      } catch (err) {
        console.error('Firebase initialization error:', err);
        showToast('Connecting to Firebase...');
      } finally {
        setIsAuthLoading(false);
      }
    }

    initFirebase();

    return () => {
      if (unsubscribeSync) unsubscribeSync();
    };
  }, []);

  // Dynamic wallet balances
  const wallets = useMemo(() => {
    return recalculateWalletBalances(initialWallets, transactions);
  }, [initialWallets, transactions]);

  // Selected Month Transactions
  const monthTransactions = useMemo(() => {
    return transactions.filter((tx) => tx.date.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  // Totals for selected month
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

  // Handlers synced with Firebase
  const handleSaveTransaction = async (txData: {
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
    if (!userId) return;

    if (editingTransaction) {
      const updatedTx: Transaction = {
        ...editingTransaction,
        type: txData.type,
        amount: txData.amount,
        currency: txData.currency,
        categoryId: txData.categoryId,
        walletId: txData.walletId,
        date: txData.date,
        notes: txData.notes,
        isRecurring: txData.isRecurring,
      };
      await firestoreStorage.saveTransaction(userId, updatedTx);
      showToast('Transaction updated in Cloud Firestore');
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
      await firestoreStorage.saveTransaction(userId, newTx);

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
        await firestoreStorage.saveRecurringRule(userId, newRule);
        showToast('Saved to Firebase and recurring schedule created');
      } else {
        showToast(`${txData.type === 'income' ? 'Income' : 'Expense'} saved to Firebase`);
      }
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!userId) return;
    await firestoreStorage.deleteTransaction(userId, id);
    showToast('Transaction deleted from Cloud Firestore');
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsTxModalOpen(true);
  };

  const handleAddCategory = async (categoryData: Omit<Category, 'id'>) => {
    if (!userId) return;
    const newCat: Category = {
      ...categoryData,
      id: `cat-custom-${Date.now()}`,
    };
    await firestoreStorage.saveCategory(userId, newCat);
    showToast(`Added category: ${newCat.name}`);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!userId) return;
    await firestoreStorage.deleteCategory(userId, categoryId);
    showToast('Category deleted from Cloud Firestore');
  };

  const handleSaveBudgets = async (updatedBudgets: Budget[]) => {
    if (!userId) return;
    await firestoreStorage.saveBudgets(userId, updatedBudgets);
    showToast('Budget limits saved to Cloud Firestore');
  };

  const handleAddRecurringRule = async (ruleData: Omit<RecurringRule, 'id'>) => {
    if (!userId) return;
    const newRule: RecurringRule = {
      ...ruleData,
      id: `rec-${Date.now()}`,
    };
    await firestoreStorage.saveRecurringRule(userId, newRule);
    showToast(`Recurring schedule "${newRule.title}" created in Firebase`);
  };

  const handleToggleRecurringRule = async (ruleId: string) => {
    if (!userId) return;
    const rule = recurringRules.find((r) => r.id === ruleId);
    if (rule) {
      const updated = { ...rule, active: !rule.active };
      await firestoreStorage.saveRecurringRule(userId, updated);
    }
  };

  const handleDeleteRecurringRule = async (ruleId: string) => {
    if (!userId) return;
    await firestoreStorage.deleteRecurringRule(userId, ruleId);
    showToast('Recurring schedule removed from Cloud Firestore');
  };

  const handleProcessDueRecurring = async () => {
    if (!userId) return;
    const result = processRecurringRules(recurringRules, todayStr);
    if (result.dueTransactions.length === 0) {
      showToast('No recurring transactions are due right now.');
      return;
    }

    for (let idx = 0; idx < result.dueTransactions.length; idx++) {
      const item = result.dueTransactions[idx];
      const createdTx: Transaction = {
        ...item,
        id: `tx-rec-${Date.now()}-${idx}`,
        createdAt: new Date().toISOString(),
      };
      await firestoreStorage.saveTransaction(userId, createdTx);
    }

    for (const rule of result.updatedRules) {
      await firestoreStorage.saveRecurringRule(userId, rule);
    }

    showToast(`Logged ${result.dueTransactions.length} recurring item(s) to Firebase!`);
  };

  const handleWalletTransfer = async (
    fromWalletId: string,
    toWalletId: string,
    amount: number,
    note: string
  ) => {
    if (!userId) return;
    const fromW = wallets.find((w) => w.id === fromWalletId);
    const toW = wallets.find((w) => w.id === toWalletId);

    const outTx: Transaction = {
      id: `tx-tf-out-${Date.now()}`,
      type: 'expense',
      amount,
      currency: activeCurrency,
      categoryId: 'cat-bills',
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

    await firestoreStorage.saveTransaction(userId, outTx);
    await firestoreStorage.saveTransaction(userId, inTx);
    showToast(`Transferred ${amount} ${activeCurrency} in Cloud Firestore`);
  };

  const handleAddWallet = async (walletData: Omit<Wallet, 'id'>) => {
    if (!userId) return;
    const newWallet: Wallet = {
      ...walletData,
      id: `w-${Date.now()}`,
    };
    await firestoreStorage.saveWallet(userId, newWallet);
    showToast(`Account "${newWallet.name}" created in Firebase`);
  };

  const handleSaveWallet = async (updatedWallet: Wallet) => {
    if (!userId) return;
    await firestoreStorage.saveWallet(userId, updatedWallet);
    showToast(`Saved balance for "${updatedWallet.name}" in Cloud Firestore`);
  };

  const handleDeleteWallet = async (walletId: string) => {
    if (!userId) return;
    await firestoreStorage.deleteWallet(userId, walletId);
    showToast('Wallet removed from Cloud Firestore');
  };

  const handleResetAllWalletsToZero = async () => {
    if (!userId) return;
    if (confirm('Set all wallet balances to 0 BDT and clear transactions for a clean start?')) {
      await firestoreStorage.resetAllWalletsToZero(userId);
      showToast('All wallets reset to 0 BDT. You can now log your real transactions!');
    }
  };

  const handleCurrencyChange = async (code: CurrencyCode) => {
    setActiveCurrency(code);
    if (userId) {
      await firestoreStorage.saveActiveCurrency(userId, code);
    }
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

  const handleResetDemoData = async () => {
    if (!userId) return;
    if (confirm('Reset all Firebase Firestore data back to clean defaults?')) {
      await firestoreStorage.resetUserData(userId);
      showToast('Reset Firebase data to defaults');
    }
  };

  const handleLockApp = () => {
    setIsUnlocked(false);
  };

  // Loading Screen while connecting to Firebase
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-slate-100 font-sans">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center animate-pulse mb-4">
          <Cloud className="w-7 h-7 text-emerald-400" />
        </div>
        <h3 className="text-base font-bold text-white">Connecting to Google Cloud Firestore</h3>
        <p className="text-xs text-slate-400 mt-1">Initializing secure database & PIN protection...</p>
      </div>
    );
  }

  // PIN Lock Screen (if locked or first-time PIN setup)
  if (!isUnlocked) {
    return (
      <PinLockScreen
        userId={userId}
        pinConfig={pinConfig}
        onUnlocked={() => setIsUnlocked(true)}
        onPinConfigUpdated={(newCfg) => setPinConfig(newCfg)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-500 text-slate-950 px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs sm:text-sm font-bold animate-bounce">
          <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main App Bar with Lock Button & Cloud Indicator */}
      <Navbar
        activeCurrency={activeCurrency}
        onCurrencyChange={handleCurrencyChange}
        onOpenAddModal={() => {
          setEditingTransaction(null);
          setIsTxModalOpen(true);
        }}
        onOpenCategoriesModal={() => setIsCategoryModalOpen(true)}
        onOpenBudgetsModal={() => setIsBudgetModalOpen(true)}
        onOpenRecurringModal={() => setIsRecurringModalOpen(true)}
        onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
        onExportCsv={handleExportCsv}
        onLockApp={handleLockApp}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        isCloudSynced={isCloudSynced}
      />

      {/* Main Content Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Firebase Cloud Sync & PIN Protection Banner */}
        <div className="px-4 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <Cloud className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold">Personal Vault (owner_vault) Connected:</span>
            <span className="text-emerald-200/80 hidden sm:inline">
              Your data is securely stored in Google Cloud Firestore.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSecurityModalOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 font-semibold border border-emerald-500/30 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Shield className="w-3.5 h-3.5" />
              PIN Settings
            </button>
            <button
              onClick={handleLockApp}
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold border border-amber-500/30 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              Lock Vault
            </button>
          </div>
        </div>

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
          onEditWallet={(w) => setEditingWallet(w)}
          onResetAllWalletsToZero={handleResetAllWalletsToZero}
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
          <p>SpendWise • Personal Expense & Income Tracker • Google Cloud Firebase</p>
          <div className="flex items-center gap-4">
            <button
              onClick={handleLockApp}
              className="text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
            >
              Lock App Now
            </button>
            <span>•</span>
            <button
              onClick={handleResetDemoData}
              className="flex items-center gap-1 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Cloud Data
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

      <EditWalletModal
        isOpen={editingWallet !== null}
        onClose={() => setEditingWallet(null)}
        wallet={editingWallet}
        currency={activeCurrency}
        onSave={handleSaveWallet}
        onDelete={handleDeleteWallet}
      />

      <SecuritySettingsModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
        userId={userId}
        pinConfig={pinConfig}
        onPinConfigUpdated={(newCfg) => setPinConfig(newCfg)}
      />
    </div>
  );
}
