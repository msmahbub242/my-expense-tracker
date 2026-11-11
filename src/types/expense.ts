export type CurrencyCode = 'BDT' | 'USD' | 'EUR' | 'GBP';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  rateAgainstUSD: number; // 1 USD = X Currency
}

export type WalletType = 'cash' | 'bank' | 'mobile_banking' | 'credit_card';

export interface Wallet {
  id: string;
  name: string;
  type: WalletType;
  balance: number;
  currency: CurrencyCode;
  color: string;
  icon: string;
  accountNumber?: string;
}

export type CategoryType = 'expense' | 'income' | 'both';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: CategoryType;
  isCustom?: boolean;
}

export interface Budget {
  id: string;
  categoryId: string;
  limitAmount: number;
  currency?: CurrencyCode;
  monthYear: string; // "YYYY-MM"
}

export type TransactionType = 'expense' | 'income';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  currency: CurrencyCode;
  categoryId: string;
  walletId: string;
  date: string; // YYYY-MM-DD
  notes: string;
  isRecurring?: boolean;
  recurringId?: string;
  createdAt: string;
}

export type LoanType = 'given' | 'taken'; // given = someone owes me, taken = I owe someone

export interface Loan {
  id: string;
  userId: string;
  type: LoanType;
  personName: string;
  amount: number;
  currency: CurrencyCode;
  walletId: string; // wallet from which given or to which received
  date: string; // YYYY-MM-DD
  dueDate?: string;
  notes?: string;
  status: 'active' | 'settled';
  settledDate?: string;
  createdAt: string;
}

export type RecurringFrequency = 'monthly' | 'weekly' | 'casual';

export interface RecurringRule {
  id: string;
  title: string;
  type: TransactionType;
  amount: number;
  currency: CurrencyCode;
  categoryId: string;
  walletId: string;
  frequency: RecurringFrequency;
  dayOfMonth: number; // 1-31
  nextDueDate: string;
  active: boolean;
  notes: string;
}

export interface BudgetStatus {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  limit: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  status: 'safe' | 'warning' | 'exceeded';
  color: string;
}

export interface MonthlySummary {
  monthYear: string;
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  savingsRate: number;
  transactionCount: number;
  topSpendingCategory?: {
    name: string;
    amount: number;
  };
}
