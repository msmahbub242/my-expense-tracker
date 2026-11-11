import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  Unlock,
  Delete,
  RotateCcw,
  KeyRound,
  Check,
  AlertCircle,
  Hash,
} from 'lucide-react';
import { PinData, savePinConfig, verifyUserPin, removePinConfig } from '../services/pinService.ts';

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
  const [step, setStep] = useState<'create' | 'confirm' | 'unlock'>('create');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

  useEffect(() => {
    if (pinConfig) {
      setStep('unlock');
      setPinLength(pinConfig.pinLength || 6);
    } else {
      setStep('create');
    }
    setEnteredPin('');
    setConfirmPin('');
    setErrorMsg('');
  }, [pinConfig]);

  // Physical keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLoading) return;
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
    if (isSetupMode) {
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
    } else if (step === 'create') {
      if (enteredPin.length < pinLength) {
        const next = enteredPin + digit;
        setEnteredPin(next);

        if (next.length === pinLength) {
          // Move to confirm step
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
            setIsLoading(true);
            try {
              await savePinConfig(userId, enteredPin, pinLength);
              onPinConfigUpdated({
                pinHash: 'active',
                pinLength,
                salt: '',
                updatedAt: new Date().toISOString(),
              });
              onUnlocked();
            } catch (e) {
              triggerError('Failed to save PIN in cloud. Please retry.');
            } finally {
              setIsLoading(false);
            }
          } else {
            triggerError('PINs did not match. Please enter your PIN again.');
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

  const handleResetPin = async () => {
    setIsLoading(true);
    await removePinConfig(userId);
    onPinConfigUpdated(null);
    setStep('create');
    setEnteredPin('');
    setConfirmPin('');
    setShowResetConfirm(false);
    setIsLoading(false);
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
            : 'Set Up Security Passcode'}
        </h2>
        <p className="text-xs text-slate-400 mt-1 mb-5">
          {step === 'unlock'
            ? `Enter your ${pinLength}-digit passcode to unlock your expense ledger`
            : step === 'confirm'
            ? 'Re-enter the exact same digits to confirm'
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

        {/* Error Message */}
        {errorMsg && (
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-xl mb-4 w-full">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

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

        {/* Footer / Reset Action */}
        {pinConfig && (
          <div className="mt-2 text-center">
            {!showResetConfirm ? (
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="text-xs text-slate-400 hover:text-rose-400 transition-colors font-medium flex items-center gap-1 mx-auto cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Reset Security Passcode
              </button>
            ) : (
              <div className="p-3 bg-slate-800/90 border border-slate-700 rounded-xl space-y-2 text-xs">
                <p className="text-slate-300">Are you sure you want to reset your passcode?</p>
                <div className="flex justify-center gap-2">
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="px-2.5 py-1 rounded-lg bg-slate-700 text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleResetPin}
                    className="px-2.5 py-1 rounded-lg bg-rose-500 text-white font-bold"
                  >
                    Confirm Reset
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
