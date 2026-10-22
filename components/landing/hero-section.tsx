'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Gamepad2, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { AnimatedTicker } from './animated-ticker';
import { FloatingCoins } from './floating-coins';
import { TypewriterHeadline } from './typewriter-headline';

export function HeroSection() {
  const { user, openGate } = useAuth();
  return (
    <section className="relative overflow-hidden pb-16 pt-10 sm:pt-16">
      <div className="grid-bg absolute inset-0 -z-20" />
      <motion.div aria-hidden className="absolute -left-32 top-0 -z-20 h-96 w-96 rounded-full bg-brand/25 blur-3xl" animate={{ x: [0, 60, 0], y: [0, 40, 0] }} transition={{ duration: 16, repeat: Infinity }} />
      <motion.div aria-hidden className="absolute -right-32 top-40 -z-20 h-96 w-96 rounded-full bg-emerald-400/20 blur-3xl" animate={{ x: [0, -50, 0], y: [0, -30, 0] }} transition={{ duration: 18, repeat: Infinity }} />
      <FloatingCoins />
      <div className="container-page grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-muted shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-coin" /> 6 games · 5 learning tracks · 100% virtual ₹
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl font-extrabold leading-[1.1] sm:text-5xl lg:text-6xl">
            Money is a game.
            <br />
            <span className="inline-block min-h-[1.2em]">
              <TypewriterHeadline />
            </span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-5 max-w-xl text-lg text-muted">
            Short games that teach budgeting, saving and investing. Make choices, see consequences, and level up — without risking a single real rupee.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-8 flex flex-wrap gap-3">
            {user ? (
              <Link href="/home">
                <Button size="lg">Go to dashboard <ArrowRight className="h-5 w-5" /></Button>
              </Link>
            ) : (
              <Button size="lg" onClick={() => openGate('signup')}>
                Start playing free <ArrowRight className="h-5 w-5" />
              </Button>
            )}
            <Link href="/games">
              <Button size="lg" variant="outline"><Gamepad2 className="h-5 w-5" /> Explore games</Button>
            </Link>
          </motion.div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-5 flex items-center gap-2 text-sm text-muted">
            <ShieldCheck className="h-4 w-4 text-gain" /> No real money. No stock tips. Just learning that sticks.
          </motion.p>
        </div>
        <motion.div initial={{ opacity: 0, scale: 0.9, rotate: 2 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 80, damping: 16, delay: 0.2 }} className="relative">
          <AnimatedTicker />
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.4, type: 'spring' }}
            className="glass absolute -bottom-6 -left-4 flex items-center gap-3 rounded-2xl px-4 py-3 shadow-xl sm:-left-8"
          >
            <span className="text-2xl">🏆</span>
            <div>
              <p className="text-xs text-muted">Achievement unlocked</p>
              <p className="text-sm font-bold">Diversified +30 XP</p>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.7, type: 'spring' }}
            className="glass absolute -right-2 -top-5 flex items-center gap-2 rounded-2xl px-4 py-2.5 shadow-xl sm:-right-6"
          >
            <span>🪙</span>
            <p className="text-sm font-bold text-coin">+₹240 earned</p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
