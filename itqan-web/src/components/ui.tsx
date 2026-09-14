import {
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
  useEffect,
  useId,
  useRef,
} from 'react';
import { cn } from '@/lib/cn';
import { Icon, type IconName } from '@/components/Icon';
import { useFocusTrap } from '@/hooks/useFocusTrap';

/* ---------------- Button ---------------- */
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold' | 'outline';
type Size = 'sm' | 'md' | 'lg';

const variants: Record<Variant, string> = {
  primary:
    'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 dark:bg-brand-600 dark:hover:bg-brand-500 shadow-[var(--shadow-soft)] focus-visible:ring-brand-500',
  secondary:
    'bg-brand-500/10 text-brand-800 border border-brand-500/25 hover:bg-brand-500/15 active:bg-brand-500/20 dark:bg-brand-500/15 dark:text-brand-300 dark:border-brand-500/30 dark:hover:bg-brand-500/25 dark:active:bg-brand-500/30',
  outline:
    'bg-transparent text-ink border border-border hover:bg-sand-100 active:bg-sand-200 dark:hover:bg-surface-2 dark:active:bg-surface-1',
  ghost:
    'bg-transparent text-ink-soft hover:bg-sand-100 active:bg-sand-200 dark:hover:bg-surface-2 dark:hover:text-ink dark:active:bg-surface-1',
  danger:
    'bg-error text-white hover:brightness-95 active:brightness-90',
  gold:
    'bg-gold-500 text-white hover:bg-gold-600 active:bg-gold-700 shadow-[var(--shadow-soft)] dark:bg-gold-500/20 dark:text-gold-200 dark:border dark:border-gold-500/30 dark:hover:bg-gold-500/30',
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
export type BadgeTone =
  | 'neutral'
  | 'brand'
  | 'hero'
  | 'glass'
  | 'gold'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'none';

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'itq-badge',
        tone !== 'none' && `itq-badge-${tone}`,
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
  description,
  children,
  footer,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();
  useFocusTrap(open, panelRef);

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
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        aria-label="Close dialog"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 bg-ink/35 backdrop-blur-sm"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cn(
          'anim-pop relative max-h-[88vh] w-full overflow-auto rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-lift)]',
          wide ? 'max-w-3xl' : 'max-w-lg',
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 id={titleId} className="text-lg font-bold tracking-tight text-ink">
              {title}
            </h3>
            {description && (
              <p id={descId} className="mt-1 text-sm leading-relaxed text-ink-faint">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="grid size-9 shrink-0 place-items-center rounded-lg text-ink-faint transition-colors hover:bg-sand-100 hover:text-ink"
            aria-label="Close"
          >
            <Icon name="close" size={18} />
          </button>
        </div>
        <div>{children}</div>
        {footer && <div className="mt-6 flex flex-wrap justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}

/* ---------------- Drawer (CMP-UTL-002 side sheet) ----------------
   Used for secondary catalogues — verse pickers, target lists — so the main
   viewport keeps exactly one task in it. Shares Modal's focus + escape rules. */
export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useFocusTrap(open, panelRef);

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
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        aria-label="Close panel"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 bg-ink/35 backdrop-blur-sm"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative flex h-full w-full max-w-md flex-col border-l border-border bg-surface shadow-[var(--shadow-lift)]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border p-5">
          <div className="min-w-0">
            <h3 id={titleId} className="text-base font-bold tracking-tight text-ink">
              {title}
            </h3>
            {description && <p className="mt-1 text-xs leading-relaxed text-ink-faint">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="grid size-9 shrink-0 place-items-center rounded-lg text-ink-faint transition-colors hover:bg-sand-100 hover:text-ink"
            aria-label="Close panel"
          >
            <Icon name="close" size={18} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-5">{children}</div>
        {footer && <div className="border-t border-border p-4">{footer}</div>}
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
    <div className={cn('flex flex-col items-center justify-center rounded-2xl border border-border bg-surface-1 px-6 py-14 text-center shadow-sm', className)}>
      {icon && (
        <div className="mb-4 grid size-16 place-items-center rounded-2xl border border-brand-200/50 bg-brand-50 text-brand-600 dark:border-brand-500/30 dark:bg-brand-500/15 dark:text-brand-300">
          {icon}
        </div>
      )}
      <h3 className="text-base font-bold text-ink">{title}</h3>
      {body && <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-soft">{body}</p>}
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

/* ---------------- Skeleton (CMP-STA-001) ----------------
   A shimmer alone never communicates loading, so the wrapper carries
   aria-busy and a visually hidden label for assistive tech. */
export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cn('skeleton block h-4 w-full', className)} />;
}

export function SkeletonList({
  rows = 3,
  label = 'Loading',
  className,
}: {
  rows?: number;
  label?: string;
  className?: string;
}) {
  return (
    <div aria-busy="true" className={cn('space-y-3', className)}>
      <VisuallyHidden>{label}</VisuallyHidden>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="space-y-2 rounded-2xl border border-border bg-surface p-4">
          <Skeleton className="h-3.5 w-2/5" />
          <Skeleton className="h-3 w-4/5" />
        </div>
      ))}
    </div>
  );
}

/* ---------------- Inline notice (CMP-STA-002) ----------------
   The single pattern for degraded, blocked and informational states: offline,
   backend unreachable, microphone denied, nothing-recorded-yet. Always carries
   a text label, so status is never colour-only. */
type NoticeTone = 'info' | 'warning' | 'error' | 'success' | 'neutral';

const noticeTones: Record<NoticeTone, { wrap: string; icon: string; name: IconName }> = {
  info: { wrap: 'border-info/25 bg-info-soft', icon: 'text-info', name: 'info' },
  warning: { wrap: 'border-warning/30 bg-warning-soft', icon: 'text-warning', name: 'alert' },
  error: { wrap: 'border-error/30 bg-error-soft', icon: 'text-error', name: 'alert' },
  success: { wrap: 'border-success/25 bg-success-soft', icon: 'text-success', name: 'check' },
  neutral: { wrap: 'border-border bg-surface-2', icon: 'text-ink-faint', name: 'info' },
};

export function InlineNotice({
  tone = 'info',
  title,
  children,
  action,
  live,
  className,
}: {
  tone?: NoticeTone;
  title: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  /** Announce changes to screen readers — use for transient audio/session states. */
  live?: boolean;
  className?: string;
}) {
  const t = noticeTones[tone];
  return (
    <div
      role={tone === 'error' ? 'alert' : undefined}
      aria-live={live ? 'polite' : undefined}
      className={cn('flex flex-wrap items-start gap-3 rounded-2xl border p-4', t.wrap, className)}
    >
      <Icon name={t.name} size={17} className={cn('mt-0.5 shrink-0', t.icon)} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-ink">{title}</p>
        {children && <div className="mt-1 text-sm leading-relaxed text-ink-soft">{children}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* ---------------- Step rail (CMP-LRN-001) ----------------
   The shared spine of every session: the learner can always see which of the
   five stages they are in and what comes next. Completed steps are marked with
   a glyph as well as colour. */
export interface RailStep {
  id: string;
  label: string;
}

export function StepRail({
  steps,
  currentId,
  className,
}: {
  steps: RailStep[];
  currentId: string;
  className?: string;
}) {
  const currentIndex = Math.max(0, steps.findIndex((s) => s.id === currentId));
  return (
    <ol
      aria-label="Session stages"
      className={cn('flex flex-wrap items-center gap-x-2 gap-y-2 text-xs font-semibold', className)}
    >
      {steps.map((step, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <li key={step.id} className="flex items-center gap-2">
            <span
              aria-current={active ? 'step' : undefined}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1',
                active && 'bg-brand-600 text-white',
                done && 'bg-brand-50 text-brand-800',
                !active && !done && 'bg-sand-100 text-ink-faint',
              )}
            >
              {done ? (
                <Icon name="check" size={12} aria-hidden="true" />
              ) : (
                <span className="tabular-nums">{i + 1}</span>
              )}
              {step.label}
              {done && <VisuallyHidden>(done)</VisuallyHidden>}
            </span>
            {i < steps.length - 1 && (
              <span aria-hidden="true" className="h-px w-3 bg-border sm:w-4" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

/* ---------------- Visually hidden ---------------- */
export function VisuallyHidden({ children }: { children: ReactNode }) {
  return <span className="sr-only">{children}</span>;
}

