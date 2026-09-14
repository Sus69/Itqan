import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  type AuthUser,
  type AuthTokenResponse,
  loginUser,
  registerUser,
  getAuthMe,
} from '@/lib/api';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  /**
   * True when the session is a browser-only demo: the backend rejected the demo
   * credentials, so the profile and its figures are local fabrications and
   * nothing recorded will reach a server. Every surface that reports where data
   * was saved reads this rather than sniffing the token itself.
   */
  isDemo: boolean;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  authModalTab: 'login' | 'register' | 'demo';
  openAuthModal: (tab?: 'login' | 'register' | 'demo') => void;
  closeAuthModal: () => void;
  login: (username_or_email: string, password: string) => Promise<AuthTokenResponse>;
  register: (payload: {
    email: string;
    username: string;
    full_name: string;
    password: string;
    reference_qari_name?: string;
  }) => Promise<AuthTokenResponse>;
  demoLogin: (account: 'ahmed' | 'fatima' | 'demo') => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'itqan_auth_token';
/** Prefix of the local-only token minted when a demo sign-in cannot reach the API. */
const DEMO_TOKEN_PREFIX = 'demo_token_';

/**
 * Demo personas.
 *
 * These exist so the interface can be explored without signing up. `streak` and
 * `xp` are illustrative starting figures, not a record of anything, and the UI
 * that shows them must say so — see `isDemo`.
 */
export const DEMO_ACCOUNTS = [
  {
    key: 'ahmed' as const,
    name: 'Ahmed Al-Mansoor',
    username: 'ahmed_qari',
    email: 'ahmed@itqan.app',
    password: 'Password123!',
    role: 'Advanced persona',
    streak: 14,
    xp: 1450,
    qari: 'Mahmoud Khalil Al-Hussary',
    avatarBg: 'from-brand-500 to-brand-800',
    description: 'Explores the app as a confident reciter polishing individual rules.',
  },
  {
    key: 'fatima' as const,
    name: 'Fatima Az-Zahra',
    username: 'fatima_reciter',
    email: 'fatima@itqan.app',
    password: 'Password123!',
    role: 'Intermediate persona',
    streak: 7,
    xp: 720,
    qari: 'Mishary Rashid Alafasy',
    avatarBg: 'from-gold-400 to-gold-700',
    description: 'Explores the app while working through Noon Saakinah and Sifaat.',
  },
  {
    key: 'demo' as const,
    name: 'Demo Student',
    username: 'demo_user',
    email: 'demo@itqan.app',
    password: 'Password123!',
    role: 'Beginner persona',
    streak: 3,
    xp: 260,
    qari: 'Abdul Basit Abdul Samad',
    avatarBg: 'from-sand-500 to-sand-800',
    description: 'Explores the app from the beginning: Madani Qaida and Makhaarij.',
  },
];

/** The local-only profile behind a demo token. Its figures are illustrative. */
function buildDemoUser(account: (typeof DEMO_ACCOUNTS)[number]): AuthUser {
  return {
    id: `usr_${account.key}_demo`,
    email: account.email,
    username: account.username,
    full_name: account.name,
    reference_qari_name: account.qari,
    target_daily_minutes: 15,
    streak_days: account.streak,
    total_xp: account.xp,
    created_at: new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register' | 'demo'>('login');

  const refreshUser = useCallback(async () => {
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    // A local demo token has no server behind it — asking would only 401 and
    // sign the learner straight back out on every reload. Restore the local
    // profile instead, and leave `isDemo` to tell the rest of the app that
    // nothing here is server-backed.
    if (token.startsWith(DEMO_TOKEN_PREFIX)) {
      const account = DEMO_ACCOUNTS.find(
        (a) => a.key === token.slice(DEMO_TOKEN_PREFIX.length),
      );
      setUser(account ? buildDemoUser(account) : null);
      if (!account) {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
      }
      setIsLoading(false);
      return;
    }
    try {
      const me = await getAuthMe(token);
      setUser(me);
    } catch {
      // Token invalid or expired
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const openAuthModal = (tab: 'login' | 'register' | 'demo' = 'login') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const login = async (username_or_email: string, password: string) => {
    const res = await loginUser({ username_or_email, password });
    localStorage.setItem(TOKEN_KEY, res.access_token);
    setToken(res.access_token);
    setUser({
      id: res.user_id,
      email: res.email,
      username: res.username,
      full_name: res.full_name,
      reference_qari_name: res.reference_qari_name,
      target_daily_minutes: 15,
      streak_days: res.streak_days,
      total_xp: res.total_xp,
      created_at: new Date().toISOString(),
    });
    setIsAuthModalOpen(false);
    return res;
  };

  const register = async (payload: {
    email: string;
    username: string;
    full_name: string;
    password: string;
    reference_qari_name?: string;
  }) => {
    const res = await registerUser(payload);
    localStorage.setItem(TOKEN_KEY, res.access_token);
    setToken(res.access_token);
    setUser({
      id: res.user_id,
      email: res.email,
      username: res.username,
      full_name: res.full_name,
      reference_qari_name: res.reference_qari_name,
      target_daily_minutes: 15,
      streak_days: res.streak_days,
      total_xp: res.total_xp,
      created_at: new Date().toISOString(),
    });
    setIsAuthModalOpen(false);
    return res;
  };

  const demoLogin = async (accountKey: 'ahmed' | 'fatima' | 'demo') => {
    const account = DEMO_ACCOUNTS.find((a) => a.key === accountKey);
    if (!account) return;
    try {
      await login(account.email, account.password);
    } catch (err) {
      console.warn('Backend login failed, using local-only demo session:', err);
      // Fall back to a browser-only session so the demo still works offline.
      // `isDemo` then reports, everywhere it matters, that nothing is being saved.
      setUser(buildDemoUser(account));
      localStorage.setItem(TOKEN_KEY, `${DEMO_TOKEN_PREFIX}${account.key}`);
      setToken(`${DEMO_TOKEN_PREFIX}${account.key}`);
      setIsAuthModalOpen(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isDemo: token?.startsWith(DEMO_TOKEN_PREFIX) ?? false,
        isLoading,
        isAuthModalOpen,
        authModalTab,
        openAuthModal,
        closeAuthModal,
        login,
        register,
        demoLogin,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
