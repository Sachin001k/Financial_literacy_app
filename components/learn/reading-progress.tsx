'use client';

import { motion, useScroll, useSpring } from 'framer-motion';

export function ReadingProgress({ color }: { color: string }) {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 25 });
  return <motion.div className="fixed inset-x-0 top-0 z-[60] h-1 origin-left" style={{ scaleX, background: color }} aria-hidden />;
}
