import test from 'node:test';
import assert from 'node:assert/strict';
import {
  convertCurrency,
  formatCurrency,
  calculateTotals,
  calculateBudgetStatuses,
  filterTransactions,
  processRecurringRules,
  exportToCsv,
} from './calculations.ts';
import { Transaction, Category, Budget, Wallet, RecurringRule } from '../types/expense.ts';

test('convertCurrency converts accurately using rate ratio', () => {
  // 1 USD = 120 BDT
  assert.equal(convertCurrency(100, 'USD', 'BDT'), 12000);
  assert.equal(convertCurrency(1200, 'BDT', 'USD'), 10);
  assert.equal(convertCurrency(50, 'USD', 'USD'), 50);
});

test('formatCurrency formats BDT and USD with proper symbol and separators', () => {
  const bdtFormatted = formatCurrency(50000, 'BDT');
  assert.match(bdtFormatted, /৳/);
  assert.match(bdtFormatted, /50,000/);

  const usdFormatted = formatCurrency(1234.56, 'USD');
  assert.match(usdFormatted, /\$/);
  assert.match(usdFormatted, /1,234\.56/);
});

test('calculateTotals calculates income, expense, net savings, and savings rate correctly', () => {
  const transactions: Transaction[] = [
    {
      id: 'tx-1',
      type: 'income',
      amount: 100000,
      currency: 'BDT',
      categoryId: 'cat-salary',
      walletId: 'w-bank',
      date: '2026-11-01',
      notes: 'Monthly salary',
      createdAt: '2026-11-01T00:00:00Z',
    },
    {
      id: 'tx-2',
      type: 'expense',
      amount: 25000,
      currency: 'BDT',
      categoryId: 'cat-rent',
      walletId: 'w-bank',
      date: '2026-11-02',
      notes: 'House rent',
      createdAt: '2026-11-02T00:00:00Z',
    },
    {
      id: 'tx-3',
      type: 'expense',
      amount: 15000,
      currency: 'BDT',
      categoryId: 'cat-food',
      walletId: 'w-cash',
      date: '2026-11-05',
      notes: 'Groceries',
      createdAt: '2026-11-05T00:00:00Z',
    },
  ];

  const totals = calculateTotals(transactions, 'BDT');
  assert.equal(totals.totalIncome, 100000);
  assert.equal(totals.totalExpense, 40000);
  assert.equal(totals.netSavings, 60000);
  assert.equal(totals.savingsRate, 60); // 60,000 / 100,000 = 60%
});

test('calculateBudgetStatuses marks safe (<80%), warning (80-99%), and exceeded (>=100%)', () => {
  const categories: Category[] = [
    { id: 'cat-food', name: 'Food', icon: 'Utensils', color: '#f59e0b', type: 'expense' },
    { id: 'cat-rent', name: 'Rent', icon: 'Home', color: '#ef4444', type: 'expense' },
    { id: 'cat-bills', name: 'Bills', icon: 'Zap', color: '#3b82f6', type: 'expense' },
  ];

  const budgets: Budget[] = [
    { id: 'b-1', categoryId: 'cat-food', limitAmount: 10000, monthYear: '2026-11' },
    { id: 'b-2', categoryId: 'cat-rent', limitAmount: 20000, monthYear: '2026-11' },
    { id: 'b-3', categoryId: 'cat-bills', limitAmount: 5000, monthYear: '2026-11' },
  ];

  const transactions: Transaction[] = [
    // Food: 5000 / 10000 = 50% -> 'safe'
    { id: '1', type: 'expense', amount: 5000, currency: 'BDT', categoryId: 'cat-food', walletId: 'w-1', date: '2026-11-02', notes: '', createdAt: '' },
    // Rent: 17000 / 20000 = 85% -> 'warning'
    { id: '2', type: 'expense', amount: 17000, currency: 'BDT', categoryId: 'cat-rent', walletId: 'w-1', date: '2026-11-03', notes: '', createdAt: '' },
    // Bills: 6000 / 5000 = 120% -> 'exceeded'
    { id: '3', type: 'expense', amount: 6000, currency: 'BDT', categoryId: 'cat-bills', walletId: 'w-1', date: '2026-11-04', notes: '', createdAt: '' },
  ];

  const statuses = calculateBudgetStatuses(transactions, budgets, categories, '2026-11', 'BDT');

  const foodStatus = statuses.find((s) => s.categoryId === 'cat-food');
  const rentStatus = statuses.find((s) => s.categoryId === 'cat-rent');
  const billsStatus = statuses.find((s) => s.categoryId === 'cat-bills');

  assert.equal(foodStatus?.status, 'safe');
  assert.equal(foodStatus?.percentUsed, 50);

  assert.equal(rentStatus?.status, 'warning');
  assert.equal(rentStatus?.percentUsed, 85);

  assert.equal(billsStatus?.status, 'exceeded');
  assert.equal(billsStatus?.percentUsed, 120);
});

test('filterTransactions filters by keyword, type, category, wallet, and dates', () => {
  const categories: Category[] = [
    { id: 'c-food', name: 'Food', icon: 'Utensils', color: '#fff', type: 'expense' },
    { id: 'c-rent', name: 'Rent', icon: 'Home', color: '#fff', type: 'expense' },
  ];
  const wallets: Wallet[] = [
    { id: 'w-cash', name: 'Cash In Hand', type: 'cash', balance: 5000, currency: 'BDT', color: '#fff', icon: 'Wallet' },
    { id: 'w-bkash', name: 'bKash / Nagad', type: 'mobile_banking', balance: 10000, currency: 'BDT', color: '#fff', icon: 'Smartphone' },
  ];

  const txs: Transaction[] = [
    { id: '1', type: 'expense', amount: 200, currency: 'BDT', categoryId: 'c-food', walletId: 'w-cash', date: '2026-11-01', notes: 'Lunch buffet', createdAt: '' },
    { id: '2', type: 'expense', amount: 20000, currency: 'BDT', categoryId: 'c-rent', walletId: 'w-bkash', date: '2026-11-05', notes: 'Apartment rent', createdAt: '' },
    { id: '3', type: 'income', amount: 50000, currency: 'BDT', categoryId: 'c-food', walletId: 'w-bkash', date: '2026-11-10', notes: 'Side gig', createdAt: '' },
  ];

  // Search 'buffet'
  const searchResults = filterTransactions(txs, categories, wallets, { searchQuery: 'buffet' });
  assert.equal(searchResults.length, 1);
  assert.equal(searchResults[0].id, '1');

  // Filter by wallet
  const bkashResults = filterTransactions(txs, categories, wallets, { walletId: 'w-bkash' });
  assert.equal(bkashResults.length, 2);

  // Filter by date range
  const dateRangeResults = filterTransactions(txs, categories, wallets, { startDate: '2026-11-03', endDate: '2026-11-08' });
  assert.equal(dateRangeResults.length, 1);
  assert.equal(dateRangeResults[0].id, '2');
});

test('processRecurringRules handles due dates and advances recurring frequency', () => {
  const rules: RecurringRule[] = [
    {
      id: 'rec-1',
      title: 'Internet Fiber',
      type: 'expense',
      amount: 1500,
      currency: 'BDT',
      categoryId: 'cat-bills',
      walletId: 'w-bkash',
      frequency: 'monthly',
      dayOfMonth: 5,
      nextDueDate: '2026-11-05',
      active: true,
      notes: 'Monthly broadband',
    },
    {
      id: 'rec-2',
      title: 'Gym Membership',
      type: 'expense',
      amount: 2000,
      currency: 'BDT',
      categoryId: 'cat-bills',
      walletId: 'w-cash',
      frequency: 'monthly',
      dayOfMonth: 25,
      nextDueDate: '2026-11-25',
      active: true,
      notes: 'Fitness gym',
    },
  ];

  // Today is 2026-11-10 -> Internet Fiber should trigger, Gym should not
  const result = processRecurringRules(rules, '2026-11-10');
  assert.equal(result.dueTransactions.length, 1);
  assert.equal(result.dueTransactions[0].amount, 1500);
  assert.match(result.dueTransactions[0].notes, /Internet Fiber/);

  // Internet Fiber nextDueDate should advance to December
  const updatedFiber = result.updatedRules.find((r) => r.id === 'rec-1');
  assert.equal(updatedFiber?.nextDueDate, '2026-12-05');
});

test('exportToCsv creates properly quoted and formatted CSV string', () => {
  const categories: Category[] = [{ id: 'c1', name: 'Shopping & Gifts', icon: 'ShoppingBag', color: '#fff', type: 'expense' }];
  const wallets: Wallet[] = [{ id: 'w1', name: 'Cash', type: 'cash', balance: 100, currency: 'BDT', color: '#fff', icon: 'Wallet' }];
  const txs: Transaction[] = [
    {
      id: 'tx-1',
      type: 'expense',
      amount: 1500,
      currency: 'BDT',
      categoryId: 'c1',
      walletId: 'w1',
      date: '2026-11-02',
      notes: 'New shirt, blue',
      isRecurring: false,
      createdAt: '',
    },
  ];

  const csv = exportToCsv(txs, categories, wallets);
  assert.match(csv, /Date,Type,Category,Wallet,Amount,Currency,Notes,Is Recurring/);
  assert.match(csv, /Shopping & Gifts/);
  assert.match(csv, /"New shirt, blue"/);
});
