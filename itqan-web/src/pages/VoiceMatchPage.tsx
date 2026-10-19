import { useRef, useState } from 'react';
import { matchVoice, updateAuthMe, type VoiceMatchResponse } from '@/lib/api';
import { RecordingSession } from '@/components/RecordingSession';
import { QariMatchCard } from '@/components/QariMatchCard';
import { Badge, Button, Card, InlineNotice, SectionHeader } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { useAuth } from '@/lib/authContext';
import { useServiceHealth } from '@/hooks/useServiceHealth';

/**
 * Universal list of all audio and container formats accepted by the system.
 * Including * / * ensures native OS file dialogs (Windows, macOS, iOS, Android)
 * don't filter out WhatsApp notes, voice memos, or files with unusual MIME types.
 */
const ALL_AUDIO_ACCEPT = [
  'audio/*',
  'video/*',
  '.mp3',
  '.wav',
  '.m4a',
  '.aac',
  '.ogg',
  '.oga',
  '.flac',
  '.webm',
  '.weba',
  '.opus',
  '.amr',
  '.awb',
  '.aiff',
  '.aif',
  '.aifc',
  '.wma',
  '.asf',
  '.mp4',
  '.m4v',
  '.mpeg',
  '.mpg',
  '.mov',
  '.mkv',
  '.avi',
  '.3gp',
  '.3g2',
  '.3ga',
  '.caf',
  '.alac',
  '.ape',
  '.wv',
  '.ac3',
  '.eac3',
  '.dts',
  '.mp2',
  '.mp1',
  '.m1a',
  '.m2a',
  '.au',
  '.snd',
  '.voc',
  '.ra',
  '*/*',
].join(',');

const FORMAT_CHIPS = ['MP3', 'M4A', 'WAV', 'AAC', 'MPEG', 'FLAC', 'OGG', 'OPUS', 'WEBM', 'AMR', 'CAF', '3GP', 'MP4'];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Voice match — a supporting experience, not a gate.
 *
 * It sets the reference Qari that lesson copy refers to. Users can either recite live
 * or upload any audio recording format from their computer or mobile device.
 */
export default function VoiceMatchPage() {
  const { token, refreshUser } = useAuth();
  const { state: serviceState, data: health, recheck } = useServiceHealth();

  const [inputMode, setInputMode] = useState<'record' | 'upload'>('record');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<VoiceMatchResponse | null>(null);
  const [selected, setSelected] = useState(0);
  const [saved, setSaved] = useState<'account' | 'device' | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
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
    setUploadedFile({ name: file.name, size: file.size });
    void runMatch(file, file.name);
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!busy) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (busy) return;
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setUploadedFile({ name: file.name, size: file.size });
    void runMatch(file, file.name);
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
          Recite live or upload any audio recording. The AI voice engine compares your vocal signature against
          {qariCount ? ` ${qariCount} reciters` : ' the reciters in the database'} to suggest your closest
          vocal matches.
        </p>
      </div>

      <Card
        className={`space-y-4 transition-colors ${
          isDragging ? 'border-brand-500 bg-brand-50/30 ring-2 ring-brand-500/30' : ''
        }`}
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle pb-3">
          <SectionHeader
            title="Share your voice"
            subtitle="Around 20–30 seconds of clear recitation gives the most stable comparison."
          />

          {/* Mode Switcher */}
          <div className="inline-flex items-center rounded-lg bg-surface-muted p-1 text-xs font-medium">
            <button
              type="button"
              onClick={() => setInputMode('record')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-all ${
                inputMode === 'record'
                  ? 'bg-surface shadow-xs text-ink font-semibold'
                  : 'text-ink-soft hover:text-ink'
              }`}
            >
              <Icon name="microphone" size={14} /> Record Live
            </button>
            <button
              type="button"
              onClick={() => setInputMode('upload')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-all ${
                inputMode === 'upload'
                  ? 'bg-surface shadow-xs text-ink font-semibold'
                  : 'text-ink-soft hover:text-ink'
              }`}
            >
              <Icon name="upload" size={14} /> Upload Audio File
            </button>
          </div>
        </div>

        {/* Live Recording Mode */}
        {inputMode === 'record' && (
          <div className="space-y-4">
            <RecordingSession
              onSubmit={runMatch}
              busy={busy}
              busyLabel="Comparing your voice"
              resetKey={data ? 'matched' : 'fresh'}
              serviceAvailable={serviceState !== 'unavailable'}
              onRetryService={recheck}
              guidance="Recite anything you know well, at your natural volume and pace."
            />

            <div className="flex items-center justify-center gap-3 pt-1">
              <span className="text-xs font-semibold text-ink-faint">or</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={busy}
              >
                <Icon name="upload" size={15} /> Upload an audio file from device
              </Button>
            </div>
          </div>
        )}

        {/* Upload Audio Mode */}
        {inputMode === 'upload' && (
          <div className="space-y-4">
            <div
              onClick={() => !busy && fileInputRef.current?.click()}
              className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all ${
                isDragging
                  ? 'border-brand-500 bg-brand-50/50'
                  : 'border-border hover:border-brand-400 hover:bg-surface-muted/50'
              } ${busy ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                <Icon name="upload" size={24} />
              </div>
              <p className="mt-3 text-sm font-semibold text-ink">
                {isDragging ? 'Drop your audio file here' : 'Choose an audio file or drag & drop'}
              </p>
              <p className="mt-1 text-xs text-ink-soft">
                All audio formats supported · MP3, M4A, WAV, AAC, FLAC, OGG, OPUS, AMR, CAF, 3GP, MP4
              </p>

              <div className="mt-4 flex justify-center">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  disabled={busy}
                >
                  <Icon name="search" size={14} /> Browse from device
                </Button>
              </div>
            </div>

            {/* Uploaded File Status */}
            {uploadedFile && (
              <div className="flex items-center justify-between rounded-lg bg-surface-muted px-3.5 py-2.5 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-brand-600">
                    <Icon name="voice" size={16} />
                  </span>
                  <span className="font-semibold text-ink truncate max-w-xs sm:max-w-md">
                    {uploadedFile.name}
                  </span>
                  <span className="text-ink-faint">({formatFileSize(uploadedFile.size)})</span>
                </div>
                {busy && (
                  <span className="inline-flex items-center gap-1.5 font-medium text-brand-700">
                    <span className="size-2 rounded-full bg-brand-600 animate-ping" />
                    Analysing...
                  </span>
                )}
              </div>
            )}

            {/* Supported Formats Chips */}
            <div className="space-y-1.5 pt-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
                Supported formats
              </p>
              <div className="flex flex-wrap gap-1.5">
                {FORMAT_CHIPS.map((fmt) => (
                  <span
                    key={fmt}
                    className="rounded-md bg-surface-muted px-2 py-0.5 text-[11px] font-medium text-ink-soft"
                  >
                    .{fmt.toLowerCase()}
                  </span>
                ))}
                <span className="rounded-md bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
                  + All media
                </span>
              </div>
            </div>
          </div>
        )}

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
              <Button
                variant="ghost"
                onClick={() => {
                  setData(null);
                  setUploadedFile(null);
                }}
              >
                <Icon name="restart" size={16} /> Try another recording
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

      {/* Hidden file input with universal audio format support */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ALL_AUDIO_ACCEPT}
        className="hidden"
        aria-label="Upload an audio file for voice matching"
        onChange={handleUpload}
      />
    </div>
  );
}

