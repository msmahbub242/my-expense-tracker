import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
  getDoc,
} from 'firebase/firestore';
import { db } from './firebase.ts';
import {
  Transaction,
  Category,
  Wallet,
  Budget,
  RecurringRule,
  CurrencyCode,
  Loan,
} from '../types/expense.ts';
import {
  INITIAL_CATEGORIES,
  INITIAL_WALLETS,
  INITIAL_BUDGETS,
  INITIAL_RECURRING,
  INITIAL_TRANSACTIONS,
} from './storage.ts';

export const firestoreStorage = {
  /**
   * Initializes user Firestore collections with clean zero-balance wallets and categories
   */
  async initializeUserCollectionsIfEmpty(userId: string): Promise<void> {
    try {
      const walletsRef = collection(db, 'users', userId, 'wallets');
      const walletsSnap = await getDocs(walletsRef);

      if (walletsSnap.empty) {
        const batch = writeBatch(db);

        // 1. Categories
        for (const cat of INITIAL_CATEGORIES) {
          const catRef = doc(db, 'users', userId, 'categories', cat.id);
          batch.set(catRef, { ...cat, userId });
        }

        // 2. Wallets (all start with 0 BDT)
        for (const wallet of INITIAL_WALLETS) {
          const wRef = doc(db, 'users', userId, 'wallets', wallet.id);
          batch.set(wRef, { ...wallet, balance: 0, userId });
        }

        // 3. Budgets
        for (const budget of INITIAL_BUDGETS) {
          const bRef = doc(db, 'users', userId, 'budgets', budget.id);
          batch.set(bRef, { ...budget, userId });
        }

        // 4. Default Currency Preference
        const prefRef = doc(db, 'users', userId, 'settings', 'preferences');
        batch.set(prefRef, {
          activeCurrency: 'BDT',
          zeroStartApplied: true,
          updatedAt: new Date().toISOString(),
        });

        await batch.commit();
      } else {
        await this.ensureZeroStartState(userId);
      }
    } catch (error) {
      console.error('Error seeding initial Firestore data:', error);
    }
  },

  async ensureZeroStartState(userId: string): Promise<void> {
    try {
      const prefRef = doc(db, 'users', userId, 'settings', 'preferences');
      const prefSnap = await getDoc(prefRef);

      if (!prefSnap.exists() || !prefSnap.data().zeroStartApplied) {
        const batch = writeBatch(db);

        const walletsSnap = await getDocs(collection(db, 'users', userId, 'wallets'));
        walletsSnap.forEach((wDoc) => {
          batch.update(wDoc.ref, { balance: 0 });
        });

        const txSnap = await getDocs(collection(db, 'users', userId, 'transactions'));
        txSnap.forEach((tDoc) => {
          if (tDoc.id.startsWith('tx-0') || tDoc.id.startsWith('tx-1')) {
            batch.delete(tDoc.ref);
          }
        });

        batch.set(
          prefRef,
          { zeroStartApplied: true, updatedAt: new Date().toISOString() },
          { merge: true }
        );

        await batch.commit();
      }
    } catch (err) {
      console.warn('ensureZeroStartState note:', err);
    }
  },

  /**
   * Subscribes to all real-time Firestore collections for the user including loans
   */
  subscribeToAllUserData(
    userId: string,
    callbacks: {
      onTransactions: (txs: Transaction[]) => void;
      onCategories: (cats: Category[]) => void;
      onWallets: (wallets: Wallet[]) => void;
      onBudgets: (budgets: Budget[]) => void;
      onRecurring: (rules: RecurringRule[]) => void;
      onLoans: (loans: Loan[]) => void;
      onCurrency: (cur: CurrencyCode) => void;
    }
  ): () => void {
    const unsubTx = onSnapshot(collection(db, 'users', userId, 'transactions'), (snapshot) => {
      const data: Transaction[] = [];
      snapshot.forEach((d) => data.push(d.data() as Transaction));
      callbacks.onTransactions(data);
    });

    const unsubCats = onSnapshot(collection(db, 'users', userId, 'categories'), (snapshot) => {
      const data: Category[] = [];
      snapshot.forEach((d) => data.push(d.data() as Category));
      if (data.length > 0) callbacks.onCategories(data);
    });

    const unsubWallets = onSnapshot(collection(db, 'users', userId, 'wallets'), (snapshot) => {
      const data: Wallet[] = [];
      snapshot.forEach((d) => data.push(d.data() as Wallet));
      if (data.length > 0) callbacks.onWallets(data);
    });

    const unsubBudgets = onSnapshot(collection(db, 'users', userId, 'budgets'), (snapshot) => {
      const data: Budget[] = [];
      snapshot.forEach((d) => data.push(d.data() as Budget));
      callbacks.onBudgets(data);
    });

    const unsubRecurring = onSnapshot(collection(db, 'users', userId, 'recurring'), (snapshot) => {
      const data: RecurringRule[] = [];
      snapshot.forEach((d) => data.push(d.data() as RecurringRule));
      callbacks.onRecurring(data);
    });

    const unsubLoans = onSnapshot(collection(db, 'users', userId, 'loans'), (snapshot) => {
      const data: Loan[] = [];
      snapshot.forEach((d) => data.push(d.data() as Loan));
      callbacks.onLoans(data);
    });

    const unsubPref = onSnapshot(
      doc(db, 'users', userId, 'settings', 'preferences'),
      (snapshot) => {
        if (snapshot.exists()) {
          const pref = snapshot.data();
          if (pref.activeCurrency) {
            callbacks.onCurrency(pref.activeCurrency as CurrencyCode);
          }
        }
      }
    );

    return () => {
      unsubTx();
      unsubCats();
      unsubWallets();
      unsubBudgets();
      unsubRecurring();
      unsubLoans();
      unsubPref();
    };
  },

  async saveTransaction(userId: string, tx: Transaction): Promise<void> {
    const docRef = doc(db, 'users', userId, 'transactions', tx.id);
    await setDoc(docRef, { ...tx, userId });
  },

  async deleteTransaction(userId: string, txId: string): Promise<void> {
    const docRef = doc(db, 'users', userId, 'transactions', txId);
    await deleteDoc(docRef);
  },

  async saveCategory(userId: string, category: Category): Promise<void> {
    const docRef = doc(db, 'users', userId, 'categories', category.id);
    await setDoc(docRef, { ...category, userId });
  },

  async deleteCategory(userId: string, categoryId: string): Promise<void> {
    const docRef = doc(db, 'users', userId, 'categories', categoryId);
    await deleteDoc(docRef);
  },

  async saveWallet(userId: string, wallet: Wallet): Promise<void> {
    const docRef = doc(db, 'users', userId, 'wallets', wallet.id);
    const payload: Record<string, any> = {
      id: wallet.id,
      userId,
      name: wallet.name,
      type: wallet.type,
      balance: wallet.balance,
      currency: wallet.currency,
      color: wallet.color,
      icon: wallet.icon,
    };
    if (wallet.accountNumber) {
      payload.accountNumber = wallet.accountNumber;
    }
    await setDoc(docRef, payload);
  },

  async updateWalletBalance(userId: string, walletId: string, newBalance: number): Promise<void> {
    const docRef = doc(db, 'users', userId, 'wallets', walletId);
    await setDoc(docRef, { balance: newBalance, userId }, { merge: true });
  },

  async deleteWallet(userId: string, walletId: string): Promise<void> {
    const docRef = doc(db, 'users', userId, 'wallets', walletId);
    await deleteDoc(docRef);
  },

  async saveBudgets(userId: string, budgets: Budget[]): Promise<void> {
    const batch = writeBatch(db);
    for (const b of budgets) {
      const docRef = doc(db, 'users', userId, 'budgets', b.id);
      batch.set(docRef, { ...b, userId });
    }
    await batch.commit();
  },

  async saveRecurringRule(userId: string, rule: RecurringRule): Promise<void> {
    const docRef = doc(db, 'users', userId, 'recurring', rule.id);
    await setDoc(docRef, { ...rule, userId });
  },

  async deleteRecurringRule(userId: string, ruleId: string): Promise<void> {
    const docRef = doc(db, 'users', userId, 'recurring', ruleId);
    await deleteDoc(docRef);
  },

  async saveLoan(userId: string, loan: Loan): Promise<void> {
    const docRef = doc(db, 'users', userId, 'loans', loan.id);
    const payload: Record<string, any> = {
      id: loan.id,
      userId,
      type: loan.type,
      personName: loan.personName,
      amount: loan.amount,
      currency: loan.currency,
      walletId: loan.walletId,
      date: loan.date,
      status: loan.status,
      createdAt: loan.createdAt,
    };
    if (loan.dueDate) payload.dueDate = loan.dueDate;
    if (loan.notes) payload.notes = loan.notes;
    if (loan.settledDate) payload.settledDate = loan.settledDate;

    await setDoc(docRef, payload);
  },

  async deleteLoan(userId: string, loanId: string): Promise<void> {
    const docRef = doc(db, 'users', userId, 'loans', loanId);
    await deleteDoc(docRef);
  },

  async saveActiveCurrency(userId: string, currency: CurrencyCode): Promise<void> {
    const docRef = doc(db, 'users', userId, 'settings', 'preferences');
    await setDoc(docRef, { activeCurrency: currency, updatedAt: new Date().toISOString() }, { merge: true });
  },

  async resetUserData(userId: string): Promise<void> {
    const subcollections = ['transactions', 'categories', 'wallets', 'budgets', 'recurring', 'loans'];
    for (const col of subcollections) {
      const colRef = collection(db, 'users', userId, col);
      const snapshot = await getDocs(colRef);
      const batch = writeBatch(db);
      snapshot.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
    await this.initializeUserCollectionsIfEmpty(userId);
  },
};
