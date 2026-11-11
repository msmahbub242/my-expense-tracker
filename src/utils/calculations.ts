import {
  CurrencyCode,
  CurrencyConfig,
  Transaction,
  Category,
  Wallet,
  Budget,
  BudgetStatus,
  MonthlySummary,
  RecurringRule,
} from '../types/expense.ts';

export const SUPPORTED_CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  BDT: {
    code: 'BDT',
    symbol: '৳',
    name: 'Bangladeshi Taka',
    rateAgainstUSD: 120.0,
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    rateAgainstUSD: 1.0,
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    rateAgainstUSD: 0.92,
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    rateAgainstUSD: 0.79,
  },
};

/**
 * Converts an amount from one currency to another using USD as base bridge.
 */
export function convertCurrency(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
  rates: Record<CurrencyCode, CurrencyConfig> = SUPPORTED_CURRENCIES
): number {
  if (from === to) return amount;
  const fromRate = rates[from]?.rateAgainstUSD || 1;
  const toRate = rates[to]?.rateAgainstUSD || 1;
  // Convert from source to USD, then from USD to target
  const amountInUSD = amount / fromRate;
  const converted = amountInUSD * toRate;
  return Math.round(converted * 100) / 100;
}

/**
 * Formats a currency value with its appropriate symbol and digit groupings.
 */
export function formatCurrency(
  amount: number,
  currencyCode: CurrencyCode = 'BDT',
  rates: Record<CurrencyCode, CurrencyConfig> = SUPPORTED_CURRENCIES
): string {
  const currency = rates[currencyCode] || SUPPORTED_CURRENCIES.BDT;
  const formattedNumber = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: currencyCode === 'BDT' ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));

  const prefix = amount < 0 ? '-' : '';
  return `${prefix}${currency.symbol} ${formattedNumber}`;
}

/**
 * Calculates total income, expense, net balance, and savings rate.
 */
export function calculateTotals(
  transactions: Transaction[],
  targetCurrency: CurrencyCode = 'BDT',
  rates: Record<CurrencyCode, CurrencyConfig> = SUPPORTED_CURRENCIES
): {
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  savingsRate: number;
} {
  let totalIncome = 0;
  let totalExpense = 0;

  for (const tx of transactions) {
    const converted = convertCurrency(tx.amount, tx.currency, targetCurrency, rates);
    if (tx.type === 'income') {
      totalIncome += converted;
    } else {
      totalExpense += converted;
    }
  }

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.max(0, Math.round((netSavings / totalIncome) * 100)) : 0;

  return {
    totalIncome: Math.round(totalIncome * 100) / 100,
    totalExpense: Math.round(totalExpense * 100) / 100,
    netSavings: Math.round(netSavings * 100) / 100,
    savingsRate,
  };
}

/**
 * Aggregates expenses by category for charts and breakdowns.
 */
export function calculateCategoryExpenses(
  transactions: Transaction[],
  categories: Category[],
  targetCurrency: CurrencyCode = 'BDT',
  rates: Record<CurrencyCode, CurrencyConfig> = SUPPORTED_CURRENCIES
): {
  categoryId: string;
  categoryName: string;
  color: string;
  icon: string;
  totalAmount: number;
  percentage: number;
}[] {
  const categoryMap = new Map<string, Category>(categories.map((c) => [c.id, c]));
  const expenseMap = new Map<string, number>();
  let grandTotal = 0;

  for (const tx of transactions) {
    if (tx.type === 'expense') {
      const converted = convertCurrency(tx.amount, tx.currency, targetCurrency, rates);
      expenseMap.set(tx.categoryId, (expenseMap.get(tx.categoryId) || 0) + converted);
      grandTotal += converted;
    }
  }

  const result = Array.from(expenseMap.entries())
    .map(([catId, amount]) => {
      const cat = categoryMap.get(catId);
      const catName = cat?.name || 'Uncategorized';
      const color = cat?.color || '#94a3b8';
      const icon = cat?.icon || 'Tag';
      const percentage = grandTotal > 0 ? Math.round((amount / grandTotal) * 1000) / 10 : 0;
      return {
        categoryId: catId,
        categoryName: catName,
        color,
        icon,
        totalAmount: Math.round(amount * 100) / 100,
        percentage,
      };
    })
    .sort((a, b) => b.totalAmount - a.totalAmount);

  return result;
}

/**
 * Calculates budget status and triggers warning if spent >= 80% or exceeded >= 100%.
 */
export function calculateBudgetStatuses(
  transactions: Transaction[],
  budgets: Budget[],
  categories: Category[],
  monthYear: string,
  targetCurrency: CurrencyCode = 'BDT',
  rates: Record<CurrencyCode, CurrencyConfig> = SUPPORTED_CURRENCIES
): BudgetStatus[] {
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  // Sum spending for this specific month
  const spendByCat = new Map<string, number>();
  for (const tx of transactions) {
    if (tx.type === 'expense' && tx.date.startsWith(monthYear)) {
      const converted = convertCurrency(tx.amount, tx.currency, targetCurrency, rates);
      spendByCat.set(tx.categoryId, (spendByCat.get(tx.categoryId) || 0) + converted);
    }
  }

  return budgets
    .filter((b) => b.monthYear === monthYear || !b.monthYear)
    .map((b) => {
      const cat = categoryMap.get(b.categoryId);
      const spent = spendByCat.get(b.categoryId) || 0;
      const limit = convertCurrency(b.limitAmount, b.currency || 'BDT', targetCurrency, rates);
      const remaining = limit - spent;
      const percentUsed = limit > 0 ? Math.round((spent / limit) * 100) : 0;

      let status: 'safe' | 'warning' | 'exceeded' = 'safe';
      if (percentUsed >= 100) {
        status = 'exceeded';
      } else if (percentUsed >= 80) {
        status = 'warning';
      }

      return {
        categoryId: b.categoryId,
        categoryName: cat?.name || 'Unknown Category',
        categoryIcon: cat?.icon || 'Tag',
        limit: Math.round(limit * 100) / 100,
        spent: Math.round(spent * 100) / 100,
        remaining: Math.round(remaining * 100) / 100,
        percentUsed,
        status,
        color: cat?.color || '#3b82f6',
      };
    })
    .sort((a, b) => b.percentUsed - a.percentUsed);
}

/**
 * Filter transactions by search query, category, wallet, type, and dates.
 */
export interface FilterOptions {
  searchQuery?: string;
  categoryId?: string;
  walletId?: string;
  type?: 'all' | 'expense' | 'income';
  startDate?: string;
  endDate?: string;
}

export function filterTransactions(
  transactions: Transaction[],
  categories: Category[],
  wallets: Wallet[],
  filters: FilterOptions
): Transaction[] {
  const categoryNames = new Map(categories.map((c) => [c.id, c.name.toLowerCase()]));
  const walletNames = new Map(wallets.map((w) => [w.id, w.name.toLowerCase()]));
  const query = filters.searchQuery ? filters.searchQuery.toLowerCase().trim() : '';

  return transactions.filter((tx) => {
    // Type filter
    if (filters.type && filters.type !== 'all' && tx.type !== filters.type) {
      return false;
    }
    // Category filter
    if (filters.categoryId && filters.categoryId !== 'all' && tx.categoryId !== filters.categoryId) {
      return false;
    }
    // Wallet filter
    if (filters.walletId && filters.walletId !== 'all' && tx.walletId !== filters.walletId) {
      return false;
    }
    // Date range filter
    if (filters.startDate && tx.date < filters.startDate) {
      return false;
    }
    if (filters.endDate && tx.date > filters.endDate) {
      return false;
    }
    // Keyword search in notes, category name, wallet name, or amount
    if (query) {
      const catName = categoryNames.get(tx.categoryId) || '';
      const wName = walletNames.get(tx.walletId) || '';
      const notes = (tx.notes || '').toLowerCase();
      const amountStr = tx.amount.toString();

      const matches =
        notes.includes(query) ||
        catName.includes(query) ||
        wName.includes(query) ||
        amountStr.includes(query);

      if (!matches) return false;
    }

    return true;
  });
}

/**
 * Recalculates wallet balances dynamically based on transactions.
 */
export function recalculateWalletBalances(
  initialWallets: Wallet[],
  transactions: Transaction[]
): Wallet[] {
  const balanceDeltas = new Map<string, number>();

  for (const tx of transactions) {
    const current = balanceDeltas.get(tx.walletId) || 0;
    if (tx.type === 'income') {
      balanceDeltas.set(tx.walletId, current + tx.amount);
    } else {
      balanceDeltas.set(tx.walletId, current - tx.amount);
    }
  }

  return initialWallets.map((wallet) => {
    const delta = balanceDeltas.get(wallet.id) || 0;
    return {
      ...wallet,
      balance: Math.round((wallet.balance + delta) * 100) / 100,
    };
  });
}

/**
 * Checks for recurring transactions that are due on or before `currentDate` (YYYY-MM-DD).
 */
export function processRecurringRules(
  rules: RecurringRule[],
  currentDate: string // YYYY-MM-DD
): {
  dueTransactions: Omit<Transaction, 'id' | 'createdAt'>[];
  updatedRules: RecurringRule[];
} {
  const dueTransactions: Omit<Transaction, 'id' | 'createdAt'>[] = [];
  const updatedRules: RecurringRule[] = [];

  for (const rule of rules) {
    if (!rule.active) {
      updatedRules.push(rule);
      continue;
    }

    if (rule.nextDueDate <= currentDate) {
      // Create transaction
      dueTransactions.push({
        type: rule.type,
        amount: rule.amount,
        currency: rule.currency,
        categoryId: rule.categoryId,
        walletId: rule.walletId,
        date: rule.nextDueDate,
        notes: `Recurring: ${rule.title} - ${rule.notes || ''}`.trim(),
        isRecurring: true,
        recurringId: rule.id,
      });

      // Calculate next due date (advance 1 month or 1 week)
      const nextDate = new Date(rule.nextDueDate);
      if (rule.frequency === 'monthly') {
        nextDate.setMonth(nextDate.getMonth() + 1);
      } else if (rule.frequency === 'weekly') {
        nextDate.setDate(nextDate.getDate() + 7);
      } else {
        nextDate.setMonth(nextDate.getMonth() + 1);
      }

      const nextDueStr = nextDate.toISOString().split('T')[0];
      updatedRules.push({
        ...rule,
        nextDueDate: nextDueStr,
      });
    } else {
      updatedRules.push(rule);
    }
  }

  return { dueTransactions, updatedRules };
}

/**
 * Builds RFC 4180 CSV export content.
 */
export function exportToCsv(
  transactions: Transaction[],
  categories: Category[],
  wallets: Wallet[]
): string {
  const catMap = new Map(categories.map((c) => [c.id, c.name]));
  const walletMap = new Map(wallets.map((w) => [w.id, w.name]));

  const headers = [
    'Date',
    'Type',
    'Category',
    'Wallet',
    'Amount',
    'Currency',
    'Notes',
    'Is Recurring',
  ];

  const escapeCsv = (val: string | number) => {
    const stringVal = String(val ?? '');
    if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n')) {
      return `"${stringVal.replace(/"/g, '""')}"`;
    }
    return stringVal;
  };

  const rows = transactions.map((tx) => [
    tx.date,
    tx.type.toUpperCase(),
    catMap.get(tx.categoryId) || 'Unknown',
    walletMap.get(tx.walletId) || 'Unknown',
    tx.amount,
    tx.currency,
    tx.notes || '',
    tx.isRecurring ? 'Yes' : 'No',
  ]);

  const csvContent = [
    headers.map(escapeCsv).join(','),
    ...rows.map((row) => row.map(escapeCsv).join(',')),
  ].join('\r\n');

  return csvContent;
}

/**
 * Builds a monthly summary report with insights.
 */
export function generateMonthlySummary(
  transactions: Transaction[],
  monthYear: string, // YYYY-MM
  categories: Category[],
  targetCurrency: CurrencyCode = 'BDT',
  rates: Record<CurrencyCode, CurrencyConfig> = SUPPORTED_CURRENCIES
): MonthlySummary {
  const monthTransactions = transactions.filter((tx) => tx.date.startsWith(monthYear));
  const totals = calculateTotals(monthTransactions, targetCurrency, rates);
  const categoryExpenses = calculateCategoryExpenses(monthTransactions, categories, targetCurrency, rates);

  const topCategory = categoryExpenses.length > 0
    ? { name: categoryExpenses[0].categoryName, amount: categoryExpenses[0].totalAmount }
    : undefined;

  return {
    monthYear,
    totalIncome: totals.totalIncome,
    totalExpense: totals.totalExpense,
    netSavings: totals.netSavings,
    savingsRate: totals.savingsRate,
    transactionCount: monthTransactions.length,
    topSpendingCategory: topCategory,
  };
}
