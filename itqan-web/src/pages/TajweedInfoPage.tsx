import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Badge, Button, Card } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { cn } from '@/lib/cn';
import {
  TAJWEED_INFO_CHAPTERS,
  type TajweedChapter,
  type TajweedSubChapter,
  type QuranExtract,
} from '@/lib/infoData';

type CategoryFilter = 'all' | 'foundations' | 'makhraj' | 'rules_noon_meem' | 'rules_letters' | 'madd' | 'waqf_sajdah';

const CATEGORIES: { id: CategoryFilter; label: string; icon: string }[] = [
  { id: 'all', label: 'All Chapters (19)', icon: 'book' },
  { id: 'foundations', label: 'Foundations & Etiquette', icon: 'sparkle' },
  { id: 'makhraj', label: 'Makhaarij (Articulation)', icon: 'practice' },
  { id: 'rules_noon_meem', label: 'Noon & Meem Rules', icon: 'note' },
  { id: 'rules_letters', label: 'Letter & Assimilation Rules', icon: 'practice' },
  { id: 'madd', label: 'Madd (Elongation)', icon: 'progress' },
  { id: 'waqf_sajdah', label: 'Waqf & Sajdah Verses', icon: 'home' },
];

export default function TajweedInfoPage() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);

  const filteredChapters = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return TAJWEED_INFO_CHAPTERS.filter((chap) => {
      const matchCat = selectedCategory === 'all' || chap.category === selectedCategory;
      if (!matchCat) return false;

      if (!q) return true;

      // Deep search in chapter title, arabic, summary, subchapters, and extracts
      const inTitle = chap.title.toLowerCase().includes(q) || chap.arabicTitle.includes(q);
      const inSummary = chap.summary.toLowerCase().includes(q);
      const inSub = chap.subChapters.some(
        (sub) =>
          sub.title.toLowerCase().includes(q) ||
          (sub.arabicTitle && sub.arabicTitle.includes(q)) ||
          (sub.description && sub.description.toLowerCase().includes(q)) ||
          (sub.mnemonic && sub.mnemonic.toLowerCase().includes(q)) ||
          (sub.examples &&
            sub.examples.some(
              (ex) =>
                ex.text.includes(q) ||
                (ex.ruleTarget && ex.ruleTarget.toLowerCase().includes(q)) ||
                String(ex.surah).includes(q),
            )),
      );

      return inTitle || inSummary || inSub;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Tajweed Reference Guide (INFO.md)"
        subtitle="The complete, authentic 19-chapter Tajweed rulebook — losslessly detailed with 100+ Quranic practice extracts."
      />

      {/* Controls Bar: Search & Category Tabs */}
      <div className="space-y-4">
        <div className="relative">
          <Icon name="search" size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            type="text"
            placeholder="Search rules, letters, Arabic text, or Surah numbers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-border bg-surface pl-10 pr-4 py-3 text-sm text-ink placeholder:text-ink-faint transition-all focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-ink-faint hover:text-ink"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all',
                  active
                    ? 'bg-brand-600 text-white shadow-[var(--shadow-soft)]'
                    : 'border border-border bg-surface text-ink-soft hover:border-brand-300 hover:text-ink',
                )}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Sidebar Table of Contents + Content */}
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Sticky Chapter Index Sidebar */}
        <Card className="h-fit hidden lg:block lg:sticky lg:top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
          <p className="text-xs font-extrabold uppercase tracking-widest text-ink-faint mb-3">
            Table of Contents ({filteredChapters.length})
          </p>
          <nav className="space-y-1">
            {filteredChapters.map((chap) => (
              <a
                key={chap.id}
                href={`#${chap.id}`}
                onClick={() => setActiveChapterId(chap.id)}
                className={cn(
                  'group flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold transition-all',
                  activeChapterId === chap.id
                    ? 'bg-brand-50 text-brand-700 font-bold'
                    : 'text-ink-soft hover:bg-sand-100 hover:text-ink',
                )}
              >
                <span className="truncate">
                  {chap.chapterNumber}. {chap.title}
                </span>
                <span className="arabic-text text-xs text-ink-faint group-hover:text-brand-600 shrink-0 ml-2" dir="rtl">
                  {chap.arabicTitle}
                </span>
              </a>
            ))}
          </nav>
        </Card>

        {/* Chapters Content List */}
        <div className="space-y-8">
          {filteredChapters.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-sand-100 text-sand-500">
                <Icon name="search" size={24} />
              </div>
              <h3 className="mt-4 text-base font-bold text-ink">No matching Tajweed rules found</h3>
              <p className="mt-1 text-sm text-ink-faint">
                Try searching for a different keyword like &quot;Qalqala&quot;, &quot;Ghunnah&quot;, &quot;Madd&quot;, or clearing filters.
              </p>
              <Button variant="secondary" className="mt-4" onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}>
                Reset Filters
              </Button>
            </Card>
          ) : (
            filteredChapters.map((chap) => (
              <ChapterCard key={chap.id} chapter={chap} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function ChapterCard({ chapter }: { chapter: TajweedChapter }) {
  return (
    <Card id={chapter.id} className="scroll-mt-24 space-y-6 overflow-hidden border-border p-6 sm:p-8">
      {/* Chapter Title Banner */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-lg bg-brand-600 text-xs font-black text-white">
              {chapter.chapterNumber}
            </span>
            <Badge tone="brand">Chapter {chapter.chapterNumber}</Badge>
          </div>
          <h2 className="mt-2 text-xl font-extrabold text-ink sm:text-2xl">
            {chapter.title}
          </h2>
          <p className="mt-1 text-sm text-ink-faint leading-relaxed">
            {chapter.summary}
          </p>
        </div>
        <p className="arabic-text text-2xl font-bold text-brand-800" dir="rtl">
          {chapter.arabicTitle}
        </p>
      </div>

      {/* SubChapters */}
      <div className="space-y-8">
        {chapter.subChapters.map((sub) => (
          <SubChapterSection key={sub.id} sub={sub} />
        ))}
      </div>
    </Card>
  );
}

function SubChapterSection({ sub }: { sub: TajweedSubChapter }) {
  return (
    <div className="space-y-4 rounded-2xl bg-surface-2/60 p-5 sm:p-6 border border-border/80">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-bold text-ink sm:text-lg">
          {sub.title}
        </h3>
        {sub.arabicTitle && (
          <span className="arabic-text text-lg font-semibold text-brand-700" dir="rtl">
            {sub.arabicTitle}
          </span>
        )}
      </div>

      {sub.description && (
        <p className="text-sm leading-relaxed text-ink-soft">
          {sub.description}
        </p>
      )}

      {/* Mnemonic or Duration Callouts */}
      <div className="flex flex-wrap gap-2">
        {sub.mnemonic && (
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-gold-50 border border-gold-200 px-3.5 py-1.5 text-xs font-bold text-gold-900">
            <Icon name="sparkle" size={13} className="text-gold-600" />
            {sub.mnemonic}
          </span>
        )}
        {sub.duration && (
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-brand-50 border border-brand-200 px-3.5 py-1.5 text-xs font-bold text-brand-800">
            <Icon name="practice" size={13} className="text-brand-600" />
            Duration: {sub.duration}
          </span>
        )}
      </div>

      {/* Extra Notes / Bullet points */}
      {sub.extraNotes && sub.extraNotes.length > 0 && (
        <ul className="space-y-2 rounded-xl bg-surface p-4 border border-border text-xs leading-relaxed text-ink-soft">
          {sub.extraNotes.map((note, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="mt-1 size-1.5 rounded-full bg-brand-600 shrink-0" />
              <span>{note}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Urdu Note Callout */}
      {sub.urduNote && (
        <div className="rounded-xl border border-sand-300 bg-sand-50 p-4 text-right" dir="rtl">
          <span className="text-[11px] font-bold uppercase tracking-wider text-sand-600 block mb-1">
            Urdu Explanation (اردو وضاحت)
          </span>
          <p className="arabic-text text-sm font-semibold text-ink">
            {sub.urduNote}
          </p>
        </div>
      )}

      {/* Makhaarij Table */}
      {sub.makhaarijRows && sub.makhaarijRows.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-surface-2 text-ink-faint font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Group</th>
                <th className="px-4 py-3">Letters</th>
                <th className="px-4 py-3">Place of Origin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sub.makhaarijRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-sand-50/50">
                  <td className="px-4 py-3 font-bold text-ink">{row.group}</td>
                  <td className="arabic-text px-4 py-3 text-base font-bold text-brand-700" dir="rtl">
                    {row.letters}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{row.origin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Rule Letters Badges */}
      {sub.ruleLetters && sub.ruleLetters.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-xs font-bold text-ink-faint mr-2">Rule Letters:</span>
          {sub.ruleLetters.map((ltr) => (
            <span
              key={ltr}
              className="arabic-text inline-grid size-8 place-items-center rounded-xl bg-brand-100 text-base font-extrabold text-brand-800 border border-brand-200"
              dir="rtl"
            >
              {ltr}
            </span>
          ))}
        </div>
      )}

      {/* Quranic Practice Extracts Grid */}
      {sub.examples && sub.examples.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-faint">
              Quranic Practice Extracts ({sub.examples.length})
            </span>
            <span className="text-[11px] text-brand-700 font-semibold">
              Click any extract to practice in Studio
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {sub.examples.map((ex) => (
              <QuranExtractCard key={ex.id} extract={ex} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function QuranExtractCard({ extract }: { extract: QuranExtract }) {
  return (
    <div className="group flex flex-col justify-between rounded-xl border border-border bg-surface p-4 transition-all hover:-translate-y-0.5 hover:border-brand-400 hover:shadow-[var(--shadow-lift)]">
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-bold text-ink">
            {typeof extract.surah === 'number' ? `Surah ${extract.surah}` : extract.surah}
            {extract.ayah !== undefined && ` · Ayah ${extract.ayah}`}
            {extract.page !== undefined && ` (Page ${extract.page})`}
          </span>
          {extract.ruleTarget && (
            <Badge tone="brand" className="text-[10px]">
              {extract.ruleTarget}
            </Badge>
          )}
        </div>

        {/* Additional attached / preceded metadata */}
        {extract.attachedText && (
          <p className="text-xs text-ink-faint mb-1">
            Attached: <span className="arabic-text font-bold text-brand-700" dir="rtl">{extract.attachedText}</span>
          </p>
        )}
        {extract.precededText && (
          <p className="text-xs text-ink-faint mb-2">
            Preceded: <span className="arabic-text font-bold text-brand-700" dir="rtl">{extract.precededText}</span>
          </p>
        )}

        <p className="quran-text my-2 text-right text-lg leading-relaxed text-ink" dir="rtl" lang="ar">
          {extract.text}
        </p>
      </div>

      <div className="mt-3 flex items-center justify-end border-t border-border/50 pt-2.5">
        <Link
          to={`/practice/tajweed?extractText=${encodeURIComponent(extract.text)}`}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700 transition-colors group-hover:bg-brand-600 group-hover:text-white"
        >
          <Icon name="practice" size={14} />
          Practice in Studio 🎙️
        </Link>
      </div>
    </div>
  );
}
