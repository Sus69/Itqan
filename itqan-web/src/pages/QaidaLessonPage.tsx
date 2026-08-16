import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, Badge, Button } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { QAIDA_LESSONS, type QaidaLesson, type QaidaTile } from '@/lib/qaidaData';
import {
  loadQaidaState,
  markTilePracticed,
  completeLesson,
  updateQaidaPreferences,
} from '@/lib/qaidaState';
import { speakArabic } from '@/lib/qaidaAudio';
import { useRecorder } from '@/hooks/useRecorder';

export default function QaidaLessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();

  const idNum = parseInt(lessonId || '1', 10);
  const lesson: QaidaLesson =
    QAIDA_LESSONS.find((l) => l.id === idNum) || QAIDA_LESSONS[0];

  const [qaidaState, setQaidaState] = useState(loadQaidaState());
  const [activeTile, setActiveTile] = useState<QaidaTile | null>(null);
  const [currentlyPlayingTileId, setCurrentlyPlayingTileId] = useState<string | null>(null);

  // Lesson view toggles
  const [audioMode, setAudioMode] = useState<'rawan' | 'hijjay'>(
    qaidaState.preferences.audioMode
  );
  const [showTransliteration, setShowTransliteration] = useState(
    qaidaState.preferences.showTransliteration
  );
  const [playbackSpeed, setPlaybackSpeed] = useState(
    qaidaState.preferences.audioPlaybackRate
  );

  // Quiz Modal State
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [selectedAnswerIdx, setSelectedAnswerIdx] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);

  // Voice Record Modal State
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const recorder = useRecorder();

  // Progress metrics for this lesson
  const lessonProgress = qaidaState.lessonProgress[lesson.id];
  const practicedTiles = lessonProgress?.practicedTiles || [];
  const isLessonComplete = qaidaState.completedLessonIds.includes(lesson.id);
  const progressPercent = Math.round(
    (practicedTiles.length / Math.max(1, lesson.tiles.length)) * 100
  );

  // Sync state changes
  useEffect(() => {
    setQaidaState(loadQaidaState());
  }, [lesson.id]);

  const handleToggleMode = (mode: 'rawan' | 'hijjay') => {
    setAudioMode(mode);
    setQaidaState(updateQaidaPreferences({ audioMode: mode }));
  };

  const handleToggleTransliteration = () => {
    const next = !showTransliteration;
    setShowTransliteration(next);
    setQaidaState(updateQaidaPreferences({ showTransliteration: next }));
  };

  const handleTileClick = async (tile: QaidaTile) => {
    setActiveTile(tile);
    setCurrentlyPlayingTileId(tile.id);

    try {
      const textToSpeak =
        audioMode === 'hijjay' && tile.spelledArabic
          ? tile.spelledArabic
          : tile.arabic;
      await speakArabic(textToSpeak, playbackSpeed);
      const updated = markTilePracticed(lesson.id, tile.id);
      setQaidaState(updated);
    } finally {
      setCurrentlyPlayingTileId(null);
    }
  };

  const handleMarkComplete = () => {
    const updated = completeLesson(lesson.id);
    setQaidaState(updated);
  };

  const prevLesson = QAIDA_LESSONS.find((l) => l.id === lesson.id - 1);
  const nextLesson = QAIDA_LESSONS.find((l) => l.id === lesson.id + 1);

  const getTileTagTone = (tag?: string) => {
    switch (tag) {
      case 'heavy':
        return 'gold';
      case 'whistle':
        return 'brand';
      case 'echo':
        return 'info';
      case 'nasal':
        return 'success';
      case 'madd':
      case 'leen':
        return 'warning';
      case 'shaddah':
        return 'error';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to="/qaida"
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700"
          >
            <Icon name="arrow-left" size={14} />
            Back to Qa'idah Roadmap
          </Link>
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-brand-100 px-2.5 py-1 text-xs font-bold text-brand-800">
              Lesson {lesson.id} of 22
            </span>
            <span className="text-xs font-semibold text-ink-faint">
              {lesson.stageTitle}
            </span>
          </div>
          <h1 className="mt-1 font-arabic text-2xl font-black text-ink sm:text-3xl">
            {lesson.titleArabic}{' '}
            <span className="font-sans text-xl font-bold text-ink-soft">
              — {lesson.titleEnglish}
            </span>
          </h1>
        </div>

        {/* Quick Nav jumpers */}
        <div className="flex items-center gap-2">
          {prevLesson && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(`/qaida/lesson/${prevLesson.id}`)}
            >
              <Icon name="arrow-left" size={14} />
              Prev
            </Button>
          )}
          {nextLesson && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(`/qaida/lesson/${nextLesson.id}`)}
            >
              Next
              <Icon name="arrow-right" size={14} />
            </Button>
          )}
        </div>
      </div>

      {/* Lesson Progress & Guidelines Hero Card */}
      <Card className="border-sand-200 bg-gradient-to-r from-sand-50/90 to-brand-50/40 p-5 sm:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl space-y-2">
            <p className="text-sm leading-relaxed text-ink-soft">{lesson.summary}</p>
            {lesson.keyRules.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {lesson.keyRules.slice(0, 3).map((rule, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-sand-200 bg-white/80 px-2.5 py-1 text-xs text-ink-soft"
                  >
                    <Icon name="check" size={12} className="text-brand-600" />
                    {rule}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Progress Tracker Widget */}
          <div className="flex flex-col items-center justify-center rounded-2xl border border-sand-200 bg-white p-4 shadow-xs lg:min-w-56">
            <div className="flex w-full items-center justify-between text-xs font-bold">
              <span className="text-ink-soft">Lesson Practice</span>
              <span className="text-brand-700">{progressPercent}%</span>
            </div>
            <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-sand-100">
              <div
                className="h-full rounded-full bg-brand-600 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="mt-2 flex w-full items-center justify-between text-[11px] text-ink-faint">
              <span>
                {practicedTiles.length} of {lesson.tiles.length} practiced
              </span>
              {isLessonComplete ? (
                <span className="font-bold text-success">Completed</span>
              ) : (
                <span>In Progress</span>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Control Bar: Audio Mode & Transliteration Settings */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface-1 p-4">
        {/* Spelling vs Fluency Mode */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-ink-faint">Reading Mode:</span>
          <div className="inline-flex rounded-xl bg-sand-100 p-1">
            <button
              onClick={() => handleToggleMode('rawan')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                audioMode === 'rawan'
                  ? 'bg-white text-ink shadow-xs'
                  : 'text-ink-faint hover:text-ink'
              }`}
            >
              Rawan (Fluent)
            </button>
            <button
              onClick={() => handleToggleMode('hijjay')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                audioMode === 'hijjay'
                  ? 'bg-white text-ink shadow-xs'
                  : 'text-ink-faint hover:text-ink'
              }`}
            >
              Hijjay (Spelled)
            </button>
          </div>
        </div>

        {/* Speed & Transliteration Toggles */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleTransliteration}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
              showTransliteration
                ? 'border-brand-300 bg-brand-50 text-brand-700'
                : 'border-border bg-surface-1 text-ink-faint hover:bg-sand-50'
            }`}
          >
            <Icon name="sparkle" size={14} />
            Transliteration {showTransliteration ? 'ON' : 'OFF'}
          </button>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-ink-faint">
            <span>Speed:</span>
            {[0.75, 1.0, 1.25].map((rate) => (
              <button
                key={rate}
                onClick={() => {
                  setPlaybackSpeed(rate);
                  setQaidaState(updateQaidaPreferences({ audioPlaybackRate: rate }));
                }}
                className={`rounded-md px-2 py-1 text-xs ${
                  playbackSpeed === rate
                    ? 'bg-brand-600 font-bold text-white'
                    : 'bg-sand-100 text-ink-soft hover:bg-sand-200'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Interactive Calligraphic Tile Grid */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-ink">
            Interactive Practice Grid ({lesson.tiles.length} Characters/Words)
          </h3>
          <span className="text-xs text-ink-faint">
            Click any tile to hear authentic pronunciation
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
          {lesson.tiles.map((tile) => {
            const isPracticed = practicedTiles.includes(tile.id);
            const isPlayingThis = currentlyPlayingTileId === tile.id;

            return (
              <div
                key={tile.id}
                onClick={() => handleTileClick(tile)}
                className={`group relative flex flex-col items-center justify-between rounded-2xl border p-4 text-center transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${
                  isPlayingThis
                    ? 'border-brand-500 bg-brand-50/80 shadow-md ring-2 ring-brand-500/30'
                    : isPracticed
                    ? 'border-brand-200 bg-surface-1/90'
                    : 'border-border bg-surface-1 hover:border-brand-300'
                }`}
              >
                {/* Rule Tag Badge (if any) */}
                <div className="flex h-5 w-full items-center justify-between">
                  {tile.ruleTag && tile.ruleTag !== 'normal' ? (
                    <Badge tone={getTileTagTone(tile.ruleTag)}>
                      {tile.ruleTag}
                    </Badge>
                  ) : (
                    <span />
                  )}
                  {isPracticed && (
                    <span className="size-2 rounded-full bg-success shadow-xs" />
                  )}
                </div>

                {/* Main Large Arabic Glyph */}
                <div className="my-3 flex min-h-16 items-center justify-center">
                  <span
                    className={`font-arabic text-3xl font-bold tracking-normal transition-colors sm:text-4xl ${
                      isPlayingThis
                        ? 'text-brand-700'
                        : 'text-ink group-hover:text-brand-600'
                    }`}
                  >
                    {tile.arabic}
                  </span>
                </div>

                {/* Subtitle: Spelled Breakdown or Transliteration */}
                <div className="w-full space-y-0.5 border-t border-sand-100/70 pt-2">
                  {audioMode === 'hijjay' && tile.spelledArabic ? (
                    <p className="font-arabic text-xs font-semibold text-brand-700">
                      {tile.spelledArabic}
                    </p>
                  ) : showTransliteration && tile.transliteration ? (
                    <p className="line-clamp-1 text-xs font-medium text-ink-soft">
                      {tile.transliteration}
                    </p>
                  ) : null}

                  {tile.englishMeaning && (
                    <p className="line-clamp-1 text-[10px] text-ink-faint">
                      {tile.englishMeaning}
                    </p>
                  )}
                </div>

                {/* Voice Record Hover Icon Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTile(tile);
                    setIsVoiceModalOpen(true);
                  }}
                  title="Practice pronouncing this tile"
                  className="absolute top-2 right-2 rounded-full p-1 text-ink-faint opacity-0 transition-opacity group-hover:opacity-100 hover:bg-brand-100 hover:text-brand-700"
                >
                  <Icon name="microphone" size={14} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lesson Action Footer Bar */}
      <Card className="flex flex-col items-center justify-between gap-4 border-brand-200 bg-surface-1 p-6 sm:flex-row">
        <div>
          <h4 className="text-sm font-bold text-ink">Ready to verify mastery?</h4>
          <p className="text-xs text-ink-faint">
            Take the quick test or mark this lesson complete to advance on the roadmap.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {lesson.quiz && lesson.quiz.length > 0 && (
            <Button
              variant="secondary"
              onClick={() => {
                setIsQuizOpen(true);
                setSelectedAnswerIdx(null);
                setIsAnswerSubmitted(false);
              }}
            >
              <Icon name="sparkle" size={16} />
              Take Lesson Quiz
            </Button>
          )}

          <Button
            variant={isLessonComplete ? 'secondary' : 'gold'}
            onClick={handleMarkComplete}
          >
            <Icon name="check" size={16} />
            {isLessonComplete ? 'Completed (+50 XP)' : 'Mark Lesson Complete'}
          </Button>

          {nextLesson && (
            <Button
              variant="primary"
              onClick={() => navigate(`/qaida/lesson/${nextLesson.id}`)}
            >
              Continue to Lesson {nextLesson.id}
              <Icon name="arrow-right" size={16} />
            </Button>
          )}
        </div>
      </Card>

      {/* Voice Pronunciation Practice Modal */}
      {isVoiceModalOpen && activeTile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-sand-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-sand-100 pb-4">
              <h3 className="text-base font-bold text-ink">Pronunciation Studio</h3>
              <button
                onClick={() => {
                  recorder.discard();
                  setIsVoiceModalOpen(false);
                }}
                className="rounded-lg p-1 text-ink-faint hover:bg-sand-100"
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            <div className="my-6 text-center">
              <span className="font-arabic text-6xl font-bold text-brand-700">
                {activeTile.arabic}
              </span>
              {activeTile.transliteration && (
                <p className="mt-2 text-sm font-semibold text-ink-soft">
                  {activeTile.transliteration}
                </p>
              )}
              {activeTile.ruleNote && (
                <p className="mt-1 text-xs text-brand-600">{activeTile.ruleNote}</p>
              )}
            </div>

            {/* Recorder Controls */}
            <div className="flex flex-col items-center justify-center space-y-4 rounded-2xl bg-sand-50 p-5">
              {!recorder.result ? (
                <button
                  onClick={async () => {
                    if (recorder.status === 'recording') {
                      recorder.stop();
                    } else {
                      const ok = await recorder.init();
                      if (ok) recorder.start();
                    }
                  }}
                  className={`flex size-16 items-center justify-center rounded-full shadow-md transition-all ${
                    recorder.status === 'recording'
                      ? 'anim-pulse bg-error text-white'
                      : 'bg-brand-600 text-white hover:bg-brand-700'
                  }`}
                >
                  <Icon name={recorder.status === 'recording' ? 'stop' : 'mic'} size={24} />
                </button>
              ) : (
                <div className="w-full space-y-3">
                  <div className="flex items-center justify-center gap-2">
                    <span className="size-2 rounded-full bg-success" />
                    <span className="text-xs font-bold text-ink">Recording Captured!</span>
                  </div>
                  {recorder.result.objectUrl && (
                    <audio
                      src={recorder.result.objectUrl}
                      controls
                      className="h-10 w-full"
                    />
                  )}
                  <div className="flex justify-center gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => recorder.discard()}
                    >
                      Re-record
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => {
                        markTilePracticed(lesson.id, activeTile.id);
                        setIsVoiceModalOpen(false);
                        recorder.discard();
                      }}
                    >
                      Save Attempt (+10 XP)
                    </Button>
                  </div>
                </div>
              )}

              <p className="text-xs text-ink-faint">
                {recorder.status === 'recording'
                  ? `Recording in progress... (${recorder.seconds}s)`
                  : !recorder.result
                  ? 'Tap microphone to speak and evaluate your phonetics'
                  : ''}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Lesson Quiz Modal */}
      {isQuizOpen && lesson.quiz && lesson.quiz[0] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-sand-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-sand-100 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
                Lesson {lesson.id} Mastery Check
              </span>
              <button
                onClick={() => setIsQuizOpen(false)}
                className="rounded-lg p-1 text-ink-faint hover:bg-sand-100"
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            <div className="my-5">
              <h3 className="text-base font-bold text-ink">
                {lesson.quiz[0].question}
              </h3>

              <div className="mt-4 space-y-2.5">
                {lesson.quiz[0].options.map((opt, idx) => {
                  const isSelected = selectedAnswerIdx === idx;
                  let optionStyle = 'border-sand-200 hover:border-brand-400 bg-white';
                  if (isAnswerSubmitted) {
                    if (opt.correct) {
                      optionStyle = 'border-success bg-success/10 text-success';
                    } else if (isSelected && !opt.correct) {
                      optionStyle = 'border-error bg-error/10 text-error';
                    }
                  } else if (isSelected) {
                    optionStyle = 'border-brand-600 bg-brand-50 text-brand-800';
                  }

                  return (
                    <div
                      key={idx}
                      onClick={() => !isAnswerSubmitted && setSelectedAnswerIdx(idx)}
                      className={`cursor-pointer rounded-xl border p-3.5 text-xs font-medium transition-all ${optionStyle}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span>{opt.text}</span>
                        {isAnswerSubmitted && opt.correct && (
                          <Icon name="check" size={16} className="text-success" />
                        )}
                      </div>
                      {isAnswerSubmitted && isSelected && (
                        <p className="mt-2 text-[11px] text-ink-soft">
                          {opt.explanation}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-sand-100 pt-4">
              {!isAnswerSubmitted ? (
                <Button
                  variant="primary"
                  disabled={selectedAnswerIdx === null}
                  onClick={() => setIsAnswerSubmitted(true)}
                >
                  Submit Answer
                </Button>
              ) : (
                <Button
                  variant="gold"
                  onClick={() => {
                    completeLesson(lesson.id, 100);
                    setIsQuizOpen(false);
                  }}
                >
                  Complete & Claim XP
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
