import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { cn } from '@/lib/cn';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import {
  type Goal,
  GOALS,
  ONBOARDING_KEY,
  getLearningGoal,
  setLearningGoal,
} from '@/lib/learnerGoal';

/**
 * First-run orientation.
 *
 * Two rules keep this from becoming an obstacle:
 *
 *  1. It only appears on Today. A learner who followed a link to a specific
 *     lesson already knows where they are going, and covering that page with a
 *     welcome — then navigating them somewhere else — loses their place.
 *  2. It is always skippable, by button or by Escape. Skipping is recorded, so
 *     it does not reappear on the next visit, and the goal simply stays unset
 *     until the learner chooses one from Today or their profile.
 */
export function LearnerOnboarding() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState<Goal | null>(getLearningGoal);
  const panelRef = useRef<HTMLDivElement>(null);

  useFocusTrap(open, panelRef);

  useEffect(() => {
    const seen = localStorage.getItem(ONBOARDING_KEY) === 'true';
    setOpen(!seen && location.pathname === '/');
  }, [location.pathname]);

  // Escape dismisses, and dismissing counts as "seen" — being asked twice is
  // worse than never having answered.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      localStorage.setItem(ONBOARDING_KEY, 'true');
      setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  const skip = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setOpen(false);
  };

  const complete = () => {
    if (!goal) return;
    const destination = GOALS.find((item) => item.id === goal)?.route ?? '/learn/tajweed';
    setLearningGoal(goal);
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setOpen(false);
    navigate(destination);
  };

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-ink/45 p-4 backdrop-blur-sm">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        tabIndex={-1}
        className="max-h-[92vh] w-full max-w-2xl overflow-auto rounded-[1.75rem] border border-border bg-surface shadow-[var(--shadow-lift)]"
      >
        <div className="bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 px-6 py-7 text-white sm:px-9 sm:py-9">
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-300">
                Welcome to Itqān
              </p>
              <h2
                id="onboarding-title"
                className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl"
              >
                {step === 0 ? 'A clear next step, every time.' : 'What would you like help with first?'}
              </h2>
            </div>
            <button
              type="button"
              onClick={skip}
              className="shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              Skip for now
            </button>
          </div>
          <p className="mt-6 text-xs font-semibold text-white/70">Step {step + 1} of 2</p>
          <div className="mt-2 flex gap-2" aria-hidden="true">
            {[0, 1].map((index) => (
              <span
                key={index}
                className={cn('h-1 flex-1 rounded-full', index <= step ? 'bg-gold-400' : 'bg-white/20')}
              />
            ))}
          </div>
        </div>

        <div className="p-6 sm:p-9">
          {step === 0 ? (
            <div className="space-y-5">
              <p className="max-w-xl text-base leading-relaxed text-ink-soft">
                Itqān guides a simple loop: learn one skill, try it with confidence, receive clear
                feedback, and continue from the next right step.
              </p>
              <ol className="grid gap-3 sm:grid-cols-3">
                {[
                  ['1', 'Learn', 'Understand one focused skill.'],
                  ['2', 'Practice', 'Listen, repeat, and record when ready.'],
                  ['3', 'Improve', 'Use one clear correction to try again.'],
                ].map(([number, title, body]) => (
                  <li key={number} className="rounded-2xl border border-border bg-surface-2 p-4">
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
              <div className="flex justify-end">
                <Button size="lg" onClick={() => setStep(1)}>
                  Choose my starting point <Icon name="arrowRight" size={17} />
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <p className="text-sm leading-relaxed text-ink-soft">
                This only chooses your first recommendation. Every part of Itqān stays open to you,
                and you can change this later from your profile.
              </p>
              <ul className="grid gap-3">
                {GOALS.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      aria-pressed={goal === item.id}
                      onClick={() => setGoal(item.id)}
                      className={cn(
                        'flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-colors',
                        goal === item.id
                          ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/15'
                          : 'border-border bg-surface hover:border-brand-300 hover:bg-surface-2',
                      )}
                    >
                      <span
                        className={cn(
                          'grid size-11 shrink-0 place-items-center rounded-xl',
                          goal === item.id ? 'bg-brand-600 text-white' : 'bg-sand-100 text-brand-700',
                        )}
                      >
                        <Icon name={item.icon} size={20} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-bold text-ink">{item.title}</span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-ink-faint">
                          {item.body}
                        </span>
                      </span>
                      {goal === item.id && (
                        <Icon name="check" size={18} className="ml-auto shrink-0 text-brand-700" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Button variant="ghost" onClick={() => setStep(0)}>
                  <Icon name="arrowLeft" size={16} /> Back
                </Button>
                <Button size="lg" onClick={complete} disabled={!goal}>
                  {goal ? 'Start my first session' : 'Choose one to continue'}
                  <Icon name="arrowRight" size={17} />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
