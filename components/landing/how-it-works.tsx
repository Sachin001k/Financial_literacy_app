'use client';

import { useEffect, useRef } from 'react';
import { BookOpen, Gamepad2, Trophy } from 'lucide-react';
import { useReducedMotionSafe } from '@/components/providers/use-reduced-motion';

const STEPS = [
  { icon: BookOpen, title: 'Learn', color: 'from-sky-500 to-indigo-500', body: 'Bite-sized lessons explain one idea at a time, with a real Indian example and a 3-question quiz.' },
  { icon: Gamepad2, title: 'Play', color: 'from-indigo-500 to-fuchsia-500', body: 'Put it to work in a game: every choice has a consequence, and every game ends with “What you learned”.' },
  { icon: Trophy, title: 'Level up', color: 'from-amber-400 to-emerald-500', body: 'Earn XP and virtual coins, unlock harder games, keep your streak, and climb the weekly leaderboard.' },
];

/** Steps pin and reveal on scroll (GSAP ScrollTrigger on desktop; simple reveal otherwise). */
export function HowItWorks() {
  const root = useRef<HTMLElement>(null);
  const reduce = useReducedMotionSafe();

  useEffect(() => {
    // OS or in-app reduced motion: leave the steps static and visible.
    if (reduce || document.documentElement.classList.contains('reduce-motion')) return;
    let ctx: { revert: () => void } | undefined;
    let cancelled = false;
    (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')]);
      if (cancelled || !root.current) return;
      gsap.registerPlugin(ScrollTrigger);
      ctx = gsap.context(() => {
        const mm = gsap.matchMedia();
        mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
          const steps = gsap.utils.toArray<HTMLElement>('[data-step]');
          const tl = gsap.timeline({
            scrollTrigger: { trigger: '[data-pin]', start: 'top top+=80', end: '+=1400', scrub: 0.6, pin: true },
          });
          steps.forEach((el, i) => {
            tl.fromTo(el, { autoAlpha: 0.15, y: 60, scale: 0.92 }, { autoAlpha: 1, y: 0, scale: 1, duration: 1 }, i);
            tl.fromTo(`[data-dot="${i}"]`, { scale: 0.4, backgroundColor: 'rgb(148 163 184)' }, { scale: 1, backgroundColor: 'rgb(99 102 241)', duration: 0.5 }, i);
          });
          tl.fromTo('[data-line]', { scaleX: 0 }, { scaleX: 1, duration: steps.length, ease: 'none' }, 0);
        });
        mm.add('(max-width: 1023px), (prefers-reduced-motion: reduce)', () => {
          gsap.utils.toArray<HTMLElement>('[data-step]').forEach((el) => {
            gsap.fromTo(el, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.6, scrollTrigger: { trigger: el, start: 'top 85%' } });
          });
        });
      }, root);
    })();
    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [reduce]);

  return (
    <section ref={root} className="relative py-20" aria-labelledby="how-title">
      <div data-pin className="container-page">
        <div className="mb-12 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand">How it works</p>
          <h2 id="how-title" className="mt-2 text-3xl font-extrabold sm:text-4xl">Learn → Play → Level up</h2>
        </div>
        <div className="relative">
          <div className="absolute left-[16%] right-[16%] top-6 hidden h-1 rounded-full bg-surface-2 lg:block">
            <div data-line className="h-full origin-left rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-500" />
          </div>
          <ol className="grid gap-6 lg:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} data-step className="relative flex flex-col items-center text-center">
                <span data-dot={i} className="relative z-10 mb-6 hidden h-12 w-12 rounded-full ring-8 ring-bg lg:block" />
                <div className="w-full rounded-3xl border border-border bg-surface p-7 shadow-sm">
                  <div className={`mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br ${s.color} text-white shadow-lg`}>
                    <s.icon className="h-8 w-8" />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted">Step {i + 1}</p>
                  <h3 className="mt-1 text-2xl font-bold">{s.title}</h3>
                  <p className="mt-2 text-muted">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
