import { useEffect, useId, useState, type FormEvent } from 'react';
import { useAuth, DEMO_ACCOUNTS } from '@/lib/authContext';
import { Icon } from '@/components/Icon';
import { Button, InlineNotice, Modal } from '@/components/ui';
import { cn } from '@/lib/cn';

/**
 * Sign in / create account / demo personas.
 *
 * Built on the shared Modal so it inherits the focus trap, the Escape key and
 * the dialog semantics. The demo tab states plainly that its figures are
 * illustrative and that a demo session may be browser-only, because the app
 * must never imply a record the learner has not built.
 */
type Tab = 'login' | 'register' | 'demo';

const TABS: { id: Tab; label: string }[] = [
  { id: 'login', label: 'Sign in' },
  { id: 'register', label: 'Create account' },
  { id: 'demo', label: 'Try a demo' },
];

const HEADINGS: Record<Tab, { title: string; description: string }> = {
  login: {
    title: 'Sign in to Itqān',
    description: 'Your lessons and analysed recitations follow you across devices.',
  },
  register: {
    title: 'Create your account',
    description: 'Free, and it keeps your recitation history rather than leaving it on one device.',
  },
  demo: {
    title: 'Explore with a demo persona',
    description: 'No sign-up. Pick a persona and the whole interface is available immediately.',
  },
};

const QARI_OPTIONS = [
  ['Mahmoud Khalil Al-Hussary', 'Mahmoud Khalil Al-Husary — Egyptian Murattal'],
  ['Mishary Rashid Alafasy', 'Mishary Rashid Alafasy — Kuwaiti melodic'],
  ['Abdul Basit Abdul Samad', 'Abdul Basit Abdul Samad — classic Mujawwad'],
  ['Saad Al-Ghamdi', 'Saad Al-Ghamdi — Saudi Murattal'],
  ['Abu Bakr Al-Shatri', 'Abu Bakr Al-Shatri — paced and emotive'],
];

const fieldClass =
  'w-full rounded-xl border border-border bg-surface-1 px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-brand-500 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand-500/20';
const labelClass = 'mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-soft';

export function AuthModal() {
  const { isAuthModalOpen, authModalTab, closeAuthModal, login, register, demoLogin } = useAuth();

  const [tab, setTab] = useState<Tab>(authModalTab);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeDemoKey, setActiveDemoKey] = useState<string | null>(null);
  const ids = useId();

  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regQari, setRegQari] = useState(QARI_OPTIONS[0][0]);

  // Opening the modal with a specific tab must always win over the last one used.
  useEffect(() => {
    setTab(authModalTab);
    setError(null);
    setActiveDemoKey(null);
  }, [authModalTab, isAuthModalOpen]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(loginIdentifier, loginPassword);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Those details were not accepted. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: FormEvent) => {
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
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'The account could not be created. Please try again.',
      );
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That demo session could not be started.');
    } finally {
      setIsSubmitting(false);
      setActiveDemoKey(null);
    }
  };

  return (
    <Modal
      open={isAuthModalOpen}
      onClose={closeAuthModal}
      title={HEADINGS[tab].title}
      description={HEADINGS[tab].description}
    >
      <div role="tablist" aria-label="Account options" className="grid grid-cols-3 gap-1 rounded-2xl bg-sand-100 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`${ids}-tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`${ids}-panel-${t.id}`}
            onClick={() => {
              setTab(t.id);
              setError(null);
            }}
            className={cn(
              'rounded-xl py-2 text-xs font-bold transition-all',
              tab === t.id ? 'bg-surface text-brand-800 shadow-sm' : 'text-ink-soft hover:text-ink',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <InlineNotice tone="error" title="That did not work" className="mt-4">
          {error}
        </InlineNotice>
      )}

      {tab === 'login' && (
        <form
          role="tabpanel"
          id={`${ids}-panel-login`}
          aria-labelledby={`${ids}-tab-login`}
          onSubmit={handleLogin}
          className="mt-5 space-y-4"
        >
          <div>
            <label className={labelClass} htmlFor={`${ids}-identifier`}>
              Email or username
            </label>
            <input
              id={`${ids}-identifier`}
              type="text"
              required
              autoComplete="username"
              value={loginIdentifier}
              onChange={(e) => setLoginIdentifier(e.target.value)}
              placeholder="ahmed@itqan.app"
              className={fieldClass}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor={`${ids}-password`}>
              Password
            </label>
            <input
              id={`${ids}-password`}
              type="password"
              required
              autoComplete="current-password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="••••••••"
              className={fieldClass}
            />
          </div>

          <Button type="submit" fullWidth size="lg" loading={isSubmitting}>
            {isSubmitting ? 'Signing in' : 'Sign in'}
          </Button>

          <p className="text-center text-xs text-ink-soft">
            Rather look around first?{' '}
            <button
              type="button"
              onClick={() => setTab('demo')}
              className="font-bold text-brand-700 hover:underline"
            >
              Use a demo persona
            </button>
          </p>
        </form>
      )}

      {tab === 'register' && (
        <form
          role="tabpanel"
          id={`${ids}-panel-register`}
          aria-labelledby={`${ids}-tab-register`}
          onSubmit={handleRegister}
          className="mt-5 max-h-[55vh] space-y-3.5 overflow-y-auto pr-1"
        >
          <div>
            <label className={labelClass} htmlFor={`${ids}-fullname`}>
              Full name
            </label>
            <input
              id={`${ids}-fullname`}
              type="text"
              required
              autoComplete="name"
              value={regFullName}
              onChange={(e) => setRegFullName(e.target.value)}
              placeholder="Tariq Mansoor"
              className={fieldClass}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor={`${ids}-username`}>
                Username
              </label>
              <input
                id={`${ids}-username`}
                type="text"
                required
                autoComplete="username"
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                placeholder="tariq_qari"
                className={fieldClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor={`${ids}-email`}>
                Email
              </label>
              <input
                id={`${ids}-email`}
                type="email"
                required
                autoComplete="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="tariq@example.com"
                className={fieldClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor={`${ids}-new-password`}>
              Password
            </label>
            <input
              id={`${ids}-new-password`}
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={regPassword}
              onChange={(e) => setRegPassword(e.target.value)}
              placeholder="At least 6 characters"
              className={fieldClass}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor={`${ids}-qari`}>
              Reference Qari
            </label>
            <select
              id={`${ids}-qari`}
              value={regQari}
              onChange={(e) => setRegQari(e.target.value)}
              className={fieldClass}
            >
              {QARI_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-ink-faint">
              A preference only — you can change it any time, and it does not affect your feedback.
            </p>
          </div>

          <Button type="submit" fullWidth size="lg" loading={isSubmitting}>
            {isSubmitting ? 'Creating your account' : 'Create account'}
          </Button>
        </form>
      )}

      {tab === 'demo' && (
        <div
          role="tabpanel"
          id={`${ids}-panel-demo`}
          aria-labelledby={`${ids}-tab-demo`}
          className="mt-5 space-y-3"
        >
          <InlineNotice tone="info" title="What a demo persona is">
            A persona lets you use every screen straight away. Its streak and XP are illustrative
            starting figures, not a record — and if the service is unreachable the session runs
            entirely in this browser, so nothing is saved to an account.
          </InlineNotice>

          <ul className="space-y-2.5">
            {DEMO_ACCOUNTS.map((acc) => {
              const isSelected = activeDemoKey === acc.key;
              return (
                <li key={acc.key}>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => void handleDemoClick(acc.key)}
                    className={cn(
                      'group flex w-full items-center gap-3.5 rounded-2xl border p-3.5 text-left transition-all',
                      isSelected
                        ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-500/30'
                        : 'border-border bg-surface-1 hover:border-brand-400 hover:shadow-[var(--shadow-soft)]',
                      isSubmitting && !isSelected && 'cursor-not-allowed opacity-50',
                    )}
                  >
                    <span
                      className={cn(
                        'grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-sm font-black text-white shadow-sm',
                        acc.avatarBg,
                      )}
                      aria-hidden="true"
                    >
                      {isSelected ? (
                        <span className="anim-spin size-4 rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        acc.name.charAt(0)
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-ink group-hover:text-brand-800">
                          {acc.name}
                        </span>
                        <span className="rounded-md border border-border bg-surface px-2 py-0.5 text-[10px] font-bold text-ink-soft">
                          {isSelected ? 'Signing in' : acc.role}
                        </span>
                      </span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-ink-soft">
                        {acc.description}
                      </span>
                    </span>
                    <Icon
                      name="arrowRight"
                      size={16}
                      className="shrink-0 text-ink-faint group-hover:text-brand-700"
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </Modal>
  );
}
