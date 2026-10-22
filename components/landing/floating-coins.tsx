'use client';

import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from 'framer-motion';
import { useEffect } from 'react';
import { useReducedMotionSafe } from '@/components/providers/use-reduced-motion';

const COINS = [
  { emoji: '🪙', x: '6%', y: '18%', size: 44, depth: 30, delay: 0 },
  { emoji: '💰', x: '88%', y: '12%', size: 52, depth: 50, delay: 1 },
  { emoji: '📈', x: '78%', y: '72%', size: 40, depth: 25, delay: 2 },
  { emoji: '🪙', x: '14%', y: '78%', size: 34, depth: 60, delay: 0.5 },
  { emoji: '💎', x: '48%', y: '6%', size: 30, depth: 40, delay: 1.5 },
  { emoji: '🪙', x: '94%', y: '45%', size: 28, depth: 70, delay: 2.5 },
];

function Coin({ c, mx, my }: { c: (typeof COINS)[number]; mx: MotionValue<number>; my: MotionValue<number> }) {
  const tx = useTransform(mx, (v) => v * c.depth);
  const ty = useTransform(my, (v) => v * c.depth);
  return (
    <motion.span className="absolute select-none" style={{ left: c.x, top: c.y, x: tx, y: ty, fontSize: c.size }} aria-hidden>
      <span className="block animate-float drop-shadow-lg" style={{ animationDelay: `${c.delay}s` }}>
        {c.emoji}
      </span>
    </motion.span>
  );
}

/** Coins float in place and drift with the mouse (parallax by depth). */
export function FloatingCoins() {
  const reduce = useReducedMotionSafe();
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const mx = useSpring(rawX, { stiffness: 50, damping: 15 });
  const my = useSpring(rawY, { stiffness: 50, damping: 15 });

  useEffect(() => {
    if (reduce) return;
    const onMove = (e: PointerEvent) => {
      rawX.set(e.clientX / window.innerWidth - 0.5);
      rawY.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [rawX, rawY, reduce]);

  return (
    <div className="pointer-events-none absolute inset-0 -z-10 hidden sm:block">
      {COINS.map((c, i) => (
        <Coin key={i} c={c} mx={mx} my={my} />
      ))}
    </div>
  );
}
