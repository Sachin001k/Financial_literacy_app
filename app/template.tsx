'use client';

import { motion } from 'framer-motion';

/**
 * Route-level fade on every navigation. Opacity only: a transform here would become the containing
 * block for `position: fixed` descendants (GSAP pins, progress bars, overlays) and break them.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, ease: 'easeOut' }}>
      {children}
    </motion.div>
  );
}
