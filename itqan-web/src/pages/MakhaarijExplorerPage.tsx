import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Badge, Button, Card, EmptyState, InlineNotice } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { MAKHAARIJ_DATA } from '@/lib/qaidaData';
import { onVoicesChanged, speakArabic, speechSupport, stopSpeaking } from '@/lib/qaidaAudio';

/**
 * The articulation atlas — reference, not a lesson.
 *
 * It answers one question: where in the mouth or throat does this letter come
 * from? So it is a browse-and-inspect surface with no progress, no score and no
 * completion. It is reached from Practice and from a Qa'idah lesson, and it says
 * plainly that its audio is a synthesised guide rather than recitation.
 */
type CategoryKey = 'All' | 'Halqee' | 'Lisaani' | 'Shafawi' | 'Jawfee' | 'Khaysoom';

const CATEGORY_LABELS: Record<Exclude<CategoryKey, 'All'>, string> = {
  Halqee: 'Throat · الحلق',
  Lisaani: 'Tongue · اللسان',
  Shafawi: 'Lips · الشفتان',
  Jawfee: 'Oral cavity · الجوف',
  Khaysoom: 'Nose · الخيشوم',
};

const DISCOVERY_LETTERS = [
  'ب', 'ق', 'ك', 'ع', 'ح', 'غ', 'خ', 'ط', 'د', 'ت',
  'ص', 'س', 'ز', 'ف', 'م', 'ن', 'ل', 'ر', 'ض',
];

export default function MakhaarijExplorerPage() {
  const [category, setCategory] = useState<CategoryKey>('All');
  const [query, setQuery] = useState('');
  const [activeId, setActiveId] = useState(MAKHAARIJ_DATA[0].id);
  const [playing, setPlaying] = useState<string | null>(null);
  const [discoveryLetter, setDiscoveryLetter] = useState('ب');

  const [speech, setSpeech] = useState(speechSupport);
  useEffect(() => {
    const unsubscribe = onVoicesChanged(() => setSpeech(speechSupport()));
    return () => {
      unsubscribe();
      stopSpeaking();
    };
  }, []);

  // Counts come from the data so a new entry cannot leave a stale number behind.
  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const m of MAKHAARIJ_DATA) counts.set(m.category, (counts.get(m.category) ?? 0) + 1);
    return [
      { key: 'All' as CategoryKey, label: `All ${MAKHAARIJ_DATA.length} points`, count: MAKHAARIJ_DATA.length },
      ...(Object.keys(CATEGORY_LABELS) as Exclude<CategoryKey, 'All'>[]).map((key) => ({
        key,
        label: CATEGORY_LABELS[key],
        count: counts.get(key) ?? 0,
      })),
    ];
  }, []);

  const needle = query.trim().toLowerCase();
  const results = MAKHAARIJ_DATA.filter((m) => {
    const inCategory = category === 'All' || m.category === category;
    const matches =
      needle.length === 0 ||
      m.nameEnglish.toLowerCase().includes(needle) ||
      m.nameArabic.includes(query.trim()) ||
      m.subRegion.toLowerCase().includes(needle) ||
      m.letters.some((l) => l.includes(query.trim())) ||
      m.description.toLowerCase().includes(needle);
    return inCategory && matches;
  });

  const active = MAKHAARIJ_DATA.find((m) => m.id === activeId) ?? MAKHAARIJ_DATA[0];

  const play = async (text: string) => {
    if (speech === 'unsupported') return;
    setPlaying(text);
    await speakArabic(text, 0.8);
    setPlaying((current) => (current === text ? null : current));
  };

  return (
    <div className="anim-fade-up mx-auto max-w-shell space-y-6 pb-16">
      <Link
        to="/practice"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 hover:text-brand-800"
      >
        <Icon name="arrowLeft" size={14} />
        Practice
      </Link>

      <PageHeader
        title="Articulation atlas"
        subtitle={`Where each Arabic letter is produced — all ${MAKHAARIJ_DATA.length} points of articulation (مخارج الحروف), from the bottom of the throat to the nose.`}
      />

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
            ? 'The descriptions and letter groupings still work. To hear the guide, open Itqān in Chrome, Edge or Safari.'
            : 'The guide will fall back to a non-Arabic voice, which will not sound correct. Adding an Arabic language pack in your system settings fixes it.'}
        </InlineNotice>
      )}

      {/* The discovery drill: the one technique that makes the whole atlas usable. */}
      <Card className="border-border bg-surface-1">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <Badge tone="gold">Technique</Badge>
            <h2 className="mt-2.5 text-lg font-extrabold text-ink">
              How to find any letter's point of articulation
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              Put a sukoon on the letter and precede it with a hamzah carrying a fathah — أَ‍ــْ.
              Wherever the airflow stops or resonates is that letter's makhraj. It works for every
              letter, which is why it is worth learning before the list below.
            </p>
          </div>

          <div className="shrink-0 rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-soft)]">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-faint">Try it</p>
            <p className="arabic-text mt-1 text-3xl font-bold text-brand-700 dark:text-brand-300" dir="rtl" lang="ar">
              أَ{discoveryLetter}ْ
            </p>
            <div className="mt-3 flex items-center gap-2">
              <label className="sr-only" htmlFor="discovery-letter">
                Letter to test
              </label>
              <select
                id="discovery-letter"
                value={discoveryLetter}
                onChange={(e) => setDiscoveryLetter(e.target.value)}
                className="arabic-text rounded-lg border border-border bg-surface-1 px-2.5 py-1.5 text-base text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                {DISCOVERY_LETTERS.map((char) => (
                  <option key={char} value={char}>
                    {char}
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                disabled={speech === 'unsupported' || playing !== null}
                onClick={() => play(`أَ${discoveryLetter}ْ`)}
              >
                <Icon name="play" size={14} /> Hear the guide
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by region">
          {categories.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setCategory(c.key)}
              aria-pressed={category === c.key}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-colors ${
                category === c.key
                  ? 'bg-brand-600 text-white shadow-[var(--shadow-soft)]'
                  : 'border border-border bg-surface-1 text-ink-soft hover:bg-sand-100'
              }`}
            >
              {c.label}
              <span
                className={`rounded-full px-1.5 text-[10px] tabular-nums ${
                  category === c.key ? 'bg-brand-800 text-white' : 'bg-sand-200 text-ink-soft'
                }`}
              >
                {c.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <label className="sr-only" htmlFor="makhraj-search">
            Search points of articulation
          </label>
          <input
            id="makhraj-search"
            type="search"
            placeholder="Search a letter or region"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface-1 py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-ink-faint focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
          <span aria-hidden="true" className="absolute left-3 top-3 text-ink-faint">
            <Icon name="search" size={15} />
          </span>
        </div>
      </div>

      {results.length === 0 ? (
        <EmptyState
          icon={<Icon name="search" size={22} />}
          title="Nothing matches that"
          body="Try a single Arabic letter, or a region such as “tongue”."
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setQuery('');
                setCategory('All');
              }}
            >
              Show all points
            </Button>
          }
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* The list. Selecting an item changes the inspector beside it. */}
          <ul className="list-none space-y-3 lg:col-span-5">
            {results.map((m) => {
              const selected = m.id === activeId;
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => setActiveId(m.id)}
                    aria-pressed={selected}
                    className={`w-full rounded-2xl border p-4 text-left transition-colors ${
                      selected
                        ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500/20'
                        : 'border-border bg-surface-1 hover:border-brand-300 hover:bg-sand-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-brand-700">
                          {m.categoryTitle}
                        </p>
                        <p className="mt-1 text-sm font-bold text-ink">{m.nameEnglish}</p>
                        <p className="mt-0.5 line-clamp-1 text-xs text-ink-faint">{m.subRegion}</p>
                      </div>
                      <span
                        className="arabic-text shrink-0 text-lg text-ink-soft"
                        dir="rtl"
                        lang="ar"
                      >
                        {m.letters.join(' ، ')}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* The inspector. */}
          <div className="lg:col-span-7">
            <Card className="lg:sticky lg:top-24">
              <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <Badge tone="brand">{active.categoryTitle}</Badge>
                  <h2 className="mt-2 text-xl font-extrabold text-ink">{active.nameEnglish}</h2>
                  <p className="arabic-text mt-0.5 text-base text-brand-700" dir="rtl" lang="ar">
                    {active.nameArabic}
                  </p>
                  <p className="mt-1 text-xs text-ink-faint">{active.subRegion}</p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  className="shrink-0"
                  disabled={speech === 'unsupported' || playing !== null}
                  onClick={() => play(active.discoveryExample)}
                >
                  <Icon name="play" size={14} />
                  Hear the drill
                </Button>
              </div>

              <div className="mt-5">
                <p className="text-xs font-bold uppercase tracking-wider text-ink-faint">
                  Letters from this point ({active.letters.length}) — tap to hear the guide
                </p>
                <ul className="mt-2.5 flex list-none flex-wrap gap-3">
                  {active.letters.map((letter) => (
                    <li key={letter}>
                      <button
                        type="button"
                        disabled={speech === 'unsupported'}
                        onClick={() => play(letter)}
                        aria-label={`Hear the letter ${letter}`}
                        className={`arabic-text grid size-14 place-items-center rounded-2xl border text-2xl transition-colors ${
                          playing === letter
                            ? 'border-brand-500 bg-brand-50 text-brand-700'
                            : 'border-border bg-surface-2 text-ink hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700'
                        } disabled:cursor-not-allowed disabled:opacity-50`}
                      >
                        {letter}
                      </button>
                    </li>
                  ))}
                </ul>
                {active.lettersArabicName && (
                  <p className="arabic-text mt-2 text-xs text-ink-faint" dir="rtl" lang="ar">
                    {active.lettersArabicName}
                  </p>
                )}
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-ink-faint">
                    How it is produced
                  </h3>
                  <p className="mt-1.5 max-w-reading text-sm leading-relaxed text-ink-soft">
                    {active.description}
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-surface-2 p-4">
                  <h3 className="flex items-center gap-2 text-xs font-bold text-brand-800">
                    <Icon name="info" size={14} />
                    What to watch for
                  </h3>
                  <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-ink-soft">
                    {active.tips.map((tip) => (
                      <li key={tip} className="flex items-start gap-2">
                        <span
                          aria-hidden="true"
                          className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-500"
                        />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
                <p className="max-w-xs text-xs leading-relaxed text-ink-faint">
                  Reading this is not the same as producing it. Take these letters into a lesson and
                  record yourself saying them.
                </p>
                <Link to="/learn/qaida" className="shrink-0">
                  <Button size="sm" variant="secondary">
                    <Icon name="book" size={14} /> Open the Qa'idah
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
