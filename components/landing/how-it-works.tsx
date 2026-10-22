'use client';

import { useEffect, useRef } from 'react';
import { BookOpen, Gamepad2, Trophy } from 'lucide-react';
import { useReducedMotionSafe } from '@/components/providers/use-reduced-motion';

const STEPS = [
  { icon: BookOpen, title: 'Learn', color: 'from-sky-500 to-indigo-500', body: 'Bite-sized lessons explain one idea at a time, with a real Indian example and a 3-question quiz.' },
  { icon: Gamepad2, title: 'Play', color: 'from-indigo-500 to-fuchsia-500', body: 'Put it to work in a game: every choice has a consequence, and every game ends with “What you learned”.' },
  { icon: Trophy, title: 'Level up', color: 'from-amber-400 to-emerald-500', body: 'Earn XP and virtual coins, unlock harder games, keep your streak, and climb the weekly leaderboard.' },
];

/**
 * Steps reveal in sequence when the section scrolls into view (GSAP ScrollTrigger).
 * No pinning: a pinned section needs `position: fixed`, which the route transition's transform breaks,
 * and the pin spacer showed up as a long blank gap.
 */
export function HowItWorks() {
  const root = useRef<HTMLElement>(null);
  const reduce = useReducedMotionSafe();

  useEffect(() => {
    // OS or in-app reduced motion: leave the steps static and visible.
    if (reduce || document.documentElement.classList.contains('reduce-motion')) return;
    let ctx: { revert: () => void } | undefined;
    let cancelled = false;
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')]);
      if (cancelled || !root.current) return;
      gsap.registerPlugin(ScrollTrigger);
      ctx = gsap.context(() => {
        const mm = gsap.matchMedia();
        mm.add('(min-width: 1024px)', () => {
          const steps = gsap.utils.toArray<HTMLElement>('[data-step]');
          const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: 'top 70%', once: true } });
          tl.fromTo('[data-line]', { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease: 'power1.inOut' }, 0);
          steps.forEach((el, i) => {
            const at = i * 0.4;
            tl.fromTo(`[data-dot="${i}"]`, { scale: 0.4, backgroundColor: 'rgb(148 163 184)' }, { scale: 1, backgroundColor: 'rgb(99 102 241)', duration: 0.4, ease: 'back.out(2)' }, at);
            tl.fromTo(el.querySelector('[data-card]'), { autoAlpha: 0, y: 50, scale: 0.94 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.7, ease: 'power3.out' }, at + 0.1);
          });
        });
        mm.add('(max-width: 1023px)', () => {
          gsap.utils.toArray<HTMLElement>('[data-step]').forEach((el) => {
            gsap.fromTo(el, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
          });
        });
      }, root);
      // Sections above (game carousels, fonts) can change height after mount; re-measure trigger positions.
      refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 600);
    })();
    return () => {
      cancelled = true;
      if (refreshTimer) clearTimeout(refreshTimer);
      ctx?.revert();
    };
  }, [reduce]);

  return (
    <section ref={root} className="relative py-20" aria-labelledby="how-title">
      <div className="container-page">
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
                <div data-card className="w-full rounded-3xl border border-border bg-surface p-7 shadow-sm transition-shadow duration-300 hover:shadow-xl">
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
