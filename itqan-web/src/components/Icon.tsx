import { cn } from '@/lib/cn';
import type { ReactElement, SVGProps } from 'react';

export type IconName =
  | 'home' | 'learn' | 'practice' | 'progress' | 'profile'
  | 'mic' | 'stop' | 'play' | 'pause' | 'restart' | 'upload'
  | 'check' | 'alert' | 'info' | 'sparkle' | 'wave' | 'book'
  | 'mosque' | 'arrowRight' | 'record' | 'close' | 'note';

const stroke = 1.8;

const paths: Record<IconName, ReactElement> = {
  home: (
    <>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
      <path d="M9.5 21v-6h5v6" />
    </>
  ),
  learn: (
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4a2 2 0 0 0-2-2H6.5A2.5 2.5 0 0 0 4 4.5v15Z" />
      <path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" />
    </>
  ),
  practice: (
    <>
      <rect x="9" y="2" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v4" />
    </>
  ),
  progress: (
    <>
      <path d="M3 21h18" />
      <path d="M6 21V10" />
      <path d="M11 21V4" />
      <path d="M16 21v-9" />
      <path d="M21 21V7" />
    </>
  ),
  profile: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.5-6.5 8-6.5s8 2.5 8 6.5" />
    </>
  ),
  mic: (
    <>
      <rect x="9" y="2" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v4" />
    </>
  ),
  stop: <rect x="6" y="6" width="12" height="12" rx="2" />,
  play: <path d="M7 4.5v15l13-7.5L7 4.5Z" />,
  pause: (
    <>
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </>
  ),
  restart: (
    <>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
    </>
  ),
  upload: (
    <>
      <path d="M12 16V4" />
      <path d="m6 10 6-6 6 6" />
      <path d="M4 20h16" />
    </>
  ),
  check: <path d="m4.5 12.5 5 5 10-11" />,
  alert: (
    <>
      <path d="M12 3 2.5 20h19L12 3Z" />
      <path d="M12 10v4" />
      <path d="M12 17.5h.01" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 7.5h.01" />
    </>
  ),
  sparkle: (
    <>
      <path d="M12 2.5 13.8 8l5.5 1.8-5.5 1.8L12 17l-1.8-5.4L4.7 9.8 10.2 8 12 2.5Z" />
      <path d="M19 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" />
    </>
  ),
  wave: (
    <>
      <path d="M3 12h2l2-6 3 12 3-9 2 3h6" />
    </>
  ),
  book: (
    <>
      <path d="M2 4h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2V4Z" />
      <path d="M22 4h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7V4Z" />
    </>
  ),
  mosque: (
    <>
      <path d="M12 3v2" />
      <path d="M8 21v-8a4 4 0 0 1 8 0v8" />
      <path d="M4 21h16" />
      <path d="M12 8c0 0 3-1.5 3-4 2 1 1.5 3 0 4" />
    </>
  ),
  arrowRight: (
    <>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </>
  ),
  record: <circle cx="12" cy="12" r="7" />,
  close: (
    <>
      <path d="M6 6l12 12" />
      <path d="M18 6 6 18" />
    </>
  ),
  note: (
    <>
      <path d="M9 18V6l12-3v12" />
      <circle cx="6.5" cy="18" r="2.5" />
      <circle cx="18.5" cy="15" r="2.5" />
    </>
  ),
};

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number;
  filled?: boolean;
}

export function Icon({ name, size = 20, filled = false, className, ...rest }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn('shrink-0', className)}
      {...rest}
    >
      {paths[name]}
    </svg>
  );
}
