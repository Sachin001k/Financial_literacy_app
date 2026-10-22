'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[70vh] flex-col items-center justify-center text-center">
      <div className="relative">
        <motion.p initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 120 }} className="font-display text-[8rem] font-extrabold leading-none text-gradient sm:text-[11rem]">
          404
        </motion.p>
        <motion.span className="absolute -right-6 top-0 text-5xl" animate={{ y: [0, -14, 0], rotate: [0, 20, 0] }} transition={{ duration: 2.5, repeat: Infinity }} aria-hidden>
          🪙
        </motion.span>
        <motion.span className="absolute -left-8 bottom-4 text-4xl" animate={{ y: [0, 10, 0], rotate: [0, -15, 0] }} transition={{ duration: 3, repeat: Infinity }} aria-hidden>
          📉
        </motion.span>
      </div>
      <h1 className="mt-2 text-2xl font-bold">This page crashed harder than a meme stock.</h1>
      <p className="mt-2 text-muted">We couldn&apos;t find what you were looking for.</p>
      <div className="mt-6 flex gap-3">
        <Link href="/"><Button>Back home</Button></Link>
        <Link href="/games"><Button variant="outline">Browse games</Button></Link>
      </div>
    </div>
  );
}
