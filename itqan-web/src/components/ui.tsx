import { type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode, useEffect } from 'react';
import { cn } from '@/lib/cn';
import { Icon } from '@/components/Icon';

/* ---------------- Button ---------------- */
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold' | 'outline';
type Size = 'sm' | 'md' | 'lg';

const variants: Record<Variant, string> = {
  primary:
    'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-[var(--shadow-soft)] focus-visible:ring-brand-500',
  secondary:
    'bg-brand-50 text-brand-800 border border-brand-200 hover:bg-brand-100 active:bg-brand-200',
  outline:
    'bg-transparent text-ink border border-border hover:bg-sand-100 active:bg-sand-200',
  ghost:
    'bg-transparent text-ink-soft hover:bg-sand-100 active:bg-sand-200',
  danger:
    'bg-error text-white hover:brightness-95 active:brightness-90',
  gold:
    'bg-gold-500 text-white hover:bg-gold-600 active:bg-gold-700 shadow-[var(--shadow-soft)]',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-sm gap-1.5',
  md: 'h-11 px-5 text-sm gap-2',
  lg: 'h-13 px-7 text-base gap-2.5',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  type = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex select-none items-center justify-center rounded-xl font-semibold transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-55 disabled:saturate-50',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className,
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && (
        <span className="anim-spin inline-block size-4 rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
}

/* ---------------- Card ---------------- */
interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
  hoverLift?: boolean;
}
export function Card({ glass = false, hoverLift = false, className, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        glass ? 'glass' : 'card',
        'p-5 sm:p-6',
        hoverLift && 'transition-shadow duration-200 hover:shadow-[var(--shadow-lift)]',
        className,
      )}
      {...rest}
    />
  );
}

/* ---------------- Section Header (CMP-FND-004) ---------------- */
export function SectionHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-4 flex items-end justify-between gap-4', className)}>
      <div>
        <h2 className="text-lg font-bold tracking-tight text-ink">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-ink-faint">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/* ---------------- Badge / Pill ---------------- */
export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode;
  tone?: 'neutral' | 'brand' | 'success' | 'warning' | 'error' | 'info' | 'gold';
  className?: string;
}) {
  const tones: Record<string, string> = {
    neutral: 'bg-sand-100 text-sand-700',
    brand: 'bg-brand-100 text-brand-800',
    success: 'bg-success-soft text-success',
    warning: 'bg-warning-soft text-warning',
    error: 'bg-error-soft text-error',
    info: 'bg-info-soft text-info',
    gold: 'bg-gold-100 text-gold-800',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ---------------- Progress bar (CMP-NAV-005) ---------------- */
export function ProgressBar({
  value,
  tone = 'brand',
  className,
}: {
  value: number; // 0..100
  tone?: 'brand' | 'gold' | 'success';
  className?: string;
}) {
  const t =
    tone === 'gold' ? 'bg-gold-500' : tone === 'success' ? 'bg-success' : 'bg-brand-600';
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-sand-200', className)}>
      <div
        className={cn('h-full rounded-full transition-all duration-500', t)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

/* ---------------- Score Ring ---------------- */
export function ScoreRing({
  value,
  size = 120,
  stroke = 10,
  label,
}: {
  value: number; // 0..100
  size?: number;
  stroke?: number;
  label?: string;
}) {
  const v = Math.min(100, Math.max(0, value));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (v / 100) * c;
  const color =
    v >= 85 ? 'var(--color-success)' : v >= 60 ? 'var(--color-warning)' : 'var(--color-error)';
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--color-sand-200)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.22,1,0.36,1), stroke 0.4s' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-extrabold tabular-nums text-ink">{Math.round(v)}</span>
        {label && <span className="px-2 text-center text-[10px] font-semibold uppercase tracking-wide text-ink-faint">{label}</span>}
      </div>
    </div>
  );
}

/* ---------------- Modal (CMP-UTL-001 Dialog) ---------------- */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
    >
      <button
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 bg-ink/35 backdrop-blur-sm"
      />
      <div
        className={cn(
          'anim-pop relative max-h-[88vh] w-full overflow-auto rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-lift)]',
          wide ? 'max-w-3xl' : 'max-w-lg',
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h3 className="text-lg font-bold tracking-tight text-ink">{title}</h3>
          <button
            onClick={onClose}
            className="grid size-9 place-items-center rounded-lg text-ink-faint transition-colors hover:bg-sand-100 hover:text-ink"
            aria-label="Close"
          >
            <Icon name="close" size={18} />
          </button>
        </div>
        <div>{children}</div>
        {footer && <div className="mt-6 flex justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}

/* ---------------- Empty State (CMP-UTL-007) ---------------- */
export function EmptyState({
  icon,
  title,
  body,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface-2 px-6 py-14 text-center', className)}>
      {icon && (
        <div className="mb-4 grid size-16 place-items-center rounded-2xl bg-brand-50 text-brand-600">
          {icon}
        </div>
      )}
      <h3 className="text-base font-bold text-ink">{title}</h3>
      {body && <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-faint">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ---------------- Spinner ---------------- */
export function Spinner({ label, className }: { label?: string; className?: string }) {
  return (
    <div className={cn('flex items-center gap-3 text-ink-soft', className)}>
      <span className="anim-spin inline-block size-5 rounded-full border-2 border-brand-500 border-t-transparent" />
      {label && <span className="text-sm font-semibold">{label}</span>}
    </div>
  );
}
