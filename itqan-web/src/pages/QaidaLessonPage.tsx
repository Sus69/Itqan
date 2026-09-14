import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Badge, Button, Card, EmptyState, InlineNotice, Modal, ProgressBar } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { QAIDA_LESSONS, type QaidaLesson, type QaidaTile } from '@/lib/qaidaData';
import {
  completeLesson,
  lessonProgressFor,
  loadQaidaState,
  markTileHeard,
  markTilePracticed,
  recordQuizResult,
  remainingToComplete,
  updateQaidaPreferences,
  type QaidaState,
} from '@/lib/qaidaState';
import { onVoicesChanged, speakArabic, speechSupport, stopSpeaking } from '@/lib/qaidaAudio';
import { useRecorder } from '@/hooks/useRecorder';

/**
 * One Qa'idah lesson.
 *
 * The loop is listen → record → check, and each step only claims what it did:
 * playing a tile records that it was heard, recording records that it was
 * practiced, and the lesson cannot be marked complete until both have happened.
 * The audio is the browser's speech engine, which is useful for letter order and
 * pacing but is not Qari recitation — every affordance that plays it says so.
 */
export default function QaidaLessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const lesson = QAIDA_LESSONS.find((l) => String(l.id) === lessonId);

  if (!lesson) {
    return (
      <div className="anim-fade-up mx-auto max-w-focus py-10">
        <EmptyState
          icon={<Icon name="search" size={22} />}
          title="That lesson does not exist"
          body={`The Qa'idah has ${QAIDA_LESSONS.length} lessons, numbered 1 to ${QAIDA_LESSONS.length}.`}
          action={
            <Link to="/learn/qaida">
              <Button>Back to the roadmap</Button>
            </Link>
          }
        />
      </div>
    );
  }

  // Remounting on lesson change resets the grid, quiz and any open dialog, so
  // nothing from the previous lesson can leak into this one.
  return <LessonView key={lesson.id} lesson={lesson} />;
}

const TAG_TONES: Record<string, 'gold' | 'brand' | 'info' | 'success' | 'warning' | 'error'> = {
  heavy: 'gold',
  whistle: 'brand',
  echo: 'info',
  nasal: 'success',
  madd: 'warning',
  leen: 'warning',
  shaddah: 'error',
  tanween: 'info',
};

const SPEEDS = [0.75, 1, 1.25];

function LessonView({ lesson }: { lesson: QaidaLesson }) {
  const [state, setState] = useState(loadQaidaState);
  const [audioMode, setAudioMode] = useState(state.preferences.audioMode);
  const [showTransliteration, setShowTransliteration] = useState(
    state.preferences.showTransliteration,
  );
  const [speed, setSpeed] = useState(state.preferences.audioPlaybackRate);

  const [playingTileId, setPlayingTileId] = useState<string | null>(null);
  const [recordTile, setRecordTile] = useState<QaidaTile | null>(null);
  const [quizOpen, setQuizOpen] = useState(false);

  // Speech availability is checked rather than assumed: the voice list arrives
  // asynchronously in some browsers, and several have no Arabic voice at all.
  const [speech, setSpeech] = useState(speechSupport);
  useEffect(() => {
    const unsubscribe = onVoicesChanged(() => setSpeech(speechSupport()));
    return () => {
      unsubscribe();
      stopSpeaking();
    };
  }, []);

  const progress = lessonProgressFor(state, lesson.id);
  const heardCount = progress.heardTiles.length;
  const practicedCount = progress.practicedTiles.length;
  const isComplete = state.completedLessonIds.includes(lesson.id);
  const remaining = remainingToComplete(lesson, progress);
  const heardPercent = Math.round((heardCount / Math.max(1, lesson.tiles.length)) * 100);

  const prev = QAIDA_LESSONS.find((l) => l.id === lesson.id - 1);
  const next = QAIDA_LESSONS.find((l) => l.id === lesson.id + 1);

  // Only the most recent playback may mark a tile heard. Clicking a second tile
  // cancels the first, and an interrupted guide is not something the learner
  // actually listened to.
  const playToken = useRef(0);

  const playTile = useCallback(
    async (tile: QaidaTile) => {
      const token = ++playToken.current;
      setPlayingTileId(tile.id);
      const text = audioMode === 'hijjay' && tile.spelledArabic ? tile.spelledArabic : tile.arabic;
      await speakArabic(text, speed);
      if (playToken.current !== token) return;
      setPlayingTileId(null);
      if (speech === 'unsupported') return;
      setState(markTileHeard(lesson.id, tile.id));
    },
    [audioMode, speed, speech, lesson.id],
  );

  const setMode = (mode: 'rawan' | 'hijjay') => {
    setAudioMode(mode);
    setState(updateQaidaPreferences({ audioMode: mode }));
  };

  const toggleTransliteration = () => {
    const value = !showTransliteration;
    setShowTransliteration(value);
    setState(updateQaidaPreferences({ showTransliteration: value }));
  };

  const setPlaybackSpeed = (rate: number) => {
    setSpeed(rate);
    setState(updateQaidaPreferences({ audioPlaybackRate: rate }));
  };

  return (
    <div className="anim-fade-up mx-auto max-w-shell space-y-6 pb-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <Link
            to="/learn/qaida"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 hover:text-brand-800"
          >
            <Icon name="arrowLeft" size={14} />
            Qa'idah roadmap
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge tone="brand">
              Lesson {lesson.id} of {QAIDA_LESSONS.length}
            </Badge>
            <span className="text-xs font-semibold text-ink-faint">{lesson.stageTitle}</span>
            {isComplete && (
              <Badge tone="success">
                <Icon name="check" size={12} /> Completed
              </Badge>
            )}
          </div>
          <h1 className="arabic-text mt-2 text-2xl text-ink sm:text-3xl" dir="rtl" lang="ar">
            {lesson.titleArabic}
          </h1>
          <p className="mt-0.5 text-lg font-extrabold tracking-tight text-ink-soft">
            {lesson.titleEnglish}
          </p>
        </div>

        <nav aria-label="Lesson navigation" className="flex shrink-0 items-center gap-2">
          {prev && (
            <Link to={`/learn/qaida/lesson/${prev.id}`}>
              <Button variant="secondary" size="sm">
                <Icon name="arrowLeft" size={14} /> Lesson {prev.id}
              </Button>
            </Link>
          )}
          {next && (
            <Link to={`/learn/qaida/lesson/${next.id}`}>
              <Button variant="secondary" size="sm">
                Lesson {next.id} <Icon name="arrowRight" size={14} />
              </Button>
            </Link>
          )}
        </nav>
      </div>

      {/* What this lesson covers, and how far through it the learner is. */}
      <Card className="grid gap-6 lg:grid-cols-[1fr_15rem] lg:items-start">
        <div className="min-w-0">
          <p className="max-w-reading text-sm leading-relaxed text-ink-soft">{lesson.summary}</p>
          {lesson.keyRules.length > 0 && (
            <ul className="mt-4 flex list-none flex-wrap gap-2">
              {lesson.keyRules.map((rule) => (
                <li
                  key={rule}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-2.5 py-1 text-xs text-ink-soft"
                >
                  <Icon name="check" size={12} className="text-brand-600" />
                  {rule}
                </li>
              ))}
            </ul>
          )}
          {lesson.pedagogicalTips.length > 0 && (
            <details className="group mt-4">
              <summary className="cursor-pointer list-none text-xs font-bold text-brand-700 hover:text-brand-800">
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="info" size={13} />
                  How to teach or study this lesson
                </span>
              </summary>
              <ul className="mt-2.5 list-disc space-y-1.5 pl-5 text-xs leading-relaxed text-ink-faint">
                {lesson.pedagogicalTips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </details>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-surface-2 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-faint">This lesson</p>
          <ProgressBar
            value={heardPercent}
            tone={isComplete ? 'success' : 'brand'}
            className="mt-3"
          />
          <dl className="mt-3 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <dt className="text-ink-faint">Tiles heard</dt>
              <dd className="font-bold tabular-nums text-ink">
                {heardCount}/{lesson.tiles.length}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-ink-faint">Tiles you recorded</dt>
              <dd className="font-bold tabular-nums text-ink">{practicedCount}</dd>
            </div>
            {progress.quizAttempts > 0 && progress.quizScore !== undefined && (
              <div className="flex items-center justify-between">
                <dt className="text-ink-faint">Last quiz</dt>
                <dd className="font-bold tabular-nums text-ink">{progress.quizScore}%</dd>
              </div>
            )}
          </dl>
        </div>
      </Card>

      {speech !== 'ready' && (
        <InlineNotice
          tone="warning"
          title={
            speech === 'unsupported'
              ? 'This browser cannot play the pronunciation guide'
              : 'No Arabic voice is installed'
          }
        >
          {speech === 'unsupported'
            ? 'Everything else on this page works. To hear the guide, open Itqān in Chrome, Edge or Safari.'
            : 'The guide will fall back to a non-Arabic voice, which will not sound correct. Adding an Arabic language pack in your system settings fixes it. Recording your own recitation still works.'}
        </InlineNotice>
      )}

      {/* Reading controls. Each one changes what the tiles below show or sound like. */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl border border-border bg-surface-1 p-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-ink-faint" id="reading-mode-label">
            Reading mode
          </span>
          <div
            role="group"
            aria-labelledby="reading-mode-label"
            className="inline-flex rounded-xl bg-sand-100 p-1"
          >
            <Toggle active={audioMode === 'rawan'} onClick={() => setMode('rawan')}>
              Rawan · fluent
            </Toggle>
            <Toggle active={audioMode === 'hijjay'} onClick={() => setMode('hijjay')}>
              Hijjay · spelled out
            </Toggle>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleTransliteration}
          aria-pressed={showTransliteration}
          className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors ${
            showTransliteration
              ? 'border-brand-300 bg-brand-50 text-brand-800'
              : 'border-border bg-surface-1 text-ink-faint hover:bg-sand-100'
          }`}
        >
          <Icon name="note" size={13} />
          Transliteration {showTransliteration ? 'on' : 'off'}
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-ink-faint" id="speed-label">
            Guide speed
          </span>
          <div
            role="group"
            aria-labelledby="speed-label"
            className="inline-flex rounded-xl bg-sand-100 p-1"
          >
            {SPEEDS.map((rate) => (
              <Toggle key={rate} active={speed === rate} onClick={() => setPlaybackSpeed(rate)}>
                {rate}×
              </Toggle>
            ))}
          </div>
        </div>
      </div>

      {/* The practice grid. */}
      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-base font-bold text-ink">
            Practice grid · {lesson.tiles.length} {lesson.tiles.length === 1 ? 'tile' : 'tiles'}
          </h2>
          <p className="text-xs text-ink-faint">
            Tap a tile for a synthesised pronunciation guide, or the microphone to record yourself.
          </p>
        </div>

        <ul className="grid list-none grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {lesson.tiles.map((tile) => {
            const heard = progress.heardTiles.includes(tile.id);
            const practiced = progress.practicedTiles.includes(tile.id);
            const playing = playingTileId === tile.id;
            const tone = tile.ruleTag && tile.ruleTag !== 'normal' ? TAG_TONES[tile.ruleTag] : null;

            return (
              <li key={tile.id} className="relative">
                <button
                  type="button"
                  onClick={() => playTile(tile)}
                  aria-label={`Hear ${tile.transliteration ?? tile.arabic}`}
                  className={`group flex w-full flex-col items-center rounded-2xl border p-4 pt-9 text-center transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)] ${
                    playing
                      ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/25'
                      : practiced
                        ? 'border-brand-300 bg-surface'
                        : 'border-border bg-surface hover:border-brand-300'
                  }`}
                >
                  <span
                    className={`arabic-text my-2 flex min-h-14 items-center text-3xl sm:text-4xl ${
                      playing ? 'text-brand-700' : 'text-ink group-hover:text-brand-700'
                    }`}
                    dir="rtl"
                    lang="ar"
                  >
                    {tile.arabic}
                  </span>

                  <span className="w-full space-y-0.5 border-t border-border pt-2">
                    {audioMode === 'hijjay' && tile.spelledArabic ? (
                      <span
                        className="arabic-text block text-xs text-brand-700"
                        dir="rtl"
                        lang="ar"
                      >
                        {tile.spelledArabic}
                      </span>
                    ) : showTransliteration && tile.transliteration ? (
                      <span className="block line-clamp-1 text-xs font-semibold text-ink-soft">
                        {tile.transliteration}
                      </span>
                    ) : null}
                    {tile.englishMeaning && (
                      <span className="block line-clamp-1 text-[10px] text-ink-faint">
                        {tile.englishMeaning}
                      </span>
                    )}
                  </span>
                </button>

                {/* Status and record control sit outside the play button so they
                    are their own targets rather than nested interactives. */}
                <span className="pointer-events-none absolute left-3 top-2.5">
                  {tone ? (
                    <Badge tone={tone}>{tile.ruleTag}</Badge>
                  ) : heard ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-700">
                      <Icon name="check" size={11} />
                      {practiced ? 'recorded' : 'heard'}
                    </span>
                  ) : null}
                </span>

                <button
                  type="button"
                  onClick={() => setRecordTile(tile)}
                  title={`Record yourself saying ${tile.transliteration ?? tile.arabic}`}
                  aria-label={`Record yourself saying ${tile.transliteration ?? tile.arabic}`}
                  className={`absolute right-2 top-2 rounded-full p-1.5 transition-colors ${
                    practiced
                      ? 'text-brand-700 hover:bg-brand-100'
                      : 'text-ink-faint hover:bg-brand-100 hover:text-brand-700'
                  }`}
                >
                  <Icon name="microphone" size={14} />
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Finish the lesson — gated on having actually done it. */}
      <Card className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-ink">
            {isComplete ? 'Lesson completed' : 'Finish this lesson'}
          </h2>
          {isComplete ? (
            <p className="mt-1 max-w-reading text-xs leading-relaxed text-ink-faint">
              Revisit it whenever you like — reopening a completed lesson does not change your
              progress.
            </p>
          ) : remaining.length > 0 ? (
            <>
              <p className="mt-1 text-xs text-ink-faint">Two things left before it counts:</p>
              <ul className="mt-1.5 list-none space-y-1">
                {remaining.map((item) => (
                  <li key={item} className="flex items-center gap-1.5 text-xs text-ink-soft">
                    <Icon name="alert" size={12} className="text-warning" />
                    {item}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="mt-1 max-w-reading text-xs leading-relaxed text-ink-faint">
              You have heard every tile and recorded yourself at least once. Mark it complete to move
              the roadmap forward.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {lesson.quiz && lesson.quiz.length > 0 && (
            <Button variant="secondary" onClick={() => setQuizOpen(true)}>
              <Icon name="note" size={15} />
              {progress.quizAttempts > 0 ? 'Retake the quiz' : 'Take the quiz'}
            </Button>
          )}

          {!isComplete && (
            <Button
              variant="gold"
              disabled={remaining.length > 0}
              onClick={() => setState(completeLesson(lesson.id))}
            >
              <Icon name="check" size={15} />
              Mark lesson complete
            </Button>
          )}

          {next && (
            <Link to={`/learn/qaida/lesson/${next.id}`}>
              <Button>
                Lesson {next.id} <Icon name="arrowRight" size={15} />
              </Button>
            </Link>
          )}
        </div>
      </Card>

      {recordTile && (
        <TileRecorder
          lessonId={lesson.id}
          tile={recordTile}
          speechReady={speech !== 'unsupported'}
          speed={speed}
          onSaved={(updated) => setState(updated)}
          onClose={() => setRecordTile(null)}
        />
      )}

      {quizOpen && lesson.quiz && lesson.quiz.length > 0 && (
        <LessonQuiz
          lessonId={lesson.id}
          questions={lesson.quiz}
          onRecorded={(updated) => setState(updated)}
          onClose={() => setQuizOpen(false)}
        />
      )}
    </div>
  );
}

function Toggle({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
        active ? 'bg-surface text-ink shadow-[var(--shadow-soft)]' : 'text-ink-faint hover:text-ink'
      }`}
    >
      {children}
    </button>
  );
}

/**
 * The tile recorder.
 *
 * It captures a take, lets the learner hear it against the guide, and records
 * that the tile was practiced. It does not score anything — Qa'idah tiles are
 * single letters and words, and the analysis service works on verses — so the
 * copy says what the learner is getting rather than implying a verdict.
 *
 * A take is only accepted if it contains audio: too short or silent, and saving
 * it would record practice that did not happen.
 */
const MIN_TAKE_SECONDS = 0.8;
const QUIET_PEAK = 0.08;

function TileRecorder({
  lessonId,
  tile,
  speechReady,
  speed,
  onSaved,
  onClose,
}: {
  lessonId: number;
  tile: QaidaTile;
  speechReady: boolean;
  speed: number;
  onSaved: (state: QaidaState) => void;
  onClose: () => void;
}) {
  const recorder = useRecorder();
  const { release, discard, result, seconds, peak } = recorder;

  // Hand the microphone back as soon as the dialog goes away, so the browser's
  // recording indicator does not stay lit over the rest of the lesson.
  useEffect(() => () => release(), [release]);

  const tooShort = !!result && seconds < MIN_TAKE_SECONDS;
  const tooQuiet = !!result && !tooShort && peak < QUIET_PEAK;
  const usable = !!result && !tooShort && !tooQuiet;

  const close = () => {
    stopSpeaking();
    discard();
    release();
    onClose();
  };

  return (
    <Modal
      open
      onClose={close}
      title="Record this tile"
      description="Hear the guide, then say it yourself and compare. Nothing here is scored."
    >
      <div className="rounded-2xl border border-border bg-surface-2 p-5 text-center">
        <span className="arabic-text block text-5xl text-brand-800" dir="rtl" lang="ar">
          {tile.arabic}
        </span>
        {tile.transliteration && (
          <p className="mt-2 text-sm font-bold text-ink-soft">{tile.transliteration}</p>
        )}
        {tile.ruleNote && <p className="mt-1 text-xs text-brand-700">{tile.ruleNote}</p>}
        {speechReady && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-3"
            onClick={() => speakArabic(tile.arabic, speed)}
          >
            <Icon name="play" size={14} /> Play the guide
          </Button>
        )}
      </div>

      {!recorder.isSupported ? (
        <InlineNotice tone="warning" title="Recording is not available in this browser" className="mt-5">
          You can still use the pronunciation guide. For recording, try Chrome, Edge or Safari.
        </InlineNotice>
      ) : recorder.permission === 'denied' ? (
        <InlineNotice tone="error" title="Microphone access is blocked" className="mt-5">
          Your browser is refusing the microphone for this site. Allow it in the address-bar
          permissions, then reopen this tile.
        </InlineNotice>
      ) : (
        <div className="mt-5 flex flex-col items-center gap-4">
          {!result ? (
            <>
              <button
                type="button"
                onClick={async () => {
                  if (recorder.status === 'recording') {
                    recorder.stop();
                    return;
                  }
                  stopSpeaking();
                  const ready = await recorder.init();
                  if (ready) recorder.start();
                }}
                aria-label={recorder.status === 'recording' ? 'Stop recording' : 'Start recording'}
                className={`grid size-16 place-items-center rounded-full text-white shadow-[var(--shadow-soft)] transition-colors ${
                  recorder.status === 'recording'
                    ? 'anim-pulse bg-error'
                    : 'bg-brand-600 hover:bg-brand-700'
                }`}
              >
                <Icon name={recorder.status === 'recording' ? 'stop' : 'mic'} size={24} />
              </button>

              {recorder.status === 'recording' ? (
                <>
                  <div
                    aria-hidden="true"
                    className="flex h-8 w-full max-w-xs items-end justify-center gap-0.5"
                  >
                    {recorder.bars.slice(-28).map((value, i) => (
                      <span
                        key={i}
                        className="w-1 rounded-full bg-brand-500/70"
                        style={{ height: `${Math.max(8, value * 100)}%` }}
                      />
                    ))}
                  </div>
                  <p aria-live="polite" className="text-xs font-bold tabular-nums text-ink-soft">
                    Recording · {seconds.toFixed(1)}s
                  </p>
                </>
              ) : (
                <p className="max-w-xs text-center text-xs leading-relaxed text-ink-faint">
                  Say the tile once, at your natural volume. Stop when you are done.
                </p>
              )}

              {recorder.error && (
                <InlineNotice tone="error" title="The microphone did not start" live>
                  {recorder.error}
                </InlineNotice>
              )}
            </>
          ) : (
            <div className="w-full space-y-3">
              <audio src={result.objectUrl} controls className="h-10 w-full" />

              {tooShort && (
                <InlineNotice tone="warning" title="That take was very short" live>
                  It lasted {seconds.toFixed(1)} seconds. Record again and give it a moment so there
                  is something to listen back to.
                </InlineNotice>
              )}
              {tooQuiet && (
                <InlineNotice tone="warning" title="We could not hear anything" live>
                  The take is almost silent. Check that the right microphone is selected, move a
                  little closer, and try again.
                </InlineNotice>
              )}
              {usable && (
                <p className="text-center text-xs leading-relaxed text-ink-faint">
                  Compare it with the guide. Saving marks this tile as practiced on this device — it
                  is not sent anywhere and it is not scored.
                </p>
              )}

              <div className="flex justify-center gap-2 pt-1">
                <Button variant="secondary" size="sm" onClick={() => discard()}>
                  <Icon name="restart" size={14} /> Record again
                </Button>
                <Button
                  size="sm"
                  disabled={!usable}
                  onClick={() => {
                    onSaved(markTilePracticed(lessonId, tile.id));
                    close();
                  }}
                >
                  <Icon name="check" size={14} /> Save as practiced
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

/**
 * The lesson quiz.
 *
 * It scores what the learner answered. The previous version awarded a perfect
 * result and completed the lesson no matter which option was picked, which made
 * the figure meaningless. Every question is asked, the explanation is shown
 * either way, and the result — pass or fail — is what gets stored. Completing
 * the lesson stays a separate, practice-gated action.
 */
function LessonQuiz({
  lessonId,
  questions,
  onRecorded,
  onClose,
}: {
  lessonId: number;
  questions: NonNullable<QaidaLesson['quiz']>;
  onRecorded: (state: QaidaState) => void;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [finished, setFinished] = useState(false);

  const question = questions[index];
  const isLast = index === questions.length - 1;
  const score = useMemo(
    () => Math.round((correct / Math.max(1, questions.length)) * 100),
    [correct, questions.length],
  );

  const reveal = () => {
    if (selected === null) return;
    if (question.options[selected]?.correct) setCorrect((c) => c + 1);
    setRevealed(true);
  };

  const advance = () => {
    if (!isLast) {
      setIndex((i) => i + 1);
      setSelected(null);
      setRevealed(false);
      return;
    }
    // Recorded once, at the end, from the answers actually given.
    onRecorded(
      recordQuizResult(lessonId, Math.round((correct / Math.max(1, questions.length)) * 100)),
    );
    setFinished(true);
  };

  if (finished) {
    const passed = score >= 70;
    return (
      <Modal open onClose={onClose} title="Quiz result">
        <div className="text-center">
          <p className="text-4xl font-extrabold tabular-nums text-ink">{score}%</p>
          <p className="mt-1 text-sm font-bold text-ink-soft">
            {correct} of {questions.length} correct
          </p>
        </div>
        <InlineNotice
          tone={passed ? 'success' : 'info'}
          title={passed ? 'You have the idea' : 'Worth another look'}
          className="mt-5"
        >
          {passed
            ? 'This checks that you can recognise the rule. Hearing and reciting the tiles is what builds it, so keep the grid open as you work.'
            : 'Recognising a rule comes from hearing it. Play through the tiles again with the spelled-out mode on, then retake this whenever you like.'}
        </InlineNotice>
        <div className="mt-6 flex justify-end">
          <Button onClick={onClose}>Back to the lesson</Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Question ${index + 1} of ${questions.length}`}
      description={question.question}
      wide
    >
      <ul className="list-none space-y-2.5">
        {question.options.map((option, i) => {
          const isSelected = selected === i;
          const tone = !revealed
            ? isSelected
              ? 'border-brand-600 bg-brand-50 text-brand-900'
              : 'border-border bg-surface hover:border-brand-300'
            : option.correct
              ? 'border-success bg-success-soft text-ink'
              : isSelected
                ? 'border-error bg-error-soft text-ink'
                : 'border-border bg-surface opacity-60';

          return (
            <li key={option.text}>
              <button
                type="button"
                disabled={revealed}
                aria-pressed={isSelected}
                onClick={() => setSelected(i)}
                className={`w-full rounded-xl border p-3.5 text-left text-sm transition-colors disabled:cursor-default ${tone}`}
              >
                <span className="flex items-start justify-between gap-2">
                  <span className="font-semibold">{option.text}</span>
                  {revealed && option.correct && (
                    <Icon name="check" size={16} className="shrink-0 text-success" />
                  )}
                </span>
                {revealed && (isSelected || option.correct) && (
                  <span className="mt-2 block text-xs leading-relaxed text-ink-soft">
                    {option.explanation}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 flex items-center justify-between gap-3">
        <p className="text-xs text-ink-faint">
          {revealed
            ? selected !== null && question.options[selected]?.correct
              ? 'Correct.'
              : 'Not this time — the correct answer is highlighted.'
            : 'Choose one answer.'}
        </p>
        {revealed ? (
          <Button onClick={advance}>
            {isLast ? 'See the result' : 'Next question'}
            <Icon name="arrowRight" size={15} />
          </Button>
        ) : (
          <Button disabled={selected === null} onClick={reveal}>
            Check answer
          </Button>
        )}
      </div>
    </Modal>
  );
}
