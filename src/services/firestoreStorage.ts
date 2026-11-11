import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase.ts';
import {
  Transaction,
  Category,
  Wallet,
  Budget,
  RecurringRule,
  CurrencyCode,
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
   * Initializes user Firestore collections with default seed data if empty
   */
  async initializeUserCollectionsIfEmpty(userId: string): Promise<void> {
    try {
      const txCollectionRef = collection(db, 'users', userId, 'transactions');
      const txSnapshot = await getDocs(txCollectionRef);

      if (txSnapshot.empty) {
        const batch = writeBatch(db);

        // 1. Seed Categories
        for (const cat of INITIAL_CATEGORIES) {
          const catRef = doc(db, 'users', userId, 'categories', cat.id);
          batch.set(catRef, { ...cat, userId });
        }

        // 2. Seed Wallets
        for (const wallet of INITIAL_WALLETS) {
          const wRef = doc(db, 'users', userId, 'wallets', wallet.id);
          batch.set(wRef, { ...wallet, userId });
        }

        // 3. Seed Budgets
        for (const budget of INITIAL_BUDGETS) {
          const bRef = doc(db, 'users', userId, 'budgets', budget.id);
          batch.set(bRef, { ...budget, userId });
        }

        // 4. Seed Recurring Rules
        for (const rec of INITIAL_RECURRING) {
          const rRef = doc(db, 'users', userId, 'recurring', rec.id);
          batch.set(rRef, { ...rec, userId });
        }

        // 5. Seed Transactions
        for (const tx of INITIAL_TRANSACTIONS) {
          const tRef = doc(db, 'users', userId, 'transactions', tx.id);
          batch.set(tRef, { ...tx, userId });
        }

        // 6. Seed Default Currency Preference
        const prefRef = doc(db, 'users', userId, 'settings', 'preferences');
        batch.set(prefRef, { activeCurrency: 'BDT', updatedAt: new Date().toISOString() });

        await batch.commit();
      }
    } catch (error) {
      console.error('Error seeding initial Firestore data:', error);
    }
  },

  /**
   * Subscribes to all real-time Firestore collections for the user
   */
  subscribeToAllUserData(
    userId: string,
    callbacks: {
      onTransactions: (txs: Transaction[]) => void;
      onCategories: (cats: Category[]) => void;
      onWallets: (wallets: Wallet[]) => void;
      onBudgets: (budgets: Budget[]) => void;
      onRecurring: (rules: RecurringRule[]) => void;
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
      unsubPref();
    };
  },

  /**
   * Add or update transaction in Firestore
   */
  async saveTransaction(userId: string, tx: Transaction): Promise<void> {
    const docRef = doc(db, 'users', userId, 'transactions', tx.id);
    await setDoc(docRef, { ...tx, userId });
  },

  /**
   * Delete transaction from Firestore
   */
  async deleteTransaction(userId: string, txId: string): Promise<void> {
    const docRef = doc(db, 'users', userId, 'transactions', txId);
    await deleteDoc(docRef);
  },

  /**
   * Save category in Firestore
   */
  async saveCategory(userId: string, category: Category): Promise<void> {
    const docRef = doc(db, 'users', userId, 'categories', category.id);
    await setDoc(docRef, { ...category, userId });
  },

  /**
   * Delete category from Firestore
   */
  async deleteCategory(userId: string, categoryId: string): Promise<void> {
    const docRef = doc(db, 'users', userId, 'categories', categoryId);
    await deleteDoc(docRef);
  },

  /**
   * Save wallet in Firestore
   */
  async saveWallet(userId: string, wallet: Wallet): Promise<void> {
    const docRef = doc(db, 'users', userId, 'wallets', wallet.id);
    await setDoc(docRef, { ...wallet, userId });
  },

  /**
   * Save budgets in Firestore
   */
  async saveBudgets(userId: string, budgets: Budget[]): Promise<void> {
    const batch = writeBatch(db);
    for (const b of budgets) {
      const docRef = doc(db, 'users', userId, 'budgets', b.id);
      batch.set(docRef, { ...b, userId });
    }
    await batch.commit();
  },

  /**
   * Save recurring rule in Firestore
   */
  async saveRecurringRule(userId: string, rule: RecurringRule): Promise<void> {
    const docRef = doc(db, 'users', userId, 'recurring', rule.id);
    await setDoc(docRef, { ...rule, userId });
  },

  /**
   * Delete recurring rule from Firestore
   */
  async deleteRecurringRule(userId: string, ruleId: string): Promise<void> {
    const docRef = doc(db, 'users', userId, 'recurring', ruleId);
    await deleteDoc(docRef);
  },

  /**
   * Save active currency preference in Firestore
   */
  async saveActiveCurrency(userId: string, currency: CurrencyCode): Promise<void> {
    const docRef = doc(db, 'users', userId, 'settings', 'preferences');
    await setDoc(docRef, { activeCurrency: currency, updatedAt: new Date().toISOString() });
  },

  /**
   * Reset all user collections in Firestore back to defaults
   */
  async resetUserData(userId: string): Promise<void> {
    const subcollections = ['transactions', 'categories', 'wallets', 'budgets', 'recurring'];
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
