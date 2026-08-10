import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function PageHeader({
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
    <div className={cn('anim-fade-up mb-6 flex flex-wrap items-end justify-between gap-3', className)}>
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 max-w-xl text-sm text-ink-faint">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
