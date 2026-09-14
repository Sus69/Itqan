import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/Icon';
import { useFocusTrap } from '@/hooks/useFocusTrap';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  isDark,
  onToggleTheme,
  isSidebarCollapsed,
  onToggleSidebar,
}: SettingsModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  useFocusTrap(isOpen, modalRef);

  const [quranFontSize, setQuranFontSize] = useState<'normal' | 'large' | 'xlarge'>(() => {
    return (localStorage.getItem('itqan_quran_scale') as 'normal' | 'large' | 'xlarge') || 'normal';
  });

  const [playbackSpeed, setPlaybackSpeed] = useState<string>(() => {
    return localStorage.getItem('itqan_pref_speed') || '1.0';
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleFontChange = (size: 'normal' | 'large' | 'xlarge') => {
    setQuranFontSize(size);
    localStorage.setItem('itqan_quran_scale', size);
    document.documentElement.setAttribute('data-quran-scale', size);
  };

  const handleSpeedChange = (spd: string) => {
    setPlaybackSpeed(spd);
    localStorage.setItem('itqan_pref_speed', spd);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div
        ref={modalRef}
        className="relative w-full max-w-lg rounded-3xl border border-border bg-surface p-6 shadow-[var(--shadow-lift)] transition-all sm:p-7"
      >
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-2xl bg-brand-50 text-brand-700">
              <Icon name="settings" size={20} />
            </span>
            <div>
              <h2 id="settings-modal-title" className="text-lg font-bold text-ink">
                Preferences & Settings
              </h2>
              <p className="text-xs text-ink-faint">Customize your learning and reading experience</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="grid size-9 place-items-center rounded-xl text-ink-faint transition-colors hover:bg-sand-100 hover:text-ink"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className="mt-5 space-y-6">
          {/* Appearance & Theme */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-faint">
              Appearance
            </label>
            <div className="mt-2.5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={onToggleTheme}
                className={`flex items-center justify-between rounded-2xl border p-3.5 text-left transition-all ${
                  !isDark
                    ? 'border-brand-500 bg-brand-50/70 text-brand-900 ring-1 ring-brand-500/20'
                    : 'border-border bg-surface-1 text-ink hover:bg-sand-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon name="sun" size={18} />
                  <span className="text-xs font-bold">Light Mode</span>
                </div>
                {!isDark && <Icon name="check" size={16} className="text-brand-600" />}
              </button>

              <button
                type="button"
                onClick={onToggleTheme}
                className={`flex items-center justify-between rounded-2xl border p-3.5 text-left transition-all ${
                  isDark
                    ? 'border-brand-500 bg-brand-50/70 text-brand-900 ring-1 ring-brand-500/20'
                    : 'border-border bg-surface-1 text-ink hover:bg-sand-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon name="moon" size={18} />
                  <span className="text-xs font-bold">Dark Mode</span>
                </div>
                {isDark && <Icon name="check" size={16} className="text-brand-600" />}
              </button>
            </div>
          </div>

          {/* Sidebar Layout Mode */}
          <div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-ink">Compact Sidebar Layout</span>
                <p className="text-[11px] text-ink-faint">Keep the sidebar in minimalist icon-only mode</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isSidebarCollapsed}
                onClick={onToggleSidebar}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none ${
                  isSidebarCollapsed ? 'bg-brand-600' : 'bg-sand-300'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    isSidebarCollapsed ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Reference Reciter Playback Speed */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-faint">
              Default Recitation Speed
            </label>
            <div className="mt-2 flex gap-2">
              {['0.75', '1.0', '1.25'].map((spd) => (
                <button
                  key={spd}
                  type="button"
                  onClick={() => handleSpeedChange(spd)}
                  className={`flex-1 rounded-xl border py-2 text-xs font-bold transition-all ${
                    playbackSpeed === spd
                      ? 'border-brand-500 bg-brand-50 text-brand-800 ring-1 ring-brand-500/20'
                      : 'border-border bg-surface-1 text-ink-soft hover:bg-sand-100 hover:text-ink'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>

          {/* Quranic Text Size */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-faint">
              Arabic Text Scale
            </label>
            <div className="mt-2 flex gap-2">
              {(
                [
                  { id: 'normal', label: 'Standard' },
                  { id: 'large', label: 'Large (+15%)' },
                  { id: 'xlarge', label: 'Extra Large (+30%)' },
                ] as const
              ).map((scale) => (
                <button
                  key={scale.id}
                  type="button"
                  onClick={() => handleFontChange(scale.id)}
                  className={`flex-1 rounded-xl border py-2 text-xs font-bold transition-all ${
                    quranFontSize === scale.id
                      ? 'border-brand-500 bg-brand-50 text-brand-800 ring-1 ring-brand-500/20'
                      : 'border-border bg-surface-1 text-ink-soft hover:bg-sand-100 hover:text-ink'
                  }`}
                >
                  {scale.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-7 flex justify-end border-t border-border pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-brand-600 px-5 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-brand-700"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
