import React, { useState } from 'react';
import { useAuth, DEMO_ACCOUNTS } from '@/lib/authContext';
import { Icon } from '@/components/Icon';
import { cn } from '@/lib/cn';

export function AuthModal() {
  const { isAuthModalOpen, authModalTab, closeAuthModal, login, register, demoLogin } =
    useAuth();

  const [tab, setTab] = useState<'login' | 'register' | 'demo'>(authModalTab);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeDemoKey, setActiveDemoKey] = useState<string | null>(null);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regQari, setRegQari] = useState('Mahmoud Khalil Al-Hussary');

  // Sync internal tab if modal opened with specific tab
  React.useEffect(() => {
    setTab(authModalTab);
    setError(null);
    setActiveDemoKey(null);
  }, [authModalTab, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(loginIdentifier, loginPassword);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed. Please check your credentials.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await register({
        full_name: regFullName,
        username: regUsername,
        email: regEmail,
        password: regPassword,
        reference_qari_name: regQari,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed. Please verify your details.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoClick = async (accountKey: 'ahmed' | 'fatima' | 'demo') => {
    setError(null);
    setIsSubmitting(true);
    setActiveDemoKey(accountKey);
    try {
      await demoLogin(accountKey);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Demo login failed.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
      setActiveDemoKey(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/50 backdrop-blur-md transition-opacity animate-fade-in"
        onClick={closeAuthModal}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/40 bg-white p-6 shadow-2xl transition-all sm:p-8">
        {/* Close Button */}
        <button
          type="button"
          onClick={closeAuthModal}
          className="absolute right-5 top-5 grid size-9 place-items-center rounded-full bg-sand-100 text-ink-soft hover:bg-sand-200 hover:text-ink transition-colors"
        >
          <Icon name="close" size={18} />
        </button>

        {/* Modal Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 text-white shadow-md">
            <Icon name="mosque" size={24} />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-ink">
            {tab === 'login' && 'Sign in to Itqān'}
            {tab === 'register' && 'Join the Itqān Community'}
            {tab === 'demo' && 'Quick Demo Accounts'}
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            {tab === 'login' && 'Access your personalized Tajweed progress, streaks, and recordings.'}
            {tab === 'register' && 'Create your free account to track mastery and AI feedback.'}
            {tab === 'demo' && 'Select an authentic pre-configured profile to explore instantly.'}
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 grid grid-cols-3 gap-1 rounded-2xl bg-sand-100 p-1">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setError(null);
            }}
            className={cn(
              'rounded-xl py-2 text-xs font-bold transition-all',
              tab === 'login'
                ? 'bg-white text-brand-800 shadow-sm'
                : 'text-ink-soft hover:text-ink',
            )}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('register');
              setError(null);
            }}
            className={cn(
              'rounded-xl py-2 text-xs font-bold transition-all',
              tab === 'register'
                ? 'bg-white text-brand-800 shadow-sm'
                : 'text-ink-soft hover:text-ink',
            )}
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('demo');
              setError(null);
            }}
            className={cn(
              'rounded-xl py-2 text-xs font-bold transition-all',
              tab === 'demo'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-brand-700 hover:text-brand-800',
            )}
          >
            ⭐ 1-Click Demo
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
            {error}
          </div>
        )}

        {/* Tab 1: Login */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-soft mb-1.5">
                Email or Username
              </label>
              <input
                type="text"
                required
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                placeholder="e.g. ahmed@itqan.app or ahmed_qari"
                className="w-full rounded-xl border border-border bg-sand-50/50 px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-soft mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-border bg-sand-50/50 px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-brand-600 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-brand-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>

            <div className="pt-2 text-center text-xs text-ink-soft">
              Want to explore without typing?{' '}
              <button
                type="button"
                onClick={() => setTab('demo')}
                className="font-bold text-brand-700 hover:underline"
              >
                Use 1-Click Demo Accounts
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Register */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-soft mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={regFullName}
                onChange={(e) => setRegFullName(e.target.value)}
                placeholder="e.g. Tariq Mansoor"
                className="w-full rounded-xl border border-border bg-sand-50/50 px-3.5 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-soft mb-1">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="tariq_qari"
                  className="w-full rounded-xl border border-border bg-sand-50/50 px-3.5 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-soft mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="tariq@example.com"
                  className="w-full rounded-xl border border-border bg-sand-50/50 px-3.5 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-soft mb-1">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full rounded-xl border border-border bg-sand-50/50 px-3.5 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-soft mb-1">
                Reference Qari
              </label>
              <select
                value={regQari}
                onChange={(e) => setRegQari(e.target.value)}
                className="w-full rounded-xl border border-border bg-sand-50/50 px-3.5 py-2 text-sm text-ink focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="Mahmoud Khalil Al-Hussary">Mahmoud Khalil Al-Husary (Egyptian Murattal)</option>
                <option value="Mishary Rashid Alafasy">Mishary Rashid Alafasy (Kuwaiti Melodic)</option>
                <option value="Abdul Basit Abdul Samad">Abdul Basit Abdul Samad (Classic Mujawwad)</option>
                <option value="Saad Al-Ghamdi">Saad Al-Ghamdi (Saudi Murattal)</option>
                <option value="Abu Bakr Al-Shatri">Abu Bakr Al-Shatri (Paced Emotive)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-brand-600 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-brand-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        )}

        {/* Tab 3: Demo Accounts */}
        {tab === 'demo' && (
          <div className="space-y-3">
            <p className="text-xs text-ink-soft leading-relaxed">
              Click any demo persona to log in instantly with preloaded streaks, recorded masteries, and recitation logs:
            </p>

            <div className="space-y-2.5">
              {DEMO_ACCOUNTS.map((acc) => {
                const isSelected = activeDemoKey === acc.key;
                return (
                  <button
                    key={acc.key}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleDemoClick(acc.key)}
                    className={cn(
                      'group flex w-full items-center justify-between rounded-2xl border p-3.5 text-left transition-all',
                      isSelected
                        ? 'border-brand-600 bg-brand-50/80 ring-2 ring-brand-500/30'
                        : 'border-border bg-sand-50/70 hover:border-brand-500 hover:bg-brand-50/50 hover:shadow-sm',
                      isSubmitting && !isSelected && 'opacity-50 cursor-not-allowed',
                    )}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={cn(
                          'grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white font-black text-sm shadow-sm',
                          acc.avatarBg,
                        )}
                      >
                        {isSelected ? (
                          <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                          acc.name.charAt(0)
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-ink group-hover:text-brand-800">
                            {acc.name}
                          </span>
                          <span className="rounded-md bg-white px-2 py-0.5 text-[10px] font-bold text-ink-soft border border-border/80">
                            {isSelected ? 'Signing in...' : acc.role}
                          </span>
                        </div>
                        <p className="text-xs text-ink-soft mt-0.5 line-clamp-1">{acc.description}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1 font-bold text-xs text-gold-700">
                        <span>🔥</span>
                        <span>{acc.streak}d streak</span>
                      </div>
                      <span className="text-[11px] font-semibold text-brand-700">
                        {acc.xp} XP
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
