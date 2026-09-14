import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Button, Card, SectionHeader } from '@/components/ui';
import { Icon, type IconName } from '@/components/Icon';
import { getLearningGoal } from '@/lib/learnerGoal';
import { loadAttempts, weakRules } from '@/lib/sessionLog';

/**
 * Practice — three ways in, chosen for you when there is an obvious one.
 *
 * The recommendation prefers an outstanding correction over new material,
 * because a rule the engine has already flagged is the highest-value thing the
 * learner can record next. When nothing is outstanding it falls back to the
 * learner's goal rather than inventing a target.
 */
interface Recommendation {
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
  to: string;
  icon: IconName;
}

export default function PracticePage() {
  const [{ goal, outstanding, weakest }] = useState(() => {
    const attempts = loadAttempts();
    const rules = weakRules(attempts);
    return { goal: getLearningGoal(), outstanding: rules.length, weakest: rules[0] };
  });

  const recommendation: Recommendation = weakest
    ? {
        eyebrow: 'Recommended next',
        title: `Revisit ${weakest.ruleName}`,
        body: `Flagged on ${weakest.targetLabel}. One clean recitation of that target clears it from your review list.`,
        cta: 'Recite it again',
        to: weakest.retryTo,
        icon: 'restart',
      }
    : goal === 'reading'
      ? {
          eyebrow: 'Recommended next',
          title: 'Strengthen your articulation',
          body: 'Review one point of articulation, hear the sound it makes, then return to your lesson when you are ready.',
          cta: 'Open the articulation atlas',
          to: '/practice/articulation',
          icon: 'wave',
        }
      : {
          eyebrow: 'Recommended next',
          title: 'Make one focused recording',
          body: 'Begin with a short ayah and one clear intention. The feedback points at the single best thing to retry.',
          cta: 'Choose a practice target',
          to: '/practice/session',
          icon: 'mic',
        };

  return (
    <div className="anim-fade-up mx-auto max-w-shell space-y-7">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-700">Practice</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          Turn feedback into confidence
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">
          Practice is for strengthening something you already know. Pick a focused activity — not a
          feature to work out.
        </p>
      </header>

      <Card className="overflow-hidden p-0 border-border bg-surface-1">
        <div className="grid lg:grid-cols-[auto_1fr_auto] lg:items-center">
          <div className="grid size-20 place-items-center bg-brand-700 text-white lg:size-28">
            <Icon name={recommendation.icon} size={31} />
          </div>
          <div className="p-6">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-600 dark:text-brand-400">
              {recommendation.eyebrow}
            </p>
            <h2 className="mt-2 text-xl font-extrabold text-ink">{recommendation.title}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">
              {recommendation.body}
            </p>
          </div>
          <div className="p-6 pt-0 lg:pt-6">
            <Link to={recommendation.to}>
              <Button size="lg">
                {recommendation.cta}
                <Icon name="arrowRight" size={17} />
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      <section>
        <SectionHeader
          title="Choose another practice mode"
          subtitle="Each one starts with a clear target and ends with a useful next action."
        />
        <div className="grid gap-4 md:grid-cols-3">
          <PracticeOption
            to="/practice/session"
            icon="mic"
            title="Verse practice"
            body="Pick an ayah, see the rules it exercises, record it, and retry with one correction in mind."
            cta="Practice an ayah"
          />
          <PracticeOption
            to="/practice/review"
            icon="note"
            title="Focused review"
            body="Every rule the engine asked you to revisit, with the exact target that flagged it."
            cta={outstanding > 0 ? `Review ${outstanding} rule${outstanding === 1 ? '' : 's'}` : 'Open your review list'}
            badge={outstanding > 0 ? String(outstanding) : undefined}
          />
          <PracticeOption
            to="/practice/articulation"
            icon="wave"
            title="Articulation review"
            body="Explore where each letter is produced and hear the sound before using it in a lesson."
            cta="Review a sound"
          />
        </div>
      </section>

      <Card>
        <SectionHeader
          title="The practice loop"
          subtitle="Feedback should lead straight into the next attempt, not leave you with a score to interpret."
        />
        <ol className="grid gap-3 sm:grid-cols-4">
          {[
            ['1', 'Set a target', 'Choose one ayah or sound.'],
            ['2', 'Listen and try', 'Use the pronunciation guide, then recite.'],
            ['3', 'Read one correction', 'The priority comes first; detail is optional.'],
            ['4', 'Retry with purpose', 'Apply it now, or save it for review.'],
          ].map(([number, title, body]) => (
            <li key={number} className="rounded-2xl bg-surface-2 p-4">
              <span
                aria-hidden="true"
                className="grid size-7 place-items-center rounded-full bg-brand-600 text-xs font-extrabold text-white"
              >
                {number}
              </span>
              <p className="mt-3 text-sm font-bold text-ink">{title}</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-faint">{body}</p>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}

function PracticeOption({
  to,
  icon,
  title,
  body,
  cta,
  badge,
}: {
  to: string;
  icon: IconName;
  title: string;
  body: string;
  cta: string;
  badge?: string;
}) {
  return (
    <Link
      to={to}
      className="itq-practice-card group rounded-2xl p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="itq-practice-icon grid size-11 place-items-center rounded-xl">
          <Icon name={icon} size={20} />
        </span>
        {badge && <Badge tone="warning">{badge} to revisit</Badge>}
      </div>
      <h3 className="mt-4 text-base font-bold text-ink">{title}</h3>
      <p className="mt-1.5 min-h-12 text-sm leading-relaxed text-ink-faint">{body}</p>
      <span className="itq-practice-cta mt-5 inline-flex items-center gap-1.5 text-sm font-bold">
        {cta}
        <Icon name="arrowRight" size={15} className="transition-transform group-hover:translate-x-1" />
      </span>
    </Link>
  );
}
