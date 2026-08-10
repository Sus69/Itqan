import { useRef, useState } from 'react';
import { matchVoice, type VoiceMatchResponse } from '@/lib/api';
import { RecorderPanel } from '@/components/RecorderPanel';
import { QariMatchCard } from '@/components/QariMatchCard';
import { Badge, Button, Card, SectionHeader } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { cn } from '@/lib/cn';

type Phase = 'intro' | 'record' | 'result';

export default function VoiceMatchPage() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<VoiceMatchResponse | null>(null);
  const [selected, setSelected] = useState(0);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const runMatch = async (blob: Blob, fileName: string) => {
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const res = await matchVoice(blob, fileName);
      setData(res);
      setSelected(0);
      setPhase('result');
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Voice matching failed. Is the backend running?',
      );
    } finally {
      setBusy(false);
    }
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPhase('record');
    void runMatch(f, f.name);
    e.target.value = '';
  };

  const triggerUpload = () => fileInputRef.current?.click();

  const reset = () => {
    setData(null);
    setError(null);
    setSaved(false);
    setPhase('record');
  };

  return (
    <div className="anim-fade-up space-y-6">
      {/* Hero (VMT-001) */}
      <Card className="overflow-hidden">
        <div className="relative rounded-2xl bg-gradient-to-br from-gold-600 via-gold-500 to-brand-700 p-7 text-white sm:p-10">
          <div className="pointer-events-none absolute inset-0 opacity-25 [background:radial-gradient(circle_at_80%_20%,white,transparent_45%)]" />
          <div className="relative max-w-2xl">
            <Badge className="bg-white/15 text-white backdrop-blur">
              <Icon name="wave" size={13} /> Pillar 1 · Voice Matching
            </Badge>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
              Discover your reference Qari
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/85">
              Recite naturally for a few moments. Our WavLM voice engine compares your
              vocal signature against <strong className="font-bold">242 reciters</strong> to find
              the one whose voice naturally resembles yours — to guide your lifelong study.
            </p>
          </div>
        </div>
      </Card>

      {phase !== 'intro' && (
        <>
          {/* Recording + upload (VMT-002) */}
          <Card>
            <SectionHeader
              title="Share your voice"
              subtitle="Record a short recitation, or upload an audio clip"
            />
            <RecorderPanel
              onRecorded={(blob, name) => runMatch(blob, name)}
              busy={busy}
              busyLabel="Analyzing your voice…"
              hint="30–60 seconds of clear recitation works best"
            />
            <div className="mt-4 flex items-center justify-center gap-3">
              <span className="text-xs font-semibold text-ink-faint">or</span>
              <Button variant="ghost" onClick={triggerUpload} disabled={busy}>
                <Icon name="upload" size={17} />
                Upload audio file
              </Button>
            </div>
            {error && (
              <p className="mt-4 flex items-start gap-2 rounded-xl bg-error-soft px-4 py-3 text-sm font-medium text-error">
                <Icon name="alert" size={16} className="mt-0.5 shrink-0" />
                {error}
              </p>
            )}
          </Card>

          {/* Analyzing state (VMT-003 / LOD-001) */}
          {busy && (
            <Card className="flex flex-col items-center gap-3 py-10 text-center">
              <div className="grid size-16 place-items-center rounded-full bg-brand-50">
                <span className="anim-spin inline-block size-8 rounded-full border-[3px] border-brand-600 border-t-transparent" />
              </div>
              <div>
                <p className="text-base font-bold text-ink">Comparing against 242 Qaris…</p>
                <p className="mt-1 text-sm text-ink-faint">
                  Extracting your vocal embedding and running cosine similarity.
                </p>
              </div>
            </Card>
          )}

          {/* Results (VMT-004) */}
          {phase === 'result' && data && !busy && (
            <div className="anim-fade-up space-y-5">
              <SectionHeader
                title="Your top matches"
                subtitle={`${data.duration_seconds?.toFixed?.(1) ?? '-'}s analyzed · tap the Qari that feels most natural`}
              />
              <div className="grid gap-3 sm:grid-cols-1 lg:grid-cols-3">
                {data.matches.map((m, i) => (
                  <QariMatchCard
                    key={m.qari + i}
                    match={m}
                    rank={i}
                    selected={selected === i}
                    onSelect={() => setSelected(i)}
                  />
                ))}
              </div>

              <Card className="flex flex-col items-center justify-between gap-4 bg-gradient-to-r from-brand-50 to-gold-50 sm:flex-row">
                <div className="flex items-center gap-3">
                  <div className="grid size-11 place-items-center rounded-xl bg-white text-brand-700 shadow-[var(--shadow-soft)]">
                    <Icon name="note" size={20} />
                  </div>
                  <p className="text-sm font-semibold text-ink">
                    Set <strong>{data.matches[selected]?.qari}</strong> as your reference Qari?
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="ghost" onClick={reset}>
                    <Icon name="restart" size={16} />
                    Try again
                  </Button>
                  <Button
                    variant={saved ? 'secondary' : 'primary'}
                    onClick={() => setSaved(true)}
                    disabled={saved}
                  >
                    {saved ? (
                      <>
                        <Icon name="check" size={16} />
                        Saved to profile
                      </>
                    ) : (
                      <>
                        <Icon name="sparkle" size={16} />
                        Save as reference
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </>
      )}

      {/* Intro CTA */}
      {phase === 'intro' && (
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <p className="max-w-md text-sm leading-relaxed text-ink-soft">
            This is the first step of your Itqān journey. Your reference Qari becomes the model
            whose recitations will guide your Tajweed learning.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button size="lg" onClick={() => setPhase('record')} className={cn('anim-pop')}>
              <Icon name="mic" size={18} />
              Begin voice match
            </Button>
            <Button size="lg" variant="ghost" onClick={triggerUpload}>
              <Icon name="upload" size={18} />
              Upload instead
            </Button>
          </div>
        </div>
      )}

      {/* Single hidden upload input shared by both call-to-actions */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,.mp3,.m4a,.aac,.ogg,.flac,.webm,.wav,.opus,.amr,.aiff,.wma"
        className="hidden"
        onChange={handleUpload}
      />
    </div>
  );
}
