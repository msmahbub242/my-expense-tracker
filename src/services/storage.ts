import {
  Category,
  Wallet,
  Budget,
  Transaction,
  RecurringRule,
  CurrencyCode,
} from '../types/expense.ts';

const STORAGE_KEYS = {
  TRANSACTIONS: 'pet_transactions_v1',
  CATEGORIES: 'pet_categories_v1',
  WALLETS: 'pet_wallets_v1',
  BUDGETS: 'pet_budgets_v1',
  RECURRING: 'pet_recurring_v1',
  ACTIVE_CURRENCY: 'pet_active_currency_v1',
};

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-food', name: 'Food & Dining', icon: 'Utensils', color: '#f59e0b', type: 'expense' },
  { id: 'cat-rent', name: 'Rent & Housing', icon: 'Home', color: '#ef4444', type: 'expense' },
  { id: 'cat-bills', name: 'Bills & Utilities', icon: 'Zap', color: '#3b82f6', type: 'expense' },
  { id: 'cat-medical', name: 'Medical & Healthcare', icon: 'HeartPulse', color: '#ec4899', type: 'expense' },
  { id: 'cat-shopping', name: 'Shopping & Groceries', icon: 'ShoppingBag', color: '#8b5cf6', type: 'expense' },
  { id: 'cat-transport', name: 'Transport & Commute', icon: 'Car', color: '#06b6d4', type: 'expense' },
  { id: 'cat-salary', name: 'Monthly Salary', icon: 'Briefcase', color: '#10b981', type: 'income' },
  { id: 'cat-casual-income', name: 'Casual / Freelance', icon: 'Laptop', color: '#14b8a6', type: 'income' },
  { id: 'cat-investments', name: 'Investments & Returns', icon: 'TrendingUp', color: '#6366f1', type: 'income' },
];

export const INITIAL_WALLETS: Wallet[] = [
  {
    id: 'w-cash',
    name: 'Cash In Hand',
    type: 'cash',
    balance: 0,
    currency: 'BDT',
    color: '#059669',
    icon: 'Banknote',
  },
  {
    id: 'w-bank',
    name: 'Bank Checking (City Bank)',
    type: 'bank',
    balance: 0,
    currency: 'BDT',
    color: '#2563eb',
    icon: 'Building2',
    accountNumber: '****4892',
  },
  {
    id: 'w-mobile',
    name: 'bKash / Nagad Wallet',
    type: 'mobile_banking',
    balance: 0,
    currency: 'BDT',
    color: '#db2777',
    icon: 'Smartphone',
    accountNumber: '017****9210',
  },
];

export const INITIAL_BUDGETS: Budget[] = [
  { id: 'b-rent', categoryId: 'cat-rent', limitAmount: 28000, monthYear: '2026-11' },
  { id: 'b-food', categoryId: 'cat-food', limitAmount: 16000, monthYear: '2026-11' },
  { id: 'b-bills', categoryId: 'cat-bills', limitAmount: 6500, monthYear: '2026-11' },
  { id: 'b-shopping', categoryId: 'cat-shopping', limitAmount: 12000, monthYear: '2026-11' },
  { id: 'b-medical', categoryId: 'cat-medical', limitAmount: 5000, monthYear: '2026-11' },
  { id: 'b-transport', categoryId: 'cat-transport', limitAmount: 7000, monthYear: '2026-11' },
];

export const INITIAL_RECURRING: RecurringRule[] = [];

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const storageService = {
  getTransactions(): Transaction[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      return data ? JSON.parse(data) : INITIAL_TRANSACTIONS;
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  },

  saveTransactions(txs: Transaction[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(txs));
    } catch (e) {
      console.warn('Failed to save transactions to localStorage', e);
    }
  },

  getCategories(): Category[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      return data ? JSON.parse(data) : INITIAL_CATEGORIES;
    } catch {
      return INITIAL_CATEGORIES;
    }
  },

  saveCategories(cats: Category[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(cats));
    } catch (e) {
      console.warn('Failed to save categories to localStorage', e);
    }
  },

  getWallets(): Wallet[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WALLETS);
      return data ? JSON.parse(data) : INITIAL_WALLETS;
    } catch {
      return INITIAL_WALLETS;
    }
  },

  saveWallets(wallets: Wallet[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify(wallets));
    } catch (e) {
      console.warn('Failed to save wallets to localStorage', e);
    }
  },

  getBudgets(): Budget[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BUDGETS);
      return data ? JSON.parse(data) : INITIAL_BUDGETS;
    } catch {
      return INITIAL_BUDGETS;
    }
  },

  saveBudgets(budgets: Budget[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
    } catch (e) {
      console.warn('Failed to save budgets to localStorage', e);
    }
  },

  getRecurring(): RecurringRule[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RECURRING);
      return data ? JSON.parse(data) : INITIAL_RECURRING;
    } catch {
      return INITIAL_RECURRING;
    }
  },

  saveRecurring(recurring: RecurringRule[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.RECURRING, JSON.stringify(recurring));
    } catch (e) {
      console.warn('Failed to save recurring rules to localStorage', e);
    }
  },

  getActiveCurrency(): CurrencyCode {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACTIVE_CURRENCY) as CurrencyCode;
      return data || 'BDT';
    } catch {
      return 'BDT';
    }
  },

  saveActiveCurrency(code: CurrencyCode): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_CURRENCY, code);
    } catch (e) {
      console.warn('Failed to save active currency to localStorage', e);
    }
  },

  resetToDefault(): void {
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
    localStorage.removeItem(STORAGE_KEYS.WALLETS);
    localStorage.removeItem(STORAGE_KEYS.BUDGETS);
    localStorage.removeItem(STORAGE_KEYS.RECURRING);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_CURRENCY);
  },
};
