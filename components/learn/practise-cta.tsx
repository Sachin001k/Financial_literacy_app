'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';

export function PractiseInGameCTA({ slug, title, tagline, cover }: { slug: string; title: string; tagline: string; cover: { emoji: string; from: string; to: string } }) {
  // Links to the game page, which shows lock state and the gated Play button.
  return (
    <Link href={`/games/${slug}`} className="block rounded-3xl">
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      className="group relative flex w-full items-center gap-4 overflow-hidden rounded-3xl p-5 text-left text-white shadow-xl"
      style={{ background: `linear-gradient(135deg, ${cover.from}, ${cover.to})` }}
    >
      <span className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_20%,white_1px,transparent_1px)] [background-size:16px_16px]" />
      <motion.span className="relative text-5xl drop-shadow-lg" animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity }} aria-hidden>
        {cover.emoji}
      </motion.span>
      <span className="relative flex-1">
        <span className="block text-xs font-semibold uppercase tracking-wider opacity-80">Practise in a game</span>
        <span className="block text-xl font-bold">{title}</span>
        <span className="block text-sm opacity-90">{tagline}</span>
      </span>
      <span className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white/25 backdrop-blur transition group-hover:scale-110">
        <Play className="h-5 w-5 fill-current" />
      </span>
    </motion.div>
    </Link>
  );
}
