'use client';

import { CountUp } from '@/components/motion/count-up';
import { StaggerItem, StaggerList } from '@/components/motion/stagger';

// Approximate, widely cited figures. Verify against the original sources before publishing.
const STATS = [
  { value: 24, suffix: '%', label: 'of Indian adults were financially literate', source: 'S&P Global FinLit Survey (2014), approx.' },
  { value: 27, suffix: '%', label: 'of Indian adults met the financial-literacy benchmark', source: 'NCFE Financial Literacy & Inclusion Survey (2019), approx.' },
  { value: 65, suffix: '%', label: 'of India’s population is under 35', source: 'Census-based estimates, approx.' },
  { value: 0, suffix: '₹', label: 'of real money at risk while you learn here', source: 'FinPlay — everything is virtual' },
];

export function ProblemStats() {
  return (
    <StaggerList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {STATS.map((s) => (
        <StaggerItem key={s.label} className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
          <p className="font-display text-5xl font-extrabold text-brand">
            {s.suffix === '₹' ? '₹' : ''}
            <CountUp value={s.value} />
            {s.suffix === '%' ? '%' : ''}
          </p>
          <p className="mt-2 font-medium">{s.label}</p>
          <p className="mt-2 text-xs text-muted">{s.source}</p>
        </StaggerItem>
      ))}
    </StaggerList>
  );
}
