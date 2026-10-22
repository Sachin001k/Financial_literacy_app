'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, Coins, Gamepad2, GraduationCap, Rocket, Shield, Sparkles, Star, Trophy, Zap } from 'lucide-react';
import type { Familiarity } from '@/lib/game/types';
import { cn } from '@/lib/utils';

export function IntroStep({ name }: { name: string }) {
  const items = [
    { icon: BookOpen, title: 'Learn', body: '3-minute lessons on money, saving and investing.', color: 'from-emerald-500 to-teal-500' },
    { icon: Gamepad2, title: 'Play', body: 'Games where your choices have real consequences.', color: 'from-brand to-violet-500' },
    { icon: Trophy, title: 'Level up', body: 'Earn XP, coins and achievements as you grow.', color: 'from-amber-500 to-orange-500' },
  ];
  return (
    <div className="text-center">
      <motion.div className="mx-auto mb-4 text-6xl" animate={{ rotate: [0, 14, -8, 14, 0] }} transition={{ duration: 1.6, delay: 0.3 }} aria-hidden>👋</motion.div>
      <h1 className="text-3xl font-extrabold sm:text-4xl">Welcome, {name}!</h1>
      <p className="mx-auto mt-2 max-w-md text-muted">FinPlay teaches money by letting you practise with virtual ₹. Make mistakes here, not with your real savings.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {items.map((it, i) => (
          <motion.div key={it.title} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.12, type: 'spring', stiffness: 120 }} className="rounded-3xl border border-border bg-surface p-5">
            <span className={cn('mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-lg', it.color)}>
              <it.icon className="h-6 w-6" />
            </span>
            <p className="mt-3 font-bold">{i + 1}. {it.title}</p>
            <p className="mt-1 text-sm text-muted">{it.body}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function FamiliarityStep({ value, onChange }: { value: Familiarity | null; onChange: (f: Familiarity) => void }) {
  const tracks = [
    { value: 'BEGINNER' as const, emoji: '🌱', title: 'I’m new to this', who: 'Students and first-time learners', starts: 'Money basics, Life Simulator, your first ₹1,000 mission' },
    { value: 'SOME_EXPERIENCE' as const, emoji: '🚀', title: 'I know a bit', who: 'Young earners and graduates', starts: 'Investing lessons, Investment Simulator, portfolio games' },
  ];
  return (
    <div>
      <h2 className="text-center text-3xl font-extrabold">How familiar are you with money and investing?</h2>
      <p className="mt-2 text-center text-muted">We’ll pick the right first games and lessons. You can play everything later.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2" role="radiogroup">
        {tracks.map((t) => {
          const active = value === t.value;
          return (
            <motion.button
              key={t.value}
              role="radio"
              aria-checked={active}
              onClick={() => onChange(t.value)}
              whileHover={{ y: -6 }}
              whileTap={{ scale: 0.98 }}
              className={cn('relative rounded-3xl border-2 bg-surface p-6 text-left transition-colors', active ? 'border-brand shadow-xl shadow-brand/15' : 'border-border hover:border-brand/40')}
            >
              {active && <motion.span layoutId="fam-check" className="absolute right-4 top-4 grid h-7 w-7 place-items-center rounded-full bg-brand text-sm text-white">✓</motion.span>}
              <motion.span className="block text-5xl" animate={active ? { scale: [1, 1.25, 1], rotate: [0, -8, 0] } : {}} aria-hidden>{t.emoji}</motion.span>
              <p className="mt-3 text-xl font-bold">{t.title}</p>
              <p className="text-sm text-muted">{t.who}</p>
              <p className="mt-4 rounded-2xl bg-surface-2 p-3 text-sm"><strong>Starts with:</strong> {t.starts}</p>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

export function AssessmentStep({ questions, answers, onAnswer }: { questions: { prompt: string; options: string[] }[]; answers: (number | null)[]; onAnswer: (i: number, choice: number) => void }) {
  const [index, setIndex] = useState(0);
  if (!questions.length) return <div className="skeleton h-64" />;
  const q = questions[index];
  return (
    <div>
      <h2 className="text-center text-3xl font-extrabold">Quick knowledge check</h2>
      <p className="mt-2 text-center text-muted">No pressure — this just sets your starting point. You can skip it.</p>
      <div className="mx-auto mt-6 flex max-w-xs justify-center gap-1.5">
        {questions.map((_, i) => (
          <button key={i} onClick={() => setIndex(i)} aria-label={`Question ${i + 1}`} className={cn('h-2 flex-1 rounded-full transition-colors', i === index ? 'bg-brand' : answers[i] !== null ? 'bg-brand/40' : 'bg-surface-2')} />
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={index} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="mx-auto mt-6 max-w-xl">
          <p className="mb-4 text-lg font-semibold">{index + 1}. {q.prompt}</p>
          <div className="grid gap-2.5">
            {q.options.map((o, i) => (
              <button
                key={i}
                onClick={() => {
                  onAnswer(index, i);
                  if (index < questions.length - 1) setTimeout(() => setIndex(index + 1), 250);
                }}
                className={cn('rounded-2xl border-2 p-3.5 text-left transition-colors', answers[index] === i ? 'border-brand bg-brand-soft' : 'border-border hover:border-brand/40')}
              >
                {o}
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

const TUTORIAL = [
  { key: 'score', title: 'Your score', body: 'Good decisions raise your score. It decides your XP at the end.' },
  { key: 'wallet', title: 'Your wallet', body: 'Games show virtual ₹. Watch it go up and down as you choose.' },
  { key: 'choices', title: 'Your choices', body: 'Every turn, pick one option. There’s no undo, just like real life.' },
  { key: 'learned', title: 'What you learned', body: 'Every game ends with the money lessons behind your choices.' },
] as const;

export function TutorialStep({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const current = TUTORIAL[step];
  const hl = (k: string) => (current.key === k ? 'ring-4 ring-brand ring-offset-2 ring-offset-surface scale-[1.03]' : 'opacity-50');
  const advance = () => {
    if (step < TUTORIAL.length - 1) setStep(step + 1);
    else onDone();
  };
  return (
    <div>
      <h2 className="text-center text-3xl font-extrabold">How a game works</h2>
      <p className="mt-2 text-center text-muted">Tap the highlighted part to continue.</p>
      <div className="mx-auto mt-8 max-w-lg rounded-3xl border border-border bg-surface-2 p-4">
        <div className="flex gap-3">
          <button onClick={() => current.key === 'score' && advance()} className={cn('flex-1 rounded-2xl bg-surface p-3 text-left transition-all duration-300', hl('score'))}>
            <span className="flex items-center gap-1 text-xs text-muted"><Star className="h-3.5 w-3.5" /> Score</span>
            <span className="text-xl font-bold">420</span>
          </button>
          <button onClick={() => current.key === 'wallet' && advance()} className={cn('flex-1 rounded-2xl bg-surface p-3 text-left transition-all duration-300', hl('wallet'))}>
            <span className="flex items-center gap-1 text-xs text-muted"><Coins className="h-3.5 w-3.5" /> Wallet</span>
            <span className="text-xl font-bold text-gain">₹1,250</span>
          </button>
        </div>
        <div className={cn('mt-3 grid gap-2 rounded-2xl bg-surface p-3 transition-all duration-300', hl('choices'))} onClick={() => current.key === 'choices' && advance()} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && current.key === 'choices' && advance()}>
          <p className="text-sm font-semibold">Your phone screen cracked. What now?</p>
          <span className="rounded-xl border border-border px-3 py-2 text-sm">Repair it (₹1,500)</span>
          <span className="rounded-xl border border-border px-3 py-2 text-sm">Buy a new phone on EMI</span>
        </div>
        <button onClick={() => current.key === 'learned' && advance()} className={cn('mt-3 w-full rounded-2xl bg-gain/10 p-3 text-left transition-all duration-300', hl('learned'))}>
          <span className="flex items-center gap-1 text-xs font-semibold text-gain"><Sparkles className="h-3.5 w-3.5" /> What you learned</span>
          <span className="text-sm">An emergency fund turns a crisis into an inconvenience.</span>
        </button>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={current.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mx-auto mt-5 max-w-md rounded-2xl bg-brand p-4 text-center text-white shadow-lg">
          <p className="font-bold">{step + 1}/{TUTORIAL.length} · {current.title}</p>
          <p className="text-sm opacity-90">{current.body}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export function RulesStep() {
  const rules = [
    { icon: Shield, title: 'All money is virtual', body: 'Nothing here is real money or real trading. No stock tips, ever.', tone: 'text-gain bg-gain/10' },
    { icon: Zap, title: 'Earn XP', body: 'Games, lessons and quizzes give XP. Better play, more XP.', tone: 'text-coin bg-coin/10' },
    { icon: GraduationCap, title: 'Level up', body: 'Levels unlock new games. Some also unlock after a lesson.', tone: 'text-brand bg-brand-soft' },
    { icon: Trophy, title: 'Collect achievements', body: 'Badges like Diversified, Scam Spotter and 7-Day Streak.', tone: 'text-loss bg-loss/10' },
  ];
  return (
    <div>
      <h2 className="text-center text-3xl font-extrabold">The rules of the game</h2>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {rules.map((r, i) => (
          <motion.div key={r.title} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1, type: 'spring' }} className="flex gap-4 rounded-3xl border border-border bg-surface p-5">
            <span className={cn('grid h-12 w-12 shrink-0 place-items-center rounded-2xl', r.tone)}><r.icon className="h-6 w-6" /></span>
            <div>
              <p className="font-bold">{r.title}</p>
              <p className="text-sm text-muted">{r.body}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function FirstMissionStep({ mission }: { mission: { title: string; blurb: string } }) {
  return (
    <div className="text-center">
      <div className="relative mx-auto h-36 w-36">
        <motion.span className="absolute inset-0 rounded-full bg-coin/30" animate={{ scale: [1, 1.4], opacity: [0.6, 0] }} transition={{ duration: 1.8, repeat: Infinity }} />
        <motion.div initial={{ rotateY: 0 }} animate={{ rotateY: 360 }} transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }} className="relative grid h-36 w-36 place-items-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-3xl font-extrabold text-amber-900 shadow-2xl shadow-amber-500/40">
          ₹1,000
        </motion.div>
      </div>
      <p className="mt-6 inline-flex items-center gap-1 rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand"><Rocket className="h-3.5 w-3.5" /> Your first mission</p>
      <h2 className="mt-3 text-3xl font-extrabold">{mission.title}</h2>
      <p className="mx-auto mt-2 max-w-md text-muted">{mission.blurb}</p>
    </div>
  );
}

export type AgeBand = 'UNDER_13' | 'TEEN_13_17' | 'ADULT_18_24' | 'ADULT_25_PLUS';

/** Shown to OAuth signups whose age we don't know yet. */
export function AgeStep({ value, consent, onChange, onConsent }: { value: AgeBand | null; consent: boolean; onChange: (b: AgeBand) => void; onConsent: (c: boolean) => void }) {
  const bands: { value: AgeBand; label: string }[] = [
    { value: 'UNDER_13', label: 'Under 13' },
    { value: 'TEEN_13_17', label: '13–17' },
    { value: 'ADULT_18_24', label: '18–24' },
    { value: 'ADULT_25_PLUS', label: '25+' },
  ];
  return (
    <div className="text-center">
      <motion.div className="mx-auto mb-4 text-6xl" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }} aria-hidden>🎂</motion.div>
      <h2 className="text-3xl font-extrabold">How old are you?</h2>
      <p className="mx-auto mt-2 max-w-md text-muted">We only store an age range. It helps us keep FinPlay right for you.</p>
      <div className="mx-auto mt-8 grid max-w-md grid-cols-2 gap-3 sm:grid-cols-4" role="radiogroup" aria-label="Age range">
        {bands.map((b) => (
          <button
            key={b.value}
            role="radio"
            aria-checked={value === b.value}
            onClick={() => onChange(b.value)}
            className={cn('rounded-2xl border-2 px-3 py-3 font-semibold transition', value === b.value ? 'border-brand bg-brand-soft text-brand' : 'border-border bg-surface hover:border-brand/40')}
          >
            {b.label}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        {value === 'TEEN_13_17' && (
          <motion.label key="consent" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mx-auto mt-6 flex max-w-md items-start gap-2 text-left text-sm text-muted">
            <input type="checkbox" checked={consent} onChange={(e) => onConsent(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[rgb(var(--brand))]" />
            A parent or guardian knows I&apos;m using FinPlay and agrees.
          </motion.label>
        )}
        {value === 'UNDER_13' && (
          <motion.p key="young" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mx-auto mt-6 max-w-md rounded-2xl bg-coin/10 p-4 text-sm">
            FinPlay is for ages 13 and up for now. You can still read every lesson in the Learn hub without an account. See you soon! 👋
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
