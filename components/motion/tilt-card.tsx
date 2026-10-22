'use client';

import type { ReactNode } from 'react';
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useReducedMotionSafe } from '@/components/providers/use-reduced-motion';

/** 3D tilt + cursor-following glow on hover. */
export function TiltCard({ children, className, glow = 'rgba(99,102,241,0.35)' }: { children: ReactNode; className?: string; glow?: string }) {
  const reduce = useReducedMotionSafe();
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);
  const rx = useSpring(useTransform(y, [0, 1], [8, -8]), { stiffness: 200, damping: 20 });
  const ry = useSpring(useTransform(x, [0, 1], [-10, 10]), { stiffness: 200, damping: 20 });
  const gx = useTransform(x, (v) => `${v * 100}%`);
  const gy = useTransform(y, (v) => `${v * 100}%`);
  const background = useMotionTemplate`radial-gradient(420px circle at ${gx} ${gy}, ${glow}, transparent 45%)`;

  return (
    <motion.div
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - r.left) / r.width);
        y.set((e.clientY - r.top) / r.height);
      }}
      onPointerLeave={() => {
        x.set(0.5);
        y.set(0.5);
      }}
      style={reduce ? undefined : { rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      className={cn('group relative', className)}
    >
      <motion.div className="pointer-events-none absolute -inset-px z-10 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background }} />
      {children}
    </motion.div>
  );
}
