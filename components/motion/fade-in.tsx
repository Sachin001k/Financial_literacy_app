'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';

/** Fades + slides content in when it scrolls into view. */
export function FadeIn({ delay = 0, y = 24, once = true, ...props }: HTMLMotionProps<'div'> & { delay?: number; y?: number; once?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: '-60px' }}
      transition={{ duration: 0.6, delay, ease: [0.21, 0.6, 0.35, 1] }}
      {...props}
    />
  );
}
