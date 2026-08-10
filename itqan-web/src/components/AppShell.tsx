import { NavLink, Outlet, Link } from 'react-router-dom';
import { Icon, type IconName } from '@/components/Icon';
import { cn } from '@/lib/cn';
import { BackendStatus } from '@/components/BackendStatus';

interface NavItem {
  to: string;
  label: string;
  icon: IconName;
  end?: boolean;
}

const NAV: NavItem[] = [
  { to: '/', label: 'Home', icon: 'home', end: true },
  { to: '/learn', label: 'Learn', icon: 'learn' },
  { to: '/practice', label: 'Practice', icon: 'practice' },
  { to: '/progress', label: 'Progress', icon: 'progress' },
  { to: '/profile', label: 'Profile', icon: 'profile' },
];

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-3 focus-visible:outline-none">
      <span className="relative grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 text-white shadow-[var(--shadow-soft)]">
        <Icon name="mosque" size={22} />
        <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-gold-400 ring-2 ring-white" />
      </span>
      <span className="leading-tight">
        <span className="block text-lg font-extrabold tracking-tight text-ink">Itqān</span>
        <span className="arabic-text block text-sm font-semibold text-brand-700">إتقان</span>
      </span>
    </Link>
  );
}

export function AppShell() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-white/60 px-4 py-6 backdrop-blur-xl lg:flex">
        <Brand />
        <nav className="mt-8 flex flex-col gap-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors',
                  isActive
                    ? 'bg-brand-600 text-white shadow-[var(--shadow-soft)]'
                    : 'text-ink-soft hover:bg-sand-100 hover:text-ink',
                )
              }
            >
              <Icon name={item.icon} size={19} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto space-y-3">
          <BackendStatus compact />
          <p className="px-1 text-[11px] leading-relaxed text-ink-faint">
            Learn · Refine · Beautify your recitation.
          </p>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-border bg-white/70 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="lg:hidden">
            <Brand />
          </div>
          <div className="hidden lg:block">
            <h1 className="text-sm font-semibold text-ink-faint">
              Assalamu alaikum — welcome back to your recitation journey
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <BackendStatus className="hidden sm:flex" />
            <Link
              to="/practice/voice-match"
              className="hidden items-center gap-2 rounded-xl bg-gold-500 px-4 py-2 text-sm font-semibold text-white shadow-[var(--shadow-soft)] transition-colors hover:bg-gold-600 sm:inline-flex"
            >
              <Icon name="sparkle" size={16} />
              Find your Qari
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <Outlet />
        </main>

        <footer className="border-t border-border py-6">
          <p className="text-center text-xs text-ink-faint">
            Itqān — a companion for confident, accurate, and beautiful recitation.
          </p>
        </footer>
      </div>

      {/* Bottom nav (mobile) */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-white/85 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-md items-stretch justify-between px-2 pb-[env(safe-area-inset-bottom)]">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition-colors',
                  isActive ? 'text-brand-700' : 'text-ink-faint',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      'grid size-9 place-items-center rounded-xl transition-colors',
                      isActive && 'bg-brand-100 text-brand-700',
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

      {/* spacer for mobile bottom nav */}
      <div className="h-20 lg:hidden" />
    </div>
  );
}
