import React, { useState } from 'react';
import {
  X,
  Shield,
  KeyRound,
  Lock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Hash,
  Save,
} from 'lucide-react';
import {
  PinData,
  changePinWithOldPin,
  removePinWithOldPin,
  savePinConfig,
} from '../services/pinService.ts';

interface SecuritySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  pinConfig: PinData | null;
  onPinConfigUpdated: (newCfg: PinData | null) => void;
}

export const SecuritySettingsModal: React.FC<SecuritySettingsModalProps> = ({
  isOpen,
  onClose,
  userId,
  pinConfig,
  onPinConfigUpdated,
}) => {
  const [currentPin, setCurrentPin] = useState('');
  const [newLength, setNewLength] = useState<number>(pinConfig?.pinLength || 6);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [recoveryPhrase, setRecoveryPhrase] = useState('');
  const [recoveryHint, setRecoveryHint] = useState(pinConfig?.recoveryHint || '');

  const [activeTab, setActiveTab] = useState<'pin' | 'recovery' | 'status'>('pin');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (newPin.length !== newLength) {
      setErrorMsg(`New PIN must be exactly ${newLength} digits.`);
      return;
    }
    if (newPin !== confirmPin) {
      setErrorMsg('New PIN and confirmation PIN do not match.');
      return;
    }

    setIsLoading(true);
    try {
      if (pinConfig) {
        const res = await changePinWithOldPin(
          userId,
          currentPin,
          newPin,
          newLength,
          recoveryPhrase || undefined,
          recoveryHint || undefined
        );
        if (res.success) {
          setSuccessMsg('PIN successfully updated in Firebase Cloud!');
          onPinConfigUpdated({
            pinHash: 'active',
            pinLength: newLength,
            salt: '',
            recoveryHash: recoveryPhrase ? 'active' : pinConfig.recoveryHash,
            recoverySalt: '',
            recoveryHint: recoveryHint || pinConfig.recoveryHint,
            updatedAt: new Date().toISOString(),
          });
          setCurrentPin('');
          setNewPin('');
          setConfirmPin('');
        } else {
          setErrorMsg(res.error || 'Failed to update PIN. Check current PIN.');
        }
      } else {
        await savePinConfig(userId, newPin, newLength, recoveryPhrase, recoveryHint);
        setSuccessMsg('Security PIN configured in Firebase Cloud!');
        onPinConfigUpdated({
          pinHash: 'active',
          pinLength: newLength,
          salt: '',
          recoveryHash: recoveryPhrase ? 'active' : undefined,
          recoverySalt: '',
          recoveryHint,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      setErrorMsg('An error occurred while updating PIN.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!recoveryPhrase.trim()) {
      setErrorMsg('Please enter a secret recovery phrase (at least 4 characters).');
      return;
    }

    setIsLoading(true);
    try {
      const res = await changePinWithOldPin(
        userId,
        currentPin,
        pinConfig?.pinLength ? (currentPin as string) : '123456',
        pinConfig?.pinLength || 6,
        recoveryPhrase.trim(),
        recoveryHint.trim()
      );
      if (res.success) {
        setSuccessMsg('Secret recovery phrase updated in Firebase Cloud!');
        setCurrentPin('');
      } else {
        setErrorMsg(res.error || 'Current PIN verification failed.');
      }
    } catch {
      setErrorMsg('Failed to update recovery phrase.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisablePin = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    if (!currentPin) {
      setErrorMsg('Please enter your current PIN to disable protection.');
      return;
    }

    if (confirm('Are you sure you want to disable PIN protection on your ledger?')) {
      setIsLoading(true);
      const res = await removePinWithOldPin(userId, currentPin);
      setIsLoading(false);

      if (res.success) {
        onPinConfigUpdated(null);
        setSuccessMsg('PIN protection disabled.');
        setTimeout(() => onClose(), 1200);
      } else {
        setErrorMsg(res.error || 'Current PIN is incorrect.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Vault Security & PIN Settings</h3>
              <p className="text-xs text-slate-400">Dedicated Owner Vault ({userId})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 p-2 gap-2 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('pin');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'pin'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            Change PIN
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('recovery');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'recovery'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Recovery Phrase
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('status');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'status'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            Vault Status
          </button>
        </div>

        {/* Alerts */}
        <div className="p-6 pt-4 space-y-4">
          {errorMsg && (
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3.5 py-2.5 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2.5 rounded-xl">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: Change PIN */}
          {activeTab === 'pin' && (
            <form onSubmit={handleChangePin} className="space-y-4">
              {pinConfig && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Current PIN *
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    required
                    placeholder="Enter current PIN"
                    value={currentPin}
                    onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-sm tracking-widest focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  New PIN Length
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setNewLength(5)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      newLength === 5
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    5 Digits
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewLength(6)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      newLength === 6
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    6 Digits
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    New PIN ({newLength} digits) *
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={newLength}
                    required
                    placeholder={`${newLength} digits`}
                    value={newPin}
                    onChange={(e) =>
                      setNewPin(e.target.value.replace(/\D/g, '').slice(0, newLength))
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-sm tracking-widest focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Confirm New PIN *
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={newLength}
                    required
                    placeholder="Repeat PIN"
                    value={confirmPin}
                    onChange={(e) =>
                      setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, newLength))
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-sm tracking-widest focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isLoading ? 'Updating...' : 'Save New PIN'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: Emergency Recovery Phrase */}
          {activeTab === 'recovery' && (
            <form onSubmit={handleUpdateRecovery} className="space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                If you ever forget your PIN, this Secret Recovery Phrase is the <strong className="text-white">only way</strong> to reset it.
                No unauthorized person on the lock screen can bypass or reset the PIN without it.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Current PIN (to verify ownership) *
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  required
                  placeholder="Enter current PIN"
                  value={currentPin}
                  onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-sm tracking-widest focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Secret Recovery Phrase / Answer *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. green-tiger-dhaka or My childhood pet name"
                  value={recoveryPhrase}
                  onChange={(e) => setRecoveryPhrase(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Optional Hint / Question
                </label>
                <input
                  type="text"
                  placeholder="e.g. What is my first school?"
                  value={recoveryHint}
                  onChange={(e) => setRecoveryHint(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isLoading ? 'Saving...' : 'Save Recovery Phrase'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: Vault Status & Single Owner Architecture */}
          {activeTab === 'status' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Target User Model:</span>
                  <span className="font-bold text-emerald-400">Single Dedicated Owner</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Cloud Vault ID:</span>
                  <span className="font-mono text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                    {userId}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">PIN Protection:</span>
                  <span className="font-semibold text-white">
                    {pinConfig ? `Active (${pinConfig.pinLength} Digits)` : 'Disabled'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Emergency Recovery:</span>
                  <span className="font-semibold text-white">
                    {pinConfig?.recoveryHash ? 'Configured' : 'Not Set (Set in Tab 2)'}
                  </span>
                </div>
              </div>

              {pinConfig && (
                <div className="pt-2 border-t border-slate-800">
                  <h4 className="text-xs font-bold text-rose-400 mb-1">Disable PIN Protection</h4>
                  <p className="text-[11px] text-slate-400 mb-2">
                    Enter your current PIN to turn off the lock screen.
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="password"
                      inputMode="numeric"
                      placeholder="Current PIN"
                      value={currentPin}
                      onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-rose-500"
                    />
                    <button
                      type="button"
                      onClick={handleDisablePin}
                      disabled={isLoading || !currentPin}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold cursor-pointer transition-colors disabled:opacity-40"
                    >
                      Disable PIN
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
