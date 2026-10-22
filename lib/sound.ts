'use client';

// Tiny synthesized sound effects (WebAudio), so no audio assets are needed.
let ctx: AudioContext | null = null;

function audio() {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', gain = 0.08) {
  const a = audio();
  if (!a) return;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, a.currentTime + start);
  g.gain.setValueAtTime(0, a.currentTime + start);
  g.gain.linearRampToValueAtTime(gain, a.currentTime + start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + start + dur);
  osc.connect(g).connect(a.destination);
  osc.start(a.currentTime + start);
  osc.stop(a.currentTime + start + dur + 0.02);
}

export type SoundName = 'click' | 'success' | 'fail' | 'coin' | 'levelup' | 'whoosh';

export function playSound(name: SoundName) {
  switch (name) {
    case 'click':
      return tone(660, 0, 0.06, 'triangle', 0.05);
    case 'success':
      tone(523, 0, 0.12, 'triangle');
      return tone(784, 0.1, 0.18, 'triangle');
    case 'fail':
      tone(300, 0, 0.15, 'sawtooth', 0.04);
      return tone(220, 0.12, 0.22, 'sawtooth', 0.04);
    case 'coin':
      tone(988, 0, 0.08, 'square', 0.03);
      return tone(1319, 0.07, 0.2, 'square', 0.03);
    case 'levelup':
      [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.1, 0.25, 'triangle'));
      return;
    case 'whoosh':
      return tone(200, 0, 0.2, 'sine', 0.03);
  }
}
