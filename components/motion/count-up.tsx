'use client';

import { useEffect, useRef } from 'react';
import { animate, useInView, useReducedMotionConfig } from 'framer-motion';

const defaultFormat = (n: number) => Math.round(n).toLocaleString('en-IN');

/** Animated number count-up; `format` controls the display (₹, XP, %). */
export function CountUp({ value, from = 0, duration = 1.2, format = defaultFormat, className }: { value: number; from?: number; duration?: number; format?: (n: number) => string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotionConfig();
  const last = useRef(from);
  // Kept in a ref so inline format lambdas don't restart (and skip) the animation on every render.
  const formatRef = useRef(format);
  formatRef.current = format;

  useEffect(() => {
    const node = ref.current;
    if (!node || !inView) return;
    if (reduce) {
      node.textContent = formatRef.current(value);
      last.current = value;
      return;
    }
    const controls = animate(last.current, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => (node.textContent = formatRef.current(v)),
    });
    last.current = value;
    return () => controls.stop();
  }, [value, inView, duration, reduce]);

  return <span ref={ref} className={className}>{format(from)}</span>;
}
