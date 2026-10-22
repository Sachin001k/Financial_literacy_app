'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion';
import { ArrowLeft, ArrowRight, Flag, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ScamState } from '@/lib/game/engines/scam-or-legit';
import { cn } from '@/lib/utils';
import { shouldIgnoreGameKey } from '../keyboard';
import type { RendererProps } from './types';

const CHANNEL_ICON: Record<string, string> = { SMS: '💬', WhatsApp: '🟢', Email: '✉️', Call: '📞', App: '📱' };

function MessageCard({ m }: { m: { channel: string; sender: string; body: string } }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-muted">
        <span className="text-lg" aria-hidden>{CHANNEL_ICON[m.channel]}</span>
        <span className="font-semibold">{m.channel}</span>
        <span>·</span>
        <span className="truncate">{m.sender}</span>
      </div>
      <p className="mt-4 rounded-2xl rounded-tl-sm bg-surface-2 p-4 text-[15px] leading-relaxed">{m.body}</p>
    </div>
  );
}

/** Swipe left for scam, right for legit (or ←/→, or buttons). */
export function ScamSwipeDeck({ state, onAction, busy }: RendererProps<ScamState>) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-14, 14]);
  const scamOpacity = useTransform(x, [-140, -30], [1, 0]);
  const legitOpacity = useTransform(x, [30, 140], [0, 1]);
  const asked = useRef<number | null>(null);
  const [revealing, setRevealing] = useState(false);
  const [exitDir, setExitDir] = useState(0);

  useEffect(() => {
    if (asked.current !== null && state.index === asked.current + 1 && state.lastReveal) {
      setRevealing(true);
      asked.current = null;
    }
  }, [state.index, state.lastReveal]);

  // Each new card starts centred.
  useEffect(() => {
    x.set(0);
  }, [state.index, revealing, x]);

  const judge = (type: 'SCAM' | 'LEGIT') => {
    if (busy || revealing || !state.current) return;
    asked.current = state.index;
    setExitDir(type === 'SCAM' ? -1 : 1);
    onAction(type);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (shouldIgnoreGameKey(e)) return;
      if (revealing && (e.key === 'Enter' || e.key === ' ')) {
        if (!state.current) return;
        e.preventDefault();
        setRevealing(false);
      } else if (!revealing && !busy && state.current && e.key === 'ArrowLeft') {
        e.preventDefault();
        judge('SCAM');
      } else if (!revealing && !busy && state.current && e.key === 'ArrowRight') {
        e.preventDefault();
        judge('LEGIT');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -110) judge('SCAM');
    else if (info.offset.x > 110) judge('LEGIT');
  };

  const r = state.lastReveal;

  return (
    <div className="mx-auto max-w-md">
      <div className="relative min-h-[340px]">
        <AnimatePresence mode="wait" custom={exitDir} onExitComplete={() => x.set(0)}>
          {revealing && r ? (
            <motion.div key={`reveal-${r.id}`} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className={cn('rounded-3xl border-2 bg-surface p-6 shadow-xl', r.correct ? 'border-gain/60' : 'border-loss/60')}>
              <div className="mb-4 flex items-center gap-2">
                {r.isScam ? <Flag className="h-6 w-6 text-loss" /> : <ShieldCheck className="h-6 w-6 text-gain" />}
                <p className="font-display text-xl font-bold">{r.isScam ? 'It was a SCAM' : 'It was LEGIT'} · {r.correct ? 'you got it ✓' : 'missed ✗'}</p>
              </div>
              <MessageCard m={r.message} />
              {r.redFlags.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-loss">Red flags</p>
                  <ul className="mt-1 space-y-1">
                    {r.redFlags.map((f, i) => (
                      <motion.li key={f} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.12 }} className="flex gap-2 text-sm">
                        <span aria-hidden>🚩</span>{f}
                      </motion.li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="mt-4 text-sm text-muted">{r.explanation}</p>
              {state.current && <Button className="mt-5 w-full" onClick={() => setRevealing(false)}>Next message</Button>}
            </motion.div>
          ) : state.current ? (
            <motion.div
              key={`card-${state.index}`}
              drag={busy ? false : 'x'}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.9}
              onDragEnd={onDragEnd}
              style={{ x, rotate }}
              initial={{ opacity: 0, y: 40, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ x: exitDir * 400, opacity: 0, rotate: exitDir * 20, transition: { duration: 0.3 } }}
              className="relative cursor-grab touch-pan-y rounded-3xl border border-border bg-surface p-6 shadow-xl active:cursor-grabbing"
            >
              <motion.span style={{ opacity: scamOpacity }} className="absolute right-5 top-5 rotate-12 rounded-xl border-4 border-loss px-3 py-1 font-display text-xl font-extrabold text-loss">SCAM</motion.span>
              <motion.span style={{ opacity: legitOpacity }} className="absolute left-5 top-5 -rotate-12 rounded-xl border-4 border-gain px-3 py-1 font-display text-xl font-extrabold text-gain">LEGIT</motion.span>
              <MessageCard m={state.current} />
              <p className="mt-6 text-center text-xs text-muted">Drag the card, use ← →, or tap below</p>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
      {!revealing && state.current && (
        <div className="mt-5 grid grid-cols-2 gap-4">
          <motion.button whileHover={{ y: -3 }} whileTap={{ scale: 0.95 }} disabled={busy} onClick={() => judge('SCAM')} className="flex items-center justify-center gap-2 rounded-2xl bg-loss py-4 font-display text-lg font-bold text-white shadow-lg shadow-loss/30 disabled:opacity-60">
            <ArrowLeft className="h-5 w-5" /> Scam
          </motion.button>
          <motion.button whileHover={{ y: -3 }} whileTap={{ scale: 0.95 }} disabled={busy} onClick={() => judge('LEGIT')} className="flex items-center justify-center gap-2 rounded-2xl bg-gain py-4 font-display text-lg font-bold text-white shadow-lg shadow-gain/30 disabled:opacity-60">
            Legit <ArrowRight className="h-5 w-5" />
          </motion.button>
        </div>
      )}
    </div>
  );
}
