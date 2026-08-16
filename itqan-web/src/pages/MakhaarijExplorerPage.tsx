import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Card, Badge, Button } from '@/components/ui';
import { Icon, type IconName } from '@/components/Icon';
import { MAKHAARIJ_DATA } from '@/lib/qaidaData';
import { speakArabic } from '@/lib/qaidaAudio';

type CategoryFilter = 'All' | 'Halqee' | 'Lisaani' | 'Shafawi' | 'Jawfee' | 'Khaysoom';

export default function MakhaarijExplorerPage() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('All');
  const [activeMakhrajId, setActiveMakhrajId] = useState<string>(MAKHAARIJ_DATA[0].id);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Discovery simulator state
  const [discoveryLetter, setDiscoveryLetter] = useState('ب');

  const filteredMakharij = MAKHAARIJ_DATA.filter((m) => {
    const matchesCategory = selectedCategory === 'All' || m.category === selectedCategory;
    const matchesSearch =
      m.nameEnglish.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.nameArabic.includes(searchQuery) ||
      m.letters.some((l) => l.includes(searchQuery)) ||
      m.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const activeMakhraj =
    MAKHAARIJ_DATA.find((m) => m.id === activeMakhrajId) || MAKHAARIJ_DATA[0];

  const handlePlayLetter = async (text: string) => {
    try {
      setIsPlayingAudio(true);
      await speakArabic(text, 0.8);
    } finally {
      setIsPlayingAudio(false);
    }
  };

  const categories: { key: CategoryFilter; label: string; count: number; icon: IconName }[] = [
    { key: 'All', label: 'All 17 Points', count: MAKHAARIJ_DATA.length, icon: 'book' },
    { key: 'Halqee', label: 'Throat (الحلق)', count: 3, icon: 'voice' },
    { key: 'Lisaani', label: 'Tongue (اللسان)', count: 10, icon: 'practice' },
    { key: 'Shafawi', label: 'Lips (الشفتان)', count: 2, icon: 'sparkle' },
    { key: 'Jawfee', label: 'Oral Cavity (الجوف)', count: 1, icon: 'play' },
    { key: 'Khaysoom', label: 'Nasal (الخيشوم)', count: 1, icon: 'check' },
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* Navigation Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to="/qaida"
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700"
          >
            <Icon name="arrow-left" size={14} />
            Back to Qa'idah Roadmap
          </Link>
          <PageHeader
            title="Interactive Makhaarij Articulation Atlas"
            subtitle="Explore the 17 authentic anatomical points of exit (مخارج الحروف) across the vocal tract."
          />
        </div>
        <Link to="/qaida/lesson/1">
          <Button variant="primary">
            <Icon name="play" size={16} />
            Start Lesson 1 (Mufridat)
          </Button>
        </Link>
      </div>

      {/* Discovery Algorithm Hero Card */}
      <Card className="relative overflow-hidden border-brand-200 bg-gradient-to-br from-brand-50/70 via-sand-50/50 to-gold-50/40 p-6 sm:p-7">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2">
              <Badge tone="gold">Universal Phonetic Tool</Badge>
              <span className="text-xs font-bold uppercase tracking-wider text-ink-faint">
                Makhraj Discovery Algorithm
              </span>
            </div>
            <h3 className="text-xl font-black text-ink">
              How to find any letter's exact origin point:
            </h3>
            <p className="text-sm leading-relaxed text-ink-soft">
              Place a <strong>Sukoon (ْ)</strong> on any Arabic letter and precede it with a{' '}
              <strong>Hamzah carrying a Fathah (أَ)</strong>. Wherever the airflow halts or resonates in your mouth/throat is that letter's exact Makhraj.
            </p>
          </div>

          {/* Interactive simulator widget */}
          <div className="flex flex-col items-center rounded-2xl border border-brand-200/80 bg-white/80 p-4 shadow-sm backdrop-blur-sm sm:flex-row sm:gap-4">
            <div className="text-center sm:text-right">
              <p className="text-xs font-bold text-ink-faint">Discovery Drill</p>
              <p className="font-arabic text-3xl font-bold text-brand-700">
                أَ{discoveryLetter}ْ
              </p>
            </div>
            <div className="mt-3 flex items-center gap-2 sm:mt-0">
              <select
                aria-label="Select letter to discover"
                value={discoveryLetter}
                onChange={(e) => setDiscoveryLetter(e.target.value)}
                className="rounded-lg border border-sand-300 bg-white px-2.5 py-1.5 font-arabic text-base font-bold text-ink shadow-xs focus:border-brand-500 focus:outline-none"
              >
                {['ب', 'ق', 'ك', 'ع', 'ح', 'غ', 'خ', 'ط', 'د', 'ت', 'ص', 'س', 'ز', 'ف', 'م', 'ن', 'ل', 'ر', 'ض'].map(
                  (char) => (
                    <option key={char} value={char}>
                      {char}
                    </option>
                  )
                )}
              </select>
              <Button
                size="sm"
                variant="primary"
                onClick={() => handlePlayLetter(`أَ${discoveryLetter}ْ`)}
                disabled={isPlayingAudio}
              >
                <Icon name="play" size={14} />
                Listen
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Category Pills & Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                selectedCategory === cat.key
                  ? 'bg-brand-600 text-white shadow-sm ring-2 ring-brand-500/20'
                  : 'border border-border bg-surface-1 text-ink-soft hover:bg-sand-100'
              }`}
            >
              <Icon name={cat.icon} size={14} />
              <span>{cat.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                  selectedCategory === cat.key ? 'bg-brand-700 text-white' : 'bg-sand-200 text-ink-soft'
                }`}
              >
                {cat.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search letters, regions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface-1 py-2 pr-4 pl-9 text-xs text-ink placeholder:text-ink-faint focus:border-brand-500 focus:outline-none"
          />
          <span className="absolute top-2.5 left-3 text-ink-faint">
            <Icon name="search" size={14} />
          </span>
        </div>
      </div>

      {/* Main Grid: Left List + Right Active Inspector */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Makhraj Card Cards */}
        <div className="space-y-3 lg:col-span-5">
          {filteredMakharij.map((m) => {
            const isSelected = m.id === activeMakhrajId;
            return (
              <div
                key={m.id}
                onClick={() => setActiveMakhrajId(m.id)}
                className={`group cursor-pointer rounded-2xl border p-4 transition-all duration-150 ${
                  isSelected
                    ? 'border-brand-500 bg-brand-50/40 shadow-sm ring-1 ring-brand-500/20'
                    : 'border-border bg-surface-1 hover:border-brand-300 hover:bg-sand-50/60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
                        {m.categoryTitle}
                      </span>
                      {m.acousticTag && (
                        <span className="rounded-md bg-sand-100 px-1.5 py-0.5 text-[10px] font-semibold text-ink-faint">
                          {m.acousticTag}
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-ink">{m.nameEnglish}</h4>
                    <p className="line-clamp-1 text-xs text-ink-faint">{m.subRegion}</p>
                  </div>

                  <div className="flex flex-col items-end">
                    <span className="font-arabic text-lg font-bold text-ink-soft">
                      {m.letters.join(' ، ')}
                    </span>
                    {m.lettersArabicName && (
                      <span className="font-arabic text-[11px] text-brand-700">
                        {m.lettersArabicName}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Deep Makhraj Anatomical Inspector */}
        <div className="lg:col-span-7">
          <div className="sticky top-20">
            <Card className="border-brand-200/80 bg-white p-6 shadow-md sm:p-7">
              {/* Card Header */}
              <div className="flex flex-col gap-4 border-b border-sand-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge tone="brand">{activeMakhraj.categoryTitle}</Badge>
                    <span className="text-xs font-bold text-ink-faint">
                      {activeMakhraj.subRegion}
                    </span>
                  </div>
                  <h3 className="mt-1 text-xl font-black text-ink">
                    {activeMakhraj.nameEnglish}
                  </h3>
                  <p className="font-arabic text-base font-bold text-brand-700">
                    {activeMakhraj.nameArabic}
                  </p>
                </div>

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handlePlayLetter(activeMakhraj.discoveryExample)}
                  disabled={isPlayingAudio}
                >
                  <Icon name="play" size={14} />
                  Listen Test ({activeMakhraj.discoveryExample})
                </Button>
              </div>

              {/* Letters Spotlight Grid */}
              <div className="mt-5">
                <p className="text-xs font-bold uppercase tracking-wider text-ink-faint">
                  Associated Letters ({activeMakhraj.letters.length})
                </p>
                <div className="mt-2 flex flex-wrap gap-3">
                  {activeMakhraj.letters.map((letter) => (
                    <button
                      key={letter}
                      onClick={() => handlePlayLetter(letter)}
                      className="group flex size-14 items-center justify-center rounded-2xl border border-sand-200 bg-sand-50/60 font-arabic text-2xl font-bold text-ink transition-all hover:scale-105 hover:border-brand-500 hover:bg-brand-50 hover:text-brand-700"
                    >
                      {letter}
                    </button>
                  ))}
                </div>
              </div>

              {/* Articulation Mechanics */}
              <div className="mt-6 space-y-4">
                <div>
                  <h5 className="text-xs font-bold uppercase tracking-wider text-ink-faint">
                    Biomechanical Description
                  </h5>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                    {activeMakhraj.description}
                  </p>
                </div>

                <div className="rounded-xl border border-sand-200 bg-sand-50/50 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-brand-800">
                    <Icon name="sparkle" size={14} />
                    <span>Pronunciation Guidelines & Mastery Tips</span>
                  </div>
                  <ul className="mt-2 space-y-1.5 text-xs text-ink-soft">
                    {activeMakhraj.tips.map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="mt-1 size-1.5 rounded-full bg-brand-500" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Call to action */}
              <div className="mt-7 flex items-center justify-between border-t border-sand-100 pt-5">
                <span className="text-xs text-ink-faint">
                  Practice these letters in Qa'idah Lesson 1
                </span>
                <Link to="/qaida/lesson/1">
                  <Button size="sm" variant="gold">
                    <Icon name="practice" size={14} />
                    Practice in Studio
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
