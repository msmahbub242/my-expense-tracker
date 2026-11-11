import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase.ts';

export interface PinData {
  pinHash: string;
  pinLength: number;
  salt: string;
  recoveryHash?: string;
  recoverySalt?: string;
  recoveryHint?: string;
  updatedAt: string;
}

/**
 * Hashes a string (PIN or recovery phrase) using Web Crypto SHA-256 with salt
 */
export async function hashValue(value: string, salt: string): Promise<string> {
  const normalized = value.trim().toLowerCase();
  const encoder = new TextEncoder();
  const data = encoder.encode(`${salt}:${normalized}:spendwise_secure_salt_v2`);
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
 * Saves initial PIN configuration along with optional emergency recovery phrase
 */
export async function savePinConfig(
  userId: string,
  pin: string,
  pinLength: number = 6,
  recoveryPhrase?: string,
  recoveryHint?: string
): Promise<void> {
  const pinSalt = generateSalt();
  const pinHash = await hashValue(pin, pinSalt);

  let recoveryHash: string | undefined;
  let recoverySalt: string | undefined;

  if (recoveryPhrase && recoveryPhrase.trim().length > 0) {
    recoverySalt = generateSalt();
    recoveryHash = await hashValue(recoveryPhrase.trim(), recoverySalt);
  }

  const pinData: PinData = {
    pinHash,
    pinLength,
    salt: pinSalt,
    recoveryHash,
    recoverySalt,
    recoveryHint: recoveryHint?.trim() || undefined,
    updatedAt: new Date().toISOString(),
  };

  const pinDocRef = doc(db, 'users', userId, 'security', 'pin');
  await setDoc(pinDocRef, pinData);
}

/**
 * Verifies if entered PIN matches the hashed PIN in Firestore
 */
export async function verifyUserPin(userId: string, enteredPin: string): Promise<boolean> {
  const config = await getPinConfig(userId);
  if (!config) return false;

  const enteredHash = await hashValue(enteredPin, config.salt);
  return enteredHash === config.pinHash;
}

/**
 * Verifies if the secret emergency recovery phrase matches the recovery hash
 */
export async function verifyRecoveryPhrase(userId: string, enteredPhrase: string): Promise<boolean> {
  const config = await getPinConfig(userId);
  if (!config || !config.recoveryHash || !config.recoverySalt) {
    return false;
  }

  const enteredHash = await hashValue(enteredPhrase.trim(), config.recoverySalt);
  return enteredHash === config.recoveryHash;
}

/**
 * Changes PIN from inside the authenticated app by verifying the old PIN first
 */
export async function changePinWithOldPin(
  userId: string,
  oldPin: string,
  newPin: string,
  newLength: number,
  newRecoveryPhrase?: string,
  newRecoveryHint?: string
): Promise<{ success: boolean; error?: string }> {
  const isValid = await verifyUserPin(userId, oldPin);
  if (!isValid) {
    return { success: false, error: 'Current PIN is incorrect.' };
  }

  const currentConfig = await getPinConfig(userId);
  const pinSalt = generateSalt();
  const pinHash = await hashValue(newPin, pinSalt);

  let recoveryHash = currentConfig?.recoveryHash;
  let recoverySalt = currentConfig?.recoverySalt;
  let recoveryHint = currentConfig?.recoveryHint;

  if (newRecoveryPhrase && newRecoveryPhrase.trim().length > 0) {
    recoverySalt = generateSalt();
    recoveryHash = await hashValue(newRecoveryPhrase.trim(), recoverySalt);
    recoveryHint = newRecoveryHint?.trim() || undefined;
  }

  const updatedData: PinData = {
    pinHash,
    pinLength: newLength,
    salt: pinSalt,
    recoveryHash,
    recoverySalt,
    recoveryHint,
    updatedAt: new Date().toISOString(),
  };

  const pinDocRef = doc(db, 'users', userId, 'security', 'pin');
  await setDoc(pinDocRef, updatedData);
  return { success: true };
}

/**
 * Resets PIN using the Secret Recovery Phrase when locked out
 */
export async function resetPinWithRecoveryPhrase(
  userId: string,
  recoveryPhrase: string,
  newPin: string,
  newLength: number
): Promise<{ success: boolean; error?: string }> {
  const isRecoveryValid = await verifyRecoveryPhrase(userId, recoveryPhrase);
  if (!isRecoveryValid) {
    return { success: false, error: 'Incorrect recovery phrase. PIN reset denied.' };
  }

  const currentConfig = await getPinConfig(userId);
  const pinSalt = generateSalt();
  const pinHash = await hashValue(newPin, pinSalt);

  const updatedData: PinData = {
    pinHash,
    pinLength: newLength,
    salt: pinSalt,
    recoveryHash: currentConfig?.recoveryHash,
    recoverySalt: currentConfig?.recoverySalt,
    recoveryHint: currentConfig?.recoveryHint,
    updatedAt: new Date().toISOString(),
  };

  const pinDocRef = doc(db, 'users', userId, 'security', 'pin');
  await setDoc(pinDocRef, updatedData);
  return { success: true };
}

/**
 * Disables PIN protection by requiring verification of the current PIN
 */
export async function removePinWithOldPin(
  userId: string,
  oldPin: string
): Promise<{ success: boolean; error?: string }> {
  const isValid = await verifyUserPin(userId, oldPin);
  if (!isValid) {
    return { success: false, error: 'Current PIN is incorrect.' };
  }

  const pinDocRef = doc(db, 'users', userId, 'security', 'pin');
  await deleteDoc(pinDocRef);
  return { success: true };
}
