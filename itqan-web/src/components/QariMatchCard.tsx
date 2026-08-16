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
      className="grid size-11 shrink-0 place-items-center rounded-xl text-sm font-black text-white shadow-[var(--shadow-soft)]"
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
        'anim-fade-up flex flex-col justify-between w-full rounded-2xl border bg-surface p-5 text-left backdrop-blur transition-all',
        selected
          ? 'border-brand-500 shadow-[var(--shadow-lift)] ring-2 ring-brand-500/30'
          : 'border-border hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-[var(--shadow-lift)]',
      )}
      style={{ animationDelay: `${rank * 90}ms` }}
    >
      <div>
        {/* Header row: Avatar + Badge + Selected indicator */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <Avatar name={match.qari} rank={rank} />
            <span
              className={cn(
                'rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider',
                rank === 0
                  ? 'bg-gold-100 text-gold-900 border border-gold-300'
                  : 'bg-brand-50 text-brand-800 border border-brand-200',
              )}
            >
              {RANK_LABELS[rank] ?? 'Match'}
            </span>
          </div>

          {selected && (
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-600 text-white shadow-sm">
              <Icon name="check" size={14} />
            </span>
          )}
        </div>

        {/* Full Qari Name — never truncated on any screen ratio */}
        <h3 className="text-base sm:text-lg font-bold text-ink leading-snug break-words">
          {match.qari}
        </h3>
      </div>

      {/* Vocal Similarity Metric */}
      <div className="mt-4 pt-3 border-t border-border/40">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="font-semibold text-ink-faint">Vocal similarity</span>
          <span className="font-extrabold tabular-nums text-brand-700">{pct.toFixed(1)}%</span>
        </div>
        <ProgressBar value={pct} tone={rank === 0 ? 'gold' : 'brand'} />
      </div>
    </button>
  );
}
