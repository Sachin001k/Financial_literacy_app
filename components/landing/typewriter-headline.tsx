'use client';

import { useEffect, useState } from 'react';
import { useReducedMotionSafe } from '@/components/providers/use-reduced-motion';

const PHRASES = ['Learn money by playing.', 'Grow ₹1 lakh in 5 years.', 'Spot scams before they spot you.', 'Budget like a boss.'];

/** Types, pauses, deletes, then moves to the next phrase. */
export function TypewriterHeadline() {
  const reduce = useReducedMotionSafe();
  const [i, setI] = useState(0);
  const [text, setText] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (reduce) {
      setText(PHRASES[i]);
      return;
    }
    const full = PHRASES[i];
    let delay = deleting ? 35 : 70;
    if (!deleting && text === full) delay = 1800;
    if (deleting && text === '') delay = 300;
    const t = setTimeout(() => {
      if (!deleting && text === full) return setDeleting(true);
      if (deleting && text === '') {
        setDeleting(false);
        return setI((n) => (n + 1) % PHRASES.length);
      }
      setText(deleting ? full.slice(0, text.length - 1) : full.slice(0, text.length + 1));
    }, delay);
    return () => clearTimeout(t);
  }, [text, deleting, i, reduce]);

  return (
    <span className="text-gradient" aria-label={PHRASES[i]}>
      <span aria-hidden>{text}</span>
      <span aria-hidden className="ml-0.5 inline-block w-[3px] animate-pulse bg-brand align-middle" style={{ height: '0.9em' }} />
    </span>
  );
}
