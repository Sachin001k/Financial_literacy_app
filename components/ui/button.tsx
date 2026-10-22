'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'gain' | 'loss' | 'coin';
type Size = 'sm' | 'md' | 'lg' | 'icon';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand text-white shadow-lg shadow-brand/25 hover:brightness-110',
  secondary: 'bg-surface-2 text-fg hover:bg-border/60',
  ghost: 'text-fg hover:bg-surface-2',
  outline: 'border border-border bg-surface hover:border-brand/60 hover:text-brand',
  gain: 'bg-gain text-white shadow-lg shadow-gain/25 hover:brightness-110',
  loss: 'bg-loss text-white shadow-lg shadow-loss/25 hover:brightness-110',
  coin: 'bg-coin text-black shadow-lg shadow-coin/25 hover:brightness-105',
};

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-sm rounded-xl',
  md: 'h-11 px-5 text-sm rounded-xl',
  lg: 'h-13 px-7 py-3.5 text-base rounded-2xl',
  icon: 'h-10 w-10 rounded-xl',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, className, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'relative inline-flex select-none items-center justify-center gap-2 font-semibold transition-all duration-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
});
