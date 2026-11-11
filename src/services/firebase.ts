import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Initialize Firestore with specific database ID from config
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

const USER_ID_KEY = 'spendwise_firebase_user_uid_v1';

/**
 * Returns a persistent user ID for Firestore documents
 */
export function getOrCreateUserId(): string {
  let uid = localStorage.getItem(USER_ID_KEY);
  if (!uid || !uid.startsWith('usr_')) {
    uid = 'usr_' + crypto.randomUUID().replace(/-/g, '').slice(0, 24);
    localStorage.setItem(USER_ID_KEY, uid);
  }
  return uid;
}

/**
 * Validates connection to Firestore server on boot
 */
export async function validateFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore is running in offline client mode.');
      return false;
    }
    // Expected missing document on server confirms server connectivity
    return true;
  }
}
