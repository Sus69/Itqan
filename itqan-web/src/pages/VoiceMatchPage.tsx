import { useRef, useState } from 'react';
import { matchVoice, updateAuthMe, type VoiceMatchResponse } from '@/lib/api';
import { RecordingSession } from '@/components/RecordingSession';
import { QariMatchCard } from '@/components/QariMatchCard';
import { Badge, Button, Card, InlineNotice, SectionHeader } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { useAuth } from '@/lib/authContext';
import { useServiceHealth } from '@/hooks/useServiceHealth';

/**
 * Voice match — a supporting experience, not a gate.
 *
 * It sets the reference Qari that lesson copy refers to. Nothing else in the app
 * depends on it, so it lives under the profile and says plainly what it does and
 * does not affect. The reciter count comes from the running service rather than
 * being written into the copy.
 */
export default function VoiceMatchPage() {
  const { token, refreshUser } = useAuth();
  const { state: serviceState, data: health, recheck } = useServiceHealth();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<VoiceMatchResponse | null>(null);
  const [selected, setSelected] = useState(0);
  const [saved, setSaved] = useState<'account' | 'device' | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const qariCount = health?.qari_count;

  const runMatch = async (blob: Blob, fileName: string) => {
    setBusy(true);
    setError(null);
    setSaved(null);
    try {
      const res = await matchVoice(blob, fileName);
      setData(res);
      setSelected(0);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'The voice engine could not be reached, so nothing was compared.',
      );
    } finally {
      setBusy(false);
    }
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    void runMatch(file, file.name);
    e.target.value = '';
  };

  const saveReference = async () => {
    const qari = data?.matches[selected]?.qari;
    if (!qari) return;
    if (!token || token.startsWith('demo_token_')) {
      localStorage.setItem('itqan_guest_reference_qari', qari);
      setSaved('device');
      return;
    }
    try {
      await updateAuthMe(token, { reference_qari_name: qari });
      await refreshUser();
      setSaved('account');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'That reference Qari could not be saved to your account.',
      );
    }
  };

  return (
    <div className="anim-fade-up mx-auto max-w-focus space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-700">
          Profile · Voice match
        </p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
          Choose your reference Qari
        </h1>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-ink-soft">
          Recite for a few moments and the voice engine compares your vocal signature against
          {qariCount ? ` ${qariCount} reciters` : ' the reciters it has loaded'} to suggest the closest
          few. This is a preference, not an assessment — it changes which reciter the app names as
          your model, and nothing about your lessons or scores.
        </p>
      </div>

      <Card className="space-y-4">
        <SectionHeader
          title="Share your voice"
          subtitle="Around 30 seconds of clear recitation gives the most stable comparison."
        />

        <RecordingSession
          onSubmit={runMatch}
          busy={busy}
          busyLabel="Comparing your voice"
          resetKey={data ? 'matched' : 'fresh'}
          serviceAvailable={serviceState !== 'unavailable'}
          onRetryService={recheck}
          guidance="Recite anything you know well, at your natural volume and pace."
        />

        <div className="flex items-center justify-center gap-3">
          <span className="text-xs font-semibold text-ink-faint">or</span>
          <Button variant="ghost" onClick={() => fileInputRef.current?.click()} disabled={busy}>
            <Icon name="upload" size={17} /> Upload an audio file
          </Button>
        </div>

        {error && (
          <InlineNotice
            tone="error"
            title="Voice match did not complete"
            action={
              <Button variant="secondary" size="sm" onClick={recheck}>
                <Icon name="restart" size={14} /> Check the service
              </Button>
            }
          >
            {error}
          </InlineNotice>
        )}
      </Card>

      {data && !busy && (
        <div className="anim-fade-up space-y-4">
          <SectionHeader
            title="Closest matches"
            subtitle={`${data.duration_seconds.toFixed(1)}s of audio analysed · choose the voice that feels most natural to follow`}
          />

          <div className="grid gap-3 lg:grid-cols-3">
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

          <Card className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
                <Icon name="note" size={20} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">
                  Set {data.matches[selected]?.qari} as your reference Qari
                </p>
                <p className="mt-0.5 text-xs text-ink-faint">
                  {token && !token.startsWith('demo_token_')
                    ? 'Saved to your account, so it follows you across devices.'
                    : 'Saved in this browser only — sign in to keep it on your account.'}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="ghost" onClick={() => setData(null)}>
                <Icon name="restart" size={16} /> Record another take
              </Button>
              <Button
                variant={saved ? 'secondary' : 'primary'}
                onClick={() => void saveReference()}
                disabled={saved !== null}
              >
                <Icon name={saved ? 'check' : 'sparkle'} size={16} />
                {saved === 'account'
                  ? 'Saved to your account'
                  : saved === 'device'
                    ? 'Saved in this browser'
                    : 'Save as reference'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {!data && (
        <Card className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-ink">Prefer to skip this?</h2>
            <p className="mt-1 max-w-prose text-xs leading-relaxed text-ink-faint">
              Nothing in Itqān requires a reference Qari. You can pick one later from your profile, or
              never — the courses and feedback work exactly the same either way.
            </p>
          </div>
          <Badge tone="neutral" className="shrink-0">
            Optional
          </Badge>
        </Card>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,.mp3,.m4a,.aac,.ogg,.flac,.webm,.wav,.opus,.amr,.aiff,.wma"
        className="hidden"
        aria-label="Upload an audio file for voice matching"
        onChange={handleUpload}
      />
    </div>
  );
}
