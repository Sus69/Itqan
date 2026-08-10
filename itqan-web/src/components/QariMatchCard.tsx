import type { VoiceMatch } from '@/lib/api';
import { confidencePct } from '@/lib/format';
import { ProgressBar } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { cn } from '@/lib/cn';

const RANK_LABELS = ['Best match', 'Strong match', 'Close match'];
const AVATAR_HUES = [0, 40, 200];

/** Simple deterministic avatar: initials tile in brand/gold gradient. */
function Avatar({ name, rank }: { name: string; rank: number }) {
  const initials = name
    .replace(/^(sheikh|قارئ)\s+/i, '')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('');
  const hue = AVATAR_HUES[rank] ?? 140;
  return (
    <div
      className="grid size-12 shrink-0 place-items-center rounded-2xl text-base font-extrabold text-white shadow-[var(--shadow-soft)]"
      style={{
        background: `linear-gradient(135deg, hsl(${140 + hue * 0.2} 45% 32%), hsl(${30 + hue} 60% 48%))`,
      }}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}

export function QariMatchCard({
  match,
  rank,
  selected,
  onSelect,
}: {
  match: VoiceMatch;
  rank: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const pct = confidencePct(match.confidence);
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'anim-fade-up w-full rounded-2xl border bg-surface/85 p-5 text-left backdrop-blur transition-all',
        selected
          ? 'border-brand-500 shadow-[var(--shadow-lift)] ring-1 ring-brand-500/40'
          : 'border-border hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-[var(--shadow-lift)]',
      )}
      style={{ animationDelay: `${rank * 90}ms` }}
    >
      <div className="flex items-start gap-4">
        <Avatar name={match.qari} rank={rank} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="truncate text-sm font-bold text-ink sm:text-base">{match.qari}</p>
            <span
              className={cn(
                'shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide',
                rank === 0 ? 'bg-gold-100 text-gold-800' : 'bg-brand-50 text-brand-700',
              )}
            >
              {RANK_LABELS[rank] ?? 'Match'}
            </span>
          </div>
          <div className="mt-3">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="font-semibold text-ink-faint">Vocal similarity</span>
              <span className="font-bold tabular-nums text-brand-700">{pct.toFixed(1)}%</span>
            </div>
            <ProgressBar value={pct} tone={rank === 0 ? 'gold' : 'brand'} />
          </div>
        </div>
        {selected && (
          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-600 text-white">
            <Icon name="check" size={14} />
          </span>
        )}
      </div>
    </button>
  );
}
