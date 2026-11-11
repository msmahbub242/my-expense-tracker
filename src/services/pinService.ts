import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase.ts';

export interface PinData {
  pinHash: string;
  pinLength: number;
  salt: string;
  updatedAt: string;
}

/**
 * Hashes a PIN using Web Crypto SHA-256 with a unique salt
 */
export async function hashPin(pin: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${salt}:${pin}:spendwise_secure_salt`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generates a random cryptographic salt
 */
function generateSalt(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Fetches the user's PIN configuration from Firestore
 */
export async function getPinConfig(userId: string): Promise<PinData | null> {
  try {
    const pinDocRef = doc(db, 'users', userId, 'security', 'pin');
    const snap = await getDoc(pinDocRef);
    if (snap.exists()) {
      return snap.data() as PinData;
    }
    return null;
  } catch (error) {
    console.error('Error fetching PIN config from Firestore:', error);
    return null;
  }
}

/**
 * Saves or updates the user's PIN configuration in Firestore
 */
export async function savePinConfig(
  userId: string,
  pin: string,
  pinLength: number = 6
): Promise<void> {
  const salt = generateSalt();
  const pinHash = await hashPin(pin, salt);
  const pinData: PinData = {
    pinHash,
    pinLength,
    salt,
    updatedAt: new Date().toISOString(),
  };

  const pinDocRef = doc(db, 'users', userId, 'security', 'pin');
  await setDoc(pinDocRef, pinData);
}

/**
 * Verifies if the entered PIN matches the hashed PIN in Firestore
 */
export async function verifyUserPin(userId: string, enteredPin: string): Promise<boolean> {
  const config = await getPinConfig(userId);
  if (!config) return false;

  const enteredHash = await hashPin(enteredPin, config.salt);
  return enteredHash === config.pinHash;
}

/**
 * Resets the PIN configuration in Firestore
 */
export async function removePinConfig(userId: string): Promise<void> {
  const pinDocRef = doc(db, 'users', userId, 'security', 'pin');
  await deleteDoc(pinDocRef);
}
