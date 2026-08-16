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

export const DEMO_ACCOUNTS = [
  {
    key: 'ahmed' as const,
    name: 'Ahmed Al-Mansoor',
    username: 'ahmed_qari',
    email: 'ahmed@itqan.app',
    password: 'Password123!',
    role: 'Advanced Student',
    streak: 14,
    xp: 1450,
    qari: 'Mahmoud Khalil Al-Hussary',
    avatarBg: 'from-emerald-500 to-teal-700',
    description: 'Mastered several Tajweed & Qaida lessons with 14-day streak.',
  },
  {
    key: 'fatima' as const,
    name: 'Fatima Az-Zahra',
    username: 'fatima_reciter',
    email: 'fatima@itqan.app',
    password: 'Password123!',
    role: 'Intermediate Reciter',
    streak: 7,
    xp: 720,
    qari: 'Mishary Rashid Alafasy',
    avatarBg: 'from-purple-500 to-indigo-700',
    description: 'Practicing Noon Saakinah and Sifaat with 7-day streak.',
  },
  {
    key: 'demo' as const,
    name: 'Demo Student',
    username: 'demo_user',
    email: 'demo@itqan.app',
    password: 'Password123!',
    role: 'Beginner Learner',
    streak: 3,
    xp: 260,
    qari: 'Abdul Basit Abdul Samad',
    avatarBg: 'from-amber-500 to-orange-700',
    description: 'Starting out with Madani Qaida and basic Makharij.',
  },
];

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
      console.warn('Backend login failed, using resilient local session:', err);
      // Fallback gracefully so demo accounts work immediately
      const mockUser: AuthUser = {
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
      setUser(mockUser);
      const fallbackToken = `demo_token_${account.key}`;
      localStorage.setItem(TOKEN_KEY, fallbackToken);
      setToken(fallbackToken);
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
