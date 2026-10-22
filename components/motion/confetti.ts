'use client';

import confetti from 'canvas-confetti';

function reduced() {
  return typeof window !== 'undefined' && (window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('reduce-motion'));
}

export function burstConfetti(power: 'small' | 'big' = 'small') {
  if (reduced()) return;
  const colors = ['#6366f1', '#22c55e', '#f59e0b', '#ec4899', '#0ea5e9'];
  if (power === 'small') {
    void confetti({ particleCount: 80, spread: 70, origin: { y: 0.65 }, colors });
    return;
  }
  const end = Date.now() + 1200;
  (function frame() {
    void confetti({ particleCount: 6, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors });
    void confetti({ particleCount: 6, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

export function coinRain() {
  if (reduced()) return;
  const coin = confetti.shapeFromText ? confetti.shapeFromText({ text: '🪙', scalar: 2 }) : undefined;
  void confetti({ particleCount: 40, spread: 100, startVelocity: 35, origin: { y: 0.4 }, shapes: coin ? [coin] : undefined, scalar: 2 });
}
