import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type Tone = 'default' | 'brand' | 'gain' | 'loss' | 'coin';
const TONES: Record<Tone, string> = {
  default: 'bg-surface-2 text-muted',
  brand: 'bg-brand-soft text-brand',
  gain: 'bg-gain/15 text-gain',
  loss: 'bg-loss/15 text-loss',
  coin: 'bg-coin/15 text-coin',
};

export function Badge({ tone = 'default', className, ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold', TONES[tone], className)} {...props} />;
}
