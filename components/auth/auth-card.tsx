'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { AuthForm } from './auth-form';

export function AuthCard({ initialMode }: { initialMode: 'signup' | 'login' }) {
  const params = useSearchParams();
  const next = params.get('next') ?? '/home';
  const oauthError = params.get('error') === 'oauth';
  const linkError = params.get('error') === 'link';
  const confirmed = params.get('confirmed') === '1';
  const [mode, setModeState] = useState<'signup' | 'login'>(confirmed ? 'login' : initialMode);
  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden px-4 py-12">
      <div className="grid-bg absolute inset-0 -z-10" />
      <motion.div aria-hidden className="absolute -left-20 top-20 -z-10 h-72 w-72 rounded-full bg-brand/30 blur-3xl" animate={{ x: [0, 40, 0], y: [0, 30, 0] }} transition={{ duration: 12, repeat: Infinity }} />
      <motion.div aria-hidden className="absolute -right-20 bottom-10 -z-10 h-72 w-72 rounded-full bg-emerald-400/25 blur-3xl" animate={{ x: [0, -30, 0], y: [0, -40, 0] }} transition={{ duration: 14, repeat: Infinity }} />
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 120, damping: 18 }} className="glass w-full max-w-md rounded-3xl p-7 shadow-2xl">
        <h1 className="text-center text-3xl font-extrabold">{mode === 'signup' ? 'Start playing free' : 'Welcome back'}</h1>
        <p className="mb-6 mt-1 text-center text-sm text-muted">{mode === 'signup' ? 'Get ₹1,000 in virtual money to begin.' : 'Pick up where you left off.'}</p>
        {oauthError && <p className="mb-4 rounded-xl bg-loss/10 px-3 py-2 text-sm text-loss">Google sign-in did not complete. Please try again.</p>}
        {linkError && <p className="mb-4 rounded-xl bg-loss/10 px-3 py-2 text-sm text-loss">That link has expired or was already used. Log in, or sign up again for a new link.</p>}
        {confirmed && <p className="mb-4 rounded-xl bg-gain/10 px-3 py-2 text-sm text-gain">Email confirmed. Log in to start playing.</p>}
        <AuthForm mode={mode} onModeChange={setModeState} next={next} />
      </motion.div>
    </div>
  );
}
