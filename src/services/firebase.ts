import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Initialize Firestore with specific database ID from config
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const OWNER_USER_ID = 'owner_vault';

/**
 * Returns the dedicated single-owner vault ID in Firestore
 */
export function getOrCreateUserId(): string {
  return OWNER_USER_ID;
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
