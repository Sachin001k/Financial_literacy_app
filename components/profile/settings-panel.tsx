'use client';

import { useEffect, useState } from 'react';
import { LogOut, Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/components/providers/auth-provider';
import { useSound } from '@/components/providers/sound-provider';
import { toast } from '@/components/providers/toaster';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { api } from '@/lib/api';
import type { MeSummary } from '@/lib/server/me';
import { cn } from '@/lib/utils';

type Settings = MeSummary['settings'];

export function SettingsPanel({ me }: { me: MeSummary }) {
  const { refreshMe, signOut } = useAuth();
  const { setEnabled } = useSound();
  const { setTheme } = useTheme();
  const [s, setS] = useState<Settings>(me.settings);
  // Stay in sync when settings change elsewhere (e.g. the navbar sound/theme toggles).
  useEffect(() => setS(me.settings), [me.settings]);

  async function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    const prev = s;
    setS({ ...s, [key]: value });
    if (key === 'soundOn') setEnabled(value as boolean);
    if (key === 'theme') setTheme(value as string);
    try {
      await api('/me/settings', { method: 'PATCH', json: { [key]: value } });
      await refreshMe();
    } catch (e) {
      setS(prev);
      // Undo the side effects applied optimistically above
      if (key === 'soundOn') setEnabled(prev.soundOn);
      if (key === 'theme') setTheme(prev.theme);
      toast.error('Could not save setting', (e as Error).message);
    }
  }

  // No background music exists yet, so musicOn is stored but not offered here.
  const toggles: { key: 'soundOn' | 'reducedMotion' | 'highContrast'; label: string; hint: string }[] = [
    { key: 'soundOn', label: 'Sound effects', hint: 'Clicks, coins and celebrations' },
    { key: 'reducedMotion', label: 'Reduce motion', hint: 'Turn off most animations' },
    { key: 'highContrast', label: 'High contrast', hint: 'Stronger text and borders' },
  ];

  return (
    <div className="space-y-6">
      <ul className="divide-y divide-border rounded-2xl border border-border">
        {toggles.map((t) => (
          <li key={t.key} className="flex items-center justify-between gap-4 p-4">
            <div>
              <p className="font-semibold">{t.label}</p>
              <p className="text-sm text-muted">{t.hint}</p>
            </div>
            <Switch checked={s[t.key]} onChange={(v) => update(t.key, v)} label={t.label} />
          </li>
        ))}
      </ul>

      <div>
        <p className="mb-2 font-semibold">Theme</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { v: 'system', label: 'System', icon: Monitor },
            { v: 'light', label: 'Light', icon: Sun },
            { v: 'dark', label: 'Dark', icon: Moon },
          ].map((o) => (
            <button key={o.v} onClick={() => update('theme', o.v)} className={cn('flex items-center justify-center gap-2 rounded-xl border-2 p-3 text-sm font-medium transition', s.theme === o.v ? 'border-brand bg-brand-soft text-brand' : 'border-border hover:border-brand/40')}>
              <o.icon className="h-4 w-4" /> {o.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 font-semibold">Language</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { v: 'en', label: 'English' },
            { v: 'hi', label: 'हिन्दी (Hindi)' },
          ].map((o) => (
            <button key={o.v} onClick={() => update('language', o.v)} className={cn('rounded-xl border-2 p-3 text-sm font-medium transition', s.language === o.v ? 'border-brand bg-brand-soft text-brand' : 'border-border hover:border-brand/40')}>
              {o.label}
            </button>
          ))}
        </div>
        {s.language === 'hi' && <p className="mt-2 text-sm text-muted">Hindi is coming soon. We’ll switch you over automatically when it’s ready.</p>}
      </div>

      <div className="rounded-2xl border border-loss/30 bg-loss/5 p-4">
        <p className="font-semibold">Account</p>
        <p className="mb-3 text-sm text-muted">Signed in as {me.email}</p>
        <Button variant="loss" size="sm" onClick={signOut}><LogOut className="h-4 w-4" /> Log out</Button>
      </div>
    </div>
  );
}
