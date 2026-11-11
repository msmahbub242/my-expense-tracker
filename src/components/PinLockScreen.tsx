import React, { useState, useEffect } from 'react';
import {
  Lock,
  KeyRound,
  Delete,
  AlertCircle,
  Hash,
  HelpCircle,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import {
  PinData,
  savePinConfig,
  verifyUserPin,
  resetPinWithRecoveryPhrase,
  verifyRecoveryPhrase,
} from '../services/pinService.ts';

interface PinLockScreenProps {
  userId: string;
  pinConfig: PinData | null;
  onUnlocked: () => void;
  onPinConfigUpdated: (newConfig: PinData | null) => void;
}

export const PinLockScreen: React.FC<PinLockScreenProps> = ({
  userId,
  pinConfig,
  onUnlocked,
  onPinConfigUpdated,
}) => {
  const isSetupMode = !pinConfig;
  const [pinLength, setPinLength] = useState<number>(pinConfig?.pinLength || 6);

  // States for PIN entry
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [step, setStep] = useState<'create' | 'confirm' | 'recovery_setup' | 'unlock' | 'forgot_phrase' | 'new_pin_after_recovery'>('create');
  const [recoveryPhrase, setRecoveryPhrase] = useState<string>('');
  const [recoveryHint, setRecoveryHint] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (pinConfig) {
      setStep('unlock');
      setPinLength(pinConfig.pinLength || 6);
    } else {
      setStep('create');
    }
    setEnteredPin('');
    setConfirmPin('');
    setRecoveryPhrase('');
    setErrorMsg('');
  }, [pinConfig]);

  // Physical keyboard support for PIN digits
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLoading) return;
      if (step === 'recovery_setup' || step === 'forgot_phrase') return; // let user type regular text

      if (e.key >= '0' && e.key <= '9') {
        handleDigitPress(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enteredPin, confirmPin, step, pinLength, isLoading]);

  const triggerError = (msg: string) => {
    setErrorMsg(msg);
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
    setEnteredPin('');
    setConfirmPin('');
    if (isSetupMode && step === 'confirm') {
      setStep('create');
    }
  };

  const handleDigitPress = async (digit: string) => {
    setErrorMsg('');

    if (step === 'unlock') {
      if (enteredPin.length < pinLength) {
        const next = enteredPin + digit;
        setEnteredPin(next);

        if (next.length === pinLength) {
          setIsLoading(true);
          const isValid = await verifyUserPin(userId, next);
          setIsLoading(false);
          if (isValid) {
            onUnlocked();
          } else {
            triggerError('Incorrect PIN. Please try again.');
          }
        }
      }
    } else if (step === 'create' || step === 'new_pin_after_recovery') {
      if (enteredPin.length < pinLength) {
        const next = enteredPin + digit;
        setEnteredPin(next);

        if (next.length === pinLength) {
          setTimeout(() => {
            setStep('confirm');
          }, 200);
        }
      }
    } else if (step === 'confirm') {
      if (confirmPin.length < pinLength) {
        const next = confirmPin + digit;
        setConfirmPin(next);

        if (next.length === pinLength) {
          if (next === enteredPin) {
            if (isSetupMode) {
              // Proceed to set recovery phrase
              setStep('recovery_setup');
            } else {
              // Finalizing new PIN after recovery
              setIsLoading(true);
              try {
                await resetPinWithRecoveryPhrase(userId, recoveryPhrase, enteredPin, pinLength);
                onPinConfigUpdated({
                  pinHash: 'active',
                  pinLength,
                  salt: '',
                  recoveryHash: pinConfig?.recoveryHash,
                  recoverySalt: '',
                  recoveryHint: pinConfig?.recoveryHint,
                  updatedAt: new Date().toISOString(),
                });
                onUnlocked();
              } catch (e) {
                triggerError('Failed to save new PIN in cloud.');
              } finally {
                setIsLoading(false);
              }
            }
          } else {
            triggerError('PINs did not match. Please re-enter your PIN.');
          }
        }
      }
    }
  };

  const handleDelete = () => {
    setErrorMsg('');
    if (step === 'confirm') {
      setConfirmPin((prev) => prev.slice(0, -1));
    } else {
      setEnteredPin((prev) => prev.slice(0, -1));
    }
  };

  const handleClear = () => {
    setErrorMsg('');
    setEnteredPin('');
    setConfirmPin('');
    if (step === 'confirm') setStep('create');
  };

  const handleFinishSetupWithRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryPhrase.trim() || recoveryPhrase.trim().length < 3) {
      setErrorMsg('Please enter a secret recovery phrase (at least 3 characters).');
      return;
    }

    setIsLoading(true);
    try {
      await savePinConfig(userId, enteredPin, pinLength, recoveryPhrase.trim(), recoveryHint.trim());
      onPinConfigUpdated({
        pinHash: 'active',
        pinLength,
        salt: '',
        recoveryHash: 'active',
        recoverySalt: '',
        recoveryHint: recoveryHint.trim() || undefined,
        updatedAt: new Date().toISOString(),
      });
      onUnlocked();
    } catch {
      triggerError('Failed to save security configuration. Please retry.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyForgotPhrase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryPhrase.trim()) {
      setErrorMsg('Please enter your Secret Recovery Phrase.');
      return;
    }

    setIsLoading(true);
    const isValid = await verifyRecoveryPhrase(userId, recoveryPhrase.trim());
    setIsLoading(false);

    if (isValid) {
      setStep('new_pin_after_recovery');
      setEnteredPin('');
      setConfirmPin('');
      setErrorMsg('');
    } else {
      triggerError('Incorrect recovery phrase. Access denied.');
    }
  };

  const activeValue = step === 'confirm' ? confirmPin : enteredPin;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl">
      <div
        className={`w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center transition-all duration-300 ${
          isShaking ? 'animate-shake' : ''
        }`}
      >
        {/* Shield Icon Badge */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/10">
          {step === 'unlock' ? (
            <Lock className="w-8 h-8 text-emerald-400 stroke-[2.2]" />
          ) : step === 'recovery_setup' || step === 'forgot_phrase' ? (
            <HelpCircle className="w-8 h-8 text-amber-400 stroke-[2.2]" />
          ) : (
            <KeyRound className="w-8 h-8 text-cyan-400 stroke-[2.2]" />
          )}
        </div>

        {/* Title & Instructions */}
        <h2 className="text-xl font-bold text-white tracking-tight">
          {step === 'unlock'
            ? 'SpendWise Security PIN'
            : step === 'confirm'
            ? 'Confirm Your Passcode'
            : step === 'recovery_setup'
            ? 'Set Secret Recovery Phrase'
            : step === 'forgot_phrase'
            ? 'Emergency Account Recovery'
            : step === 'new_pin_after_recovery'
            ? 'Set Your New Passcode'
            : 'Set Up Security Passcode'}
        </h2>

        <p className="text-xs text-slate-400 mt-1 mb-5">
          {step === 'unlock'
            ? `Enter your ${pinLength}-digit passcode to unlock your expense ledger`
            : step === 'confirm'
            ? 'Re-enter the exact same digits to confirm'
            : step === 'recovery_setup'
            ? 'A secret phrase to ensure only YOU can recover your PIN if forgotten'
            : step === 'forgot_phrase'
            ? 'Enter the secret recovery phrase you chose during setup'
            : step === 'new_pin_after_recovery'
            ? `Choose a new ${pinLength}-digit PIN`
            : `Choose a secure ${pinLength}-digit PIN to protect your financial data`}
        </p>

        {/* Setup Mode: Length selector (5 vs 6 digit toggle) */}
        {isSetupMode && step === 'create' && (
          <div className="flex items-center gap-1.5 p-1 bg-slate-800/80 rounded-xl border border-slate-700/60 mb-5 text-xs font-semibold">
            <span className="text-slate-400 px-2 flex items-center gap-1">
              <Hash className="w-3.5 h-3.5" /> Length:
            </span>
            <button
              type="button"
              onClick={() => {
                setPinLength(5);
                setEnteredPin('');
              }}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                pinLength === 5
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              5 Digits
            </button>
            <button
              type="button"
              onClick={() => {
                setPinLength(6);
                setEnteredPin('');
              }}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                pinLength === 6
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              6 Digits
            </button>
          </div>
        )}

        {/* Error Message */}
        {errorMsg && (
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-xl mb-4 w-full">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Step: Recovery Phrase Setup */}
        {step === 'recovery_setup' ? (
          <form onSubmit={handleFinishSetupWithRecovery} className="w-full space-y-3.5">
            <div className="text-left">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Secret Phrase / Keyword *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. green-tiger or secret-dhaka-42"
                value={recoveryPhrase}
                onChange={(e) => setRecoveryPhrase(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="text-left">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Hint / Security Question (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. My favorite car or childhood school"
                value={recoveryHint}
                onChange={(e) => setRecoveryHint(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <p className="text-[11px] text-slate-400 text-left">
              This phrase is cryptographically hashed with SHA-256. Only someone with this exact phrase can reset the PIN.
            </p>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span>{isLoading ? 'Saving...' : 'Finish Setup & Lock'}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>
        ) : step === 'forgot_phrase' ? (
          /* Step: Forgot PIN / Enter Secret Recovery Phrase */
          <form onSubmit={handleVerifyForgotPhrase} className="w-full space-y-3.5">
            {pinConfig?.recoveryHint && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-left text-xs text-amber-300">
                <span className="font-semibold block mb-0.5">Your Security Hint:</span>
                <span className="italic">{pinConfig.recoveryHint}</span>
              </div>
            )}

            <div className="text-left">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Enter Secret Recovery Phrase *
              </label>
              <input
                type="text"
                required
                placeholder="Type your secret recovery phrase"
                value={recoveryPhrase}
                onChange={(e) => setRecoveryPhrase(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setStep('unlock');
                  setErrorMsg('');
                  setEnteredPin('');
                }}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Back to PIN
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md cursor-pointer disabled:opacity-50"
              >
                {isLoading ? 'Verifying...' : 'Verify Phrase'}
              </button>
            </div>
          </form>
        ) : (
          /* Numeric Keypad & PIN Dots Display */
          <>
            {/* Pin Dots Display */}
            <div className="flex items-center justify-center gap-3 mb-6">
              {Array.from({ length: pinLength }).map((_, idx) => {
                const isFilled = idx < activeValue.length;
                return (
                  <div
                    key={idx}
                    className={`w-4 h-4 rounded-full transition-all duration-200 border-2 ${
                      isFilled
                        ? 'bg-emerald-400 border-emerald-400 scale-110 shadow-md shadow-emerald-400/30'
                        : 'bg-slate-800 border-slate-600'
                    }`}
                  />
                );
              })}
            </div>

            {/* Keypad Grid (1-9, Clear, 0, Backspace) */}
            <div className="grid grid-cols-3 gap-3 w-full max-w-[260px] mb-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleDigitPress(digit.toString())}
                  disabled={isLoading}
                  className="h-14 rounded-2xl bg-slate-800/80 hover:bg-slate-700 active:scale-90 border border-slate-700/80 hover:border-slate-600 text-xl font-bold text-white transition-all flex items-center justify-center cursor-pointer shadow-sm"
                >
                  {digit}
                </button>
              ))}

              {/* Clear */}
              <button
                type="button"
                onClick={handleClear}
                disabled={isLoading || activeValue.length === 0}
                className="h-14 rounded-2xl bg-slate-800/40 hover:bg-slate-800 active:scale-95 text-xs font-semibold text-slate-400 hover:text-white transition-all flex items-center justify-center cursor-pointer"
              >
                Clear
              </button>

              {/* 0 */}
              <button
                type="button"
                onClick={() => handleDigitPress('0')}
                disabled={isLoading}
                className="h-14 rounded-2xl bg-slate-800/80 hover:bg-slate-700 active:scale-90 border border-slate-700/80 hover:border-slate-600 text-xl font-bold text-white transition-all flex items-center justify-center cursor-pointer shadow-sm"
              >
                0
              </button>

              {/* Backspace */}
              <button
                type="button"
                onClick={handleDelete}
                disabled={isLoading || activeValue.length === 0}
                className="h-14 rounded-2xl bg-slate-800/40 hover:bg-slate-800 active:scale-95 text-slate-400 hover:text-white transition-all flex items-center justify-center cursor-pointer"
                aria-label="Delete last digit"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>

            {/* In Unlock mode: ONLY show "Forgot PIN? (Recover with Secret Phrase)" if recovery phrase was set */}
            {step === 'unlock' && pinConfig?.recoveryHash && (
              <div className="mt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setStep('forgot_phrase');
                    setErrorMsg('');
                    setRecoveryPhrase('');
                  }}
                  className="text-xs text-slate-400 hover:text-amber-400 transition-colors font-medium flex items-center gap-1 mx-auto cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                  Forgot PIN? Recover with Secret Phrase
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
