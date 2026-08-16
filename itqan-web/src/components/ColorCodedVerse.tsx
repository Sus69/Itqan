import type { AlignmentChar } from '@/lib/api';
import type { RuleEvaluation } from '@/lib/api';
import { alignmentCharClass } from '@/lib/format';
import { cn } from '@/lib/cn';
import { useMemo, useState } from 'react';

interface ColorCodedVerseProps {
  expectedText: string;
  alignment: AlignmentChar[];
  /** emphasised rules to highlight in the legend (applicable ones) */
  evaluations?: RuleEvaluation[];
}

/**
 * Renders the Quranic verse after evaluation, coloring each character by its
 * alignment status (correct / mismatch / missing / extra). Hovering a char
 * reveals its timestamp + any correction note. High visual dignity:
 * large Amiri Quran script on a calm card.
 */
export function ColorCodedVerse({ expectedText, alignment }: ColorCodedVerseProps) {
  const [active, setActive] = useState<number | null>(null);

  const segments = useMemo(() => {
    if (!alignment || alignment.length === 0) {
      return [{ text: expectedText, status: 'unscored' as const, note: null as string | null }];
    }
    return alignment.map((a, i) => ({
      text: a.expected_char || a.char,
      status: a.status,
      note: a.correction_note,
      idx: i,
      start: a.start_time,
      end: a.end_time,
    }));
  }, [alignment, expectedText]);

  const legend = [
    { cls: 'text-ink', swatch: 'bg-ink', label: 'Correct' },
    { cls: 'text-error', swatch: 'bg-error', label: 'Mismatch / Missing' },
    { cls: 'text-warning', swatch: 'bg-warning', label: 'Extra sound' },
  ];

  return (
    <div className="glass p-6 sm:p-8">
      {/* Verse display (RTL) */}
      <div
        className="quran-text select-none text-center leading-[2.6] tracking-wide text-ink"
        style={{ fontSize: 'clamp(1.6rem, 2.6vw + 0.6rem, 2.6rem)' }}
        dir="rtl"
        lang="ar"
      >
        {segments.map((seg, i) => {
          const isInteractive = seg.status !== 'unscored';
          return (
            <span key={i} className="relative">
              <span
                onMouseEnter={() => isInteractive && setActive(i)}
                onMouseLeave={() => setActive((a) => (a === i ? null : a))}
                className={cn(
                  seg.status === 'unscored' ? 'text-ink' : alignmentCharClass(seg.status),
                  isInteractive && 'cursor-default rounded transition-colors hover:bg-brand-50',
                  active === i && 'bg-brand-100/70',
                )}
              >
                {seg.text}
              </span>
              {isInteractive && active === i && seg.note && (
                <span
                  className="pointer-events-none absolute -top-14 left-1/2 z-10 w-max max-w-56 -translate-x-1/2 rounded-lg bg-ink px-3 py-2 text-center text-[11px] font-medium leading-relaxed text-white shadow-[var(--shadow-lift)]"
                  dir="ltr"
                >
                  {seg.note}
                </span>
              )}
            </span>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-border/70 pt-4">
        {legend.map((l) => (
          <span key={l.label} className="flex items-center gap-2 text-xs font-medium text-ink-soft">
            <span className={cn('size-2.5 rounded-full', l.swatch)} />
            {l.label}
          </span>
        ))}
      </div>
    </div>
  );
}
