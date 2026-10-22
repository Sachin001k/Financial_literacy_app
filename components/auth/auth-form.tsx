'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import { isSupabaseConfigured, SITE_URL } from '@/lib/supabase/env';
import { cn } from '@/lib/utils';

const AGE_BANDS = [
  { value: 'UNDER_13', label: 'Under 13' },
  { value: 'TEEN_13_17', label: '13–17' },
  { value: 'ADULT_18_24', label: '18–24' },
  { value: 'ADULT_25_PLUS', label: '25+' },
] as const;

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h6a5.1 5.1 0 0 1-2.2 3.4v2.8h3.6c2-1.9 3.2-4.7 3.2-8.2Z" />
      <path fill="#34A853" d="M12 23c3 0 5.5-1 7.4-2.7l-3.6-2.8c-1 .7-2.3 1.1-3.8 1.1-2.9 0-5.4-2-6.3-4.6H2v2.9A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.7 14c-.2-.7-.4-1.4-.4-2s.1-1.4.4-2V7.1H2A11 11 0 0 0 1 12c0 1.8.4 3.4 1.2 4.9L5.7 14Z" />
      <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2 7.1L5.7 10c.9-2.6 3.4-4.6 6.3-4.6Z" />
    </svg>
  );
}

/** Email + password and Google sign-in, shared by /signup, /login and the AuthGateModal. */
export function AuthForm({ mode, onModeChange, next = '/home', onDone }: { mode: 'signup' | 'login'; onModeChange?: (m: 'signup' | 'login') => void; next?: string; onDone?: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [ageBand, setAgeBand] = useState<(typeof AGE_BANDS)[number]['value']>('ADULT_18_24');
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);

  const continueUrl = `/auth/continue?next=${encodeURIComponent(next)}`;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isSupabaseConfigured) return setError('Supabase keys are missing. Add them to .env.local.');
    if (mode === 'signup') {
      if (ageBand === 'UNDER_13') return setError('FinPlay is for ages 13 and up for now.');
      if (ageBand === 'TEEN_13_17' && !consent) return setError('Please confirm a parent or guardian agrees.');
    }
    setLoading(true);
    const supabase = getSupabaseBrowser();
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${SITE_URL}/auth/callback?next=${encodeURIComponent(next)}`,
            data: { display_name: name.trim(), age_band: ageBand, parent_consent: consent },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setCheckEmail(true);
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      onDone?.();
      window.location.href = continueUrl;
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function google() {
    if (!isSupabaseConfigured) return setError('Supabase keys are missing. Add them to .env.local.');
    await getSupabaseBrowser().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
  }

  if (checkEmail) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="py-6 text-center">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-brand-soft text-brand">
          <Mail className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-bold">Check your inbox</h3>
        <p className="mt-2 text-sm text-muted">We sent a confirmation link to <strong>{email}</strong>. Open it to start playing.</p>
      </motion.div>
    );
  }

  return (
    <div>
      <Button type="button" variant="outline" className="w-full" onClick={google}>
        <GoogleIcon /> Continue with Google
      </Button>
      <div className="my-5 flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-border" /> or with email <span className="h-px flex-1 bg-border" />
      </div>
      <form onSubmit={submit} className="space-y-4">
        <AnimatePresence initial={false}>
          {mode === 'signup' && (
            <motion.div key="name" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <Label htmlFor="name">Display name</Label>
              <Input id="name" required minLength={2} maxLength={40} value={name} onChange={(e) => setName(e.target.value)} placeholder="What should we call you?" />
            </motion.div>
          )}
        </AnimatePresence>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" required minLength={mode === 'signup' ? 8 : 1} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={mode === 'signup' ? 'At least 8 characters' : '••••••••'} />
        </div>
        <AnimatePresence initial={false}>
          {mode === 'signup' && (
            <motion.div key="age" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <Label>Age</Label>
              <div className="grid grid-cols-4 gap-2">
                {AGE_BANDS.map((b) => (
                  <button
                    type="button"
                    key={b.value}
                    onClick={() => setAgeBand(b.value)}
                    className={cn('rounded-xl border px-2 py-2 text-sm font-medium transition', ageBand === b.value ? 'border-brand bg-brand-soft text-brand' : 'border-border hover:border-brand/50')}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
              {ageBand === 'TEEN_13_17' && (
                <label className="mt-3 flex items-start gap-2 text-sm text-muted">
                  <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[rgb(var(--brand))]" />
                  A parent or guardian knows I&apos;m signing up and agrees.
                </label>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {error && (
            <motion.p initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: [0, -6, 6, -3, 0] }} exit={{ opacity: 0 }} className="rounded-xl bg-loss/10 px-3 py-2 text-sm text-loss" role="alert">
              {error}
            </motion.p>
          )}
        </AnimatePresence>
        <Button type="submit" className="w-full" size="lg" loading={loading}>
          {mode === 'signup' ? 'Create free account' : 'Log in'}
        </Button>
      </form>
      {onModeChange && (
        <p className="mt-5 text-center text-sm text-muted">
          {mode === 'signup' ? 'Already have an account?' : 'New to FinPlay?'}{' '}
          <button className="font-semibold text-brand hover:underline" onClick={() => onModeChange(mode === 'signup' ? 'login' : 'signup')}>
            {mode === 'signup' ? 'Log in' : 'Sign up free'}
          </button>
        </p>
      )}
      <p className="mt-4 text-center text-xs text-muted">All money in FinPlay is virtual. No real trading, ever.</p>
    </div>
  );
}
