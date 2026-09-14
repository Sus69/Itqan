import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import { Icon, type IconName } from '@/components/Icon';
import { cn } from '@/lib/cn';
import { BackendStatus } from '@/components/BackendStatus';
import { useAuth } from '@/lib/authContext';
import { useOnline } from '@/hooks/useOnline';
import { AuthModal } from '@/components/AuthModal';
import { LearnerOnboarding } from '@/components/LearnerOnboarding';
import { SettingsModal } from '@/components/SettingsModal';
import { InlineNotice } from '@/components/ui';

interface NavItem {
  to: string;
  label: string;
  icon: IconName;
  end?: boolean;
}

const NAV: NavItem[] = [
  { to: '/', label: 'Today', icon: 'home', end: true },
  { to: '/learn', label: 'Learn', icon: 'learn' },
  { to: '/practice', label: 'Practice', icon: 'practice' },
  { to: '/insights', label: 'Insights', icon: 'progress' },
  { to: '/profile', label: 'Profile', icon: 'profile' },
];

export function AppShell() {
  const { user, isDemo, openAuthModal, logout } = useAuth();
  const online = useOnline();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Collapsed sidebar state (persisted)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem('itqan_sidebar_collapsed');
    return saved !== null ? saved === 'true' : true; // Default to collapsed as in reference design
  });

  // Dark mode state (persisted, default to true)
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('itqan_theme');
    if (saved) return saved === 'dark';
    return true; // Default to Dark Mode
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('itqan_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('itqan_theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('itqan_sidebar_collapsed', String(next));
      return next;
    });
  };

  // Keyboard shortcut: '[' or 'Ctrl+B' to toggle sidebar
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.key === '[' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) ||
          ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b')) {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Dismissable by Escape and by clicking away
  useEffect(() => {
    if (!isMenuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setIsMenuOpen(false);
    const onPointerDown = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setIsMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [isMenuOpen]);

  // Navigating is an implicit dismissal
  useEffect(() => setIsMenuOpen(false), [location.pathname]);

  return (
    <div className="flex min-h-screen bg-background text-ink transition-colors duration-300">
      <AuthModal />
      <LearnerOnboarding />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        isSidebarCollapsed={isCollapsed}
        onToggleSidebar={toggleSidebar}
      />

      <a
        href="#main-content"
        className="sr-only rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50"
      >
        Skip to main content
      </a>

      {/* Desktop Sidebar */}
      <aside
        aria-label="Sidebar Navigation"
        className={cn(
          'sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border bg-surface/80 backdrop-blur-xl transition-all duration-300 ease-in-out lg:flex z-30',
          isCollapsed ? 'w-[76px] px-2.5 py-6 items-center' : 'w-64 px-4 py-6 items-stretch',
        )}
      >
        {/* Brand & Collapse Control */}
        <div className={cn('flex items-center', isCollapsed ? 'justify-center w-full' : 'justify-between gap-2 px-1')}>
          <Link
            to="/"
            className={cn('flex items-center gap-3 focus-visible:outline-none group', isCollapsed && 'justify-center')}
            title="Itqān Home"
          >
            <span className="itq-logo-badge relative grid size-11 place-items-center rounded-2xl transition-transform duration-200 group-hover:scale-105">
              <Icon name="mosque" size={22} />
              <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-gold-400 ring-2 ring-surface" />
            </span>
            {!isCollapsed && (
              <span className="leading-tight animate-fade-in min-w-0">
                <span className="block text-lg font-extrabold tracking-tight text-ink">Itqān</span>
                <span className="arabic-text block text-xs font-bold text-brand-700">إتقان</span>
              </span>
            )}
          </Link>

          {!isCollapsed && (
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label="Collapse sidebar"
              title="Collapse sidebar ( [ )"
              className="grid size-8 place-items-center rounded-xl text-ink-faint transition-colors hover:bg-sand-100 hover:text-ink"
            >
              <Icon name="chevronLeft" size={16} />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav aria-label="Main" className={cn('mt-8 flex flex-col gap-2.5', isCollapsed ? 'w-full items-center' : 'w-full')}>
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'group relative flex items-center transition-all duration-200',
                  isCollapsed
                    ? cn(
                        'size-11 place-items-center justify-center rounded-2xl',
                        isActive
                          ? 'itq-nav-active'
                          : 'text-ink-soft hover:bg-sand-100 hover:text-ink dark:hover:bg-surface-2',
                      )
                    : cn(
                        'w-full gap-3.5 rounded-2xl px-3.5 py-2.5 text-sm font-semibold',
                        isActive
                          ? 'itq-nav-active'
                          : 'text-ink-soft hover:bg-sand-100 hover:text-ink dark:hover:bg-surface-2',
                      ),
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    name={item.icon}
                    size={20}
                    className={cn(
                      'transition-transform duration-200 group-hover:scale-110',
                      isActive ? 'text-white' : undefined,
                    )}
                  />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}

                  {/* Floating Tooltip when collapsed */}
                  {isCollapsed && (
                    <span
                      role="tooltip"
                      className="pointer-events-none absolute left-full ml-3 hidden rounded-xl border border-border bg-floating px-3 py-1.5 text-xs font-bold text-ink shadow-[var(--shadow-lift)] group-hover:flex items-center gap-1.5 z-50 whitespace-nowrap animate-fade-in"
                    >
                      {item.label}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Account / Profile Widget (Expanded Only) */}
        {!isCollapsed && (
          <div className="mt-auto pt-4">
            {user ? (
              <div className="rounded-2xl border border-border bg-sand-50/70 p-3">
                <div className="flex items-center gap-3">
                  <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-700 text-xs font-bold text-white shadow-sm">
                    {user.full_name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-ink">{user.full_name}</p>
                    <p className="text-[10px] text-ink-faint">
                      {isDemo ? 'Demo session' : 'Signed in'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => openAuthModal('demo')}
                className="itq-sidebar-auth w-full rounded-xl px-3 py-2 text-center text-xs font-bold"
              >
                Sign in / Demo
              </button>
            )}
          </div>
        )}

        {/* Bottom Utility Actions (Settings, Theme Toggle, Expand Button) */}
        <div
          className={cn(
            'flex flex-col gap-2.5 pt-4',
            isCollapsed ? 'mt-auto w-full items-center pb-2' : 'mt-3 border-t border-border',
          )}
        >
          {isCollapsed ? (
            <>
              {/* Settings Icon Button */}
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                aria-label="Settings"
                title="Settings & Preferences"
                className="group relative grid size-11 place-items-center rounded-full border border-border/80 bg-surface-1 text-ink-soft transition-all duration-200 hover:border-brand-300 hover:bg-sand-100 hover:text-ink shadow-xs"
              >
                <Icon name="settings" size={19} className="transition-transform duration-200 group-hover:rotate-45" />
                <span className="pointer-events-none absolute left-full ml-3 hidden rounded-xl border border-border bg-floating px-3 py-1.5 text-xs font-bold text-ink shadow-[var(--shadow-lift)] group-hover:block z-50 whitespace-nowrap animate-fade-in">
                  Settings
                </span>
              </button>

              {/* Theme Toggle Button */}
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                title={isDark ? 'Light Mode' : 'Dark Mode'}
                className="group relative grid size-11 place-items-center rounded-full border border-border/80 bg-surface-1 text-ink-soft transition-all duration-200 hover:border-brand-300 hover:bg-sand-100 hover:text-ink shadow-xs"
              >
                <Icon name={isDark ? 'sun' : 'moon'} size={19} className="transition-transform duration-200 group-hover:scale-110" />
                <span className="pointer-events-none absolute left-full ml-3 hidden rounded-xl border border-border bg-floating px-3 py-1.5 text-xs font-bold text-ink shadow-[var(--shadow-lift)] group-hover:block z-50 whitespace-nowrap animate-fade-in">
                  {isDark ? 'Light Mode' : 'Dark Mode'}
                </span>
              </button>

              {/* Expand Sidebar Button */}
              <button
                type="button"
                onClick={toggleSidebar}
                aria-label="Expand sidebar"
                title="Expand sidebar ( [ )"
                className="group relative grid size-8 place-items-center rounded-xl text-ink-faint transition-all duration-200 hover:bg-sand-100 hover:text-ink mt-1"
              >
                <Icon name="chevronRight" size={16} />
                <span className="pointer-events-none absolute left-full ml-3 hidden rounded-xl border border-border bg-floating px-3 py-1.5 text-xs font-bold text-ink shadow-[var(--shadow-lift)] group-hover:block z-50 whitespace-nowrap animate-fade-in">
                  Expand sidebar
                </span>
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(true)}
                  className="flex flex-1 items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-ink-soft transition-colors hover:bg-sand-100 hover:text-ink"
                >
                  <Icon name="settings" size={16} />
                  <span>Settings</span>
                </button>

                <button
                  type="button"
                  onClick={toggleTheme}
                  aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                  className="grid size-8 place-items-center rounded-xl text-ink-soft transition-colors hover:bg-sand-100 hover:text-ink"
                  title={isDark ? 'Light Mode' : 'Dark Mode'}
                >
                  <Icon name={isDark ? 'sun' : 'moon'} size={16} />
                </button>
              </div>

              <div className="pt-2">
                <BackendStatus compact />
              </div>
            </>
          )}
        </div>
      </aside>

      {/* Main Content Column */}
      <div className="flex min-w-0 flex-1 flex-col transition-all duration-300">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-border bg-surface/70 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 lg:hidden">
            <Link to="/" className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-xl bg-brand-800 text-white shadow-xs">
                <Icon name="mosque" size={18} />
              </span>
              <span className="text-base font-extrabold tracking-tight text-ink">Itqān</span>
            </Link>
          </div>

          <div className="hidden min-w-0 lg:flex items-center gap-3">
            {isCollapsed && (
              <button
                type="button"
                onClick={toggleSidebar}
                aria-label="Expand sidebar"
                title="Expand sidebar ( [ )"
                className="grid size-8 place-items-center rounded-xl border border-border/60 bg-surface-1 text-ink-faint transition-colors hover:bg-sand-100 hover:text-ink"
              >
                <Icon name="panelLeft" size={16} />
              </button>
            )}
            <p className="truncate text-sm font-semibold text-ink-faint">
              {user
                ? `Assalamu alaikum, ${user.full_name.split(' ')[0]}`
                : 'Assalamu alaikum'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <BackendStatus className="hidden sm:flex" />

            {/* Quick settings button in header for mobile or quick access */}
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              aria-label="Open settings"
              className="grid size-9 place-items-center rounded-xl border border-border bg-surface text-ink-soft shadow-xs transition-colors hover:border-brand-300 hover:text-ink lg:hidden"
            >
              <Icon name="settings" size={16} />
            </button>

            {user ? (
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={isMenuOpen}
                  onClick={() => setIsMenuOpen((open) => !open)}
                  className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-1.5 shadow-sm transition-colors hover:border-brand-300"
                >
                  <span className="grid size-6 place-items-center rounded-lg bg-brand-700 text-[11px] font-bold text-white">
                    {user.full_name.charAt(0)}
                  </span>
                  <span className="hidden max-w-[140px] truncate text-xs font-bold text-ink sm:inline">
                    {user.full_name}
                  </span>
                  <Icon name="arrowRight" size={13} className="rotate-90 text-ink-faint" />
                </button>

                {isMenuOpen && (
                  <div
                    role="menu"
                    aria-label="Account"
                    className="animate-fade-in absolute right-0 z-50 mt-2 w-52 rounded-2xl border border-border bg-floating p-1.5 shadow-[var(--shadow-lift)]"
                  >
                    <Link
                      role="menuitem"
                      to="/profile"
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-ink hover:bg-sand-100"
                    >
                      <Icon name="profile" size={15} />
                      Your profile
                    </Link>
                    <Link
                      role="menuitem"
                      to="/insights"
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-ink hover:bg-sand-100"
                    >
                      <Icon name="progress" size={15} />
                      Your insights
                    </Link>
                    <button
                      role="menuitem"
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        setIsSettingsOpen(true);
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-ink hover:bg-sand-100"
                    >
                      <Icon name="settings" size={15} />
                      Preferences
                    </button>
                    <hr className="my-1 border-border" />
                    <button
                      role="menuitem"
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        logout();
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-error hover:bg-error-soft"
                    >
                      <Icon name="close" size={15} />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-brand-700"
              >
                Sign in
              </button>
            )}
          </div>
        </header>

        {/* Page content */}
        <main
          id="main-content"
          className="mx-auto w-full max-w-shell flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
        >
          {!online && (
            <InlineNotice tone="warning" title="You are offline" live className="mb-6">
              Reading and reviewing still work. Anything that needs the analysis service — recording
              feedback and voice matching — will come back on its own once you reconnect.
            </InlineNotice>
          )}
          <Outlet />
        </main>

        <footer className="border-t border-border py-6">
          <p className="text-center text-xs text-ink-faint">
            Itqān — a companion for confident, accurate, and beautiful recitation.
          </p>
        </footer>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/90 backdrop-blur-xl lg:hidden"
      >
        <div className="mx-auto flex max-w-md items-stretch justify-between px-2 pb-[env(safe-area-inset-bottom)]">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition-colors',
                  isActive ? 'text-brand-700 font-bold' : 'text-ink-faint',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      'grid size-9 place-items-center rounded-xl transition-colors',
                      isActive && 'bg-brand-100 text-brand-800',
                    )}
                  >
                    <Icon name={item.icon} size={20} />
                  </span>
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Spacer for mobile bottom nav */}
      <div className="h-20 lg:hidden" />
    </div>
  );
}

