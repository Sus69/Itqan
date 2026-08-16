import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Badge, Button, Card } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { useAuth, DEMO_ACCOUNTS } from '@/lib/authContext';
import { updateAuthMe } from '@/lib/api';

export default function ProfilePage() {
  const { user, token, logout, openAuthModal, refreshUser } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [referenceQari, setReferenceQari] = useState(user?.reference_qari_name ?? 'Mahmoud Khalil Al-Hussary');
  const [targetMinutes, setTargetMinutes] = useState(user?.target_daily_minutes ?? 15);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsSaving(true);
    try {
      await updateAuthMe(token, {
        full_name: fullName,
        reference_qari_name: referenceQari,
        target_daily_minutes: Number(targetMinutes),
      });
      await refreshUser();
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Profile"
        subtitle="Manage your identity, reference Qari, learning goals, and account credentials."
      />

      {saveSuccess && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 animate-fade-in flex items-center justify-between">
          <span>✓ Profile settings updated successfully!</span>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Identity card */}
        <Card className="flex flex-col items-center py-8 text-center justify-between">
          <div className="flex flex-col items-center">
            <div className="grid size-20 place-items-center rounded-full bg-gradient-to-br from-brand-600 to-brand-800 text-3xl font-black text-white shadow-[var(--shadow-lift)]">
              {user ? user.full_name.charAt(0) : '?'}
            </div>
            <h3 className="mt-4 text-lg font-bold text-ink">
              {user ? user.full_name : 'Guest Reciter'}
            </h3>
            <p className="mt-0.5 text-xs text-ink-soft">
              {user ? `@${user.username} · ${user.email}` : 'Sign in to sync streaks & XP across devices'}
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <Badge tone="brand">
                {user ? 'Verified Student' : 'Guest'}
              </Badge>
              {user && (
                <Badge tone="gold">
                  🔥 {user.streak_days} Day Streak
                </Badge>
              )}
            </div>
          </div>

          <div className="mt-6 w-full pt-4 border-t border-border">
            {user ? (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 text-xs"
                  onClick={() => {
                    setIsEditing(!isEditing);
                    setFullName(user.full_name);
                    setReferenceQari(user.reference_qari_name);
                    setTargetMinutes(user.target_daily_minutes);
                  }}
                >
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </Button>
                <Button variant="ghost" className="text-xs text-red-600 hover:bg-red-50" onClick={logout}>
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Button variant="primary" className="w-full text-xs" onClick={() => openAuthModal('login')}>
                  Sign In / Register
                </Button>
                <Button variant="outline" className="w-full text-xs" onClick={() => openAuthModal('demo')}>
                  ⭐ Use Demo Profile
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Reference Qari & Learning Goals */}
        <Card className="lg:col-span-2 space-y-5">
          <div>
            <h3 className="text-base font-bold text-ink">Reference Qari & Model Voice</h3>
            <p className="mt-1 text-xs text-ink-soft">
              The master reciter whose acoustic properties and tone your recitations are matched against.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-sand-50/70 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="grid size-12 place-items-center rounded-2xl bg-brand-700 text-white shadow-sm font-bold">
                  <Icon name="wave" size={22} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-ink">
                    {user?.reference_qari_name || 'Mahmoud Khalil Al-Hussary'}
                  </h4>
                  <p className="text-xs text-brand-700 font-semibold">
                    Target Pace: Classical Murattal · Benchmark Riwayah: Hafs 'an 'Asim
                  </p>
                </div>
              </div>

              <Link to="/practice/voice-match">
                <Button variant="gold" className="text-xs shadow-sm">
                  <Icon name="sparkle" size={14} />
                  Re-match Voice
                </Button>
              </Link>
            </div>
          </div>

          {/* Edit Form */}
          {isEditing && user && (
            <form onSubmit={handleSave} className="rounded-2xl border border-brand-200 bg-brand-50/30 p-5 space-y-4 animate-fade-in">
              <h4 className="font-bold text-xs uppercase tracking-wider text-brand-800">Edit Profile Information</h4>
              
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-ink-soft mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-xl border border-border bg-white px-3 py-2 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink-soft mb-1">Daily Practice Goal (Minutes)</label>
                  <input
                    type="number"
                    min={5}
                    max={120}
                    value={targetMinutes}
                    onChange={(e) => setTargetMinutes(Number(e.target.value))}
                    className="w-full rounded-xl border border-border bg-white px-3 py-2 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-soft mb-1">Reference Qari</label>
                <select
                  value={referenceQari}
                  onChange={(e) => setReferenceQari(e.target.value)}
                  className="w-full rounded-xl border border-border bg-white px-3 py-2 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="Mahmoud Khalil Al-Hussary">Mahmoud Khalil Al-Husary (Egyptian Murattal)</option>
                  <option value="Mishary Rashid Alafasy">Mishary Rashid Alafasy (Kuwaiti Melodic)</option>
                  <option value="Abdul Basit Abdul Samad">Abdul Basit Abdul Samad (Classic Mujawwad)</option>
                  <option value="Saad Al-Ghamdi">Saad Al-Ghamdi (Saudi Murattal)</option>
                  <option value="Abu Bakr Al-Shatri">Abu Bakr Al-Shatri (Paced Emotive)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" className="text-xs" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" className="text-xs" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          )}

          {/* Quick Demo Switcher */}
          <div className="border-t border-border pt-4">
            <h4 className="text-xs font-bold text-ink mb-2">Switch Demo Account</h4>
            <div className="grid gap-2 sm:grid-cols-3">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.key}
                  type="button"
                  onClick={() => openAuthModal('demo')}
                  className="flex items-center gap-2.5 rounded-xl border border-border bg-white p-2.5 text-left hover:border-brand-400 hover:bg-brand-50/40 transition-all text-xs"
                >
                  <div className={`grid size-7 place-items-center rounded-lg bg-gradient-to-br text-white font-bold text-[10px] ${acc.avatarBg}`}>
                    {acc.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold truncate text-ink">{acc.name}</p>
                    <p className="text-[10px] text-ink-soft truncate">{acc.role}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* App Preferences */}
      <Card>
        <h3 className="mb-4 text-base font-bold text-ink">Application Preferences</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <PrefRow title="App Language" value="English / العربية" />
          <PrefRow title="Recitation Riwayah" value="Hafs 'an 'Asim (حفص عن عاصم)" />
          <PrefRow title="AI Feedback Engine" value="WavLM Acoustic + 5-Stage Alignment" />
          <PrefRow title="Target Daily Goal" value={`${user?.target_daily_minutes ?? 15} Minutes / Day`} />
        </div>
      </Card>
    </div>
  );
}

function PrefRow({ title, value }: { title: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-sand-50/50 px-4 py-3">
      <span className="text-xs font-semibold text-ink-soft">{title}</span>
      <span className="text-xs font-bold text-ink">{value}</span>
    </div>
  );
}
