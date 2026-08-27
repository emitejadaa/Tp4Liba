import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md';

const BASE =
  'inline-flex items-center justify-center gap-2 font-bold tracking-[0.03em] whitespace-nowrap ' +
  'transition-[transform,background-color,border-color,box-shadow,color] duration-200 ' +
  'motion-safe:hover:-translate-y-0.5 active:translate-y-0 disabled:pointer-events-none disabled:opacity-50';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-orange text-ink hover:bg-orange-strong hover:shadow-[0_10px_30px_-10px_#f97316]',
  secondary: 'border border-line-strong text-soft hover:border-orange hover:text-chalk',
  ghost: 'text-soft hover:text-orange',
};

const SIZES: Record<Size, string> = {
  sm: 'rounded-chip px-[22px] py-[11px] text-[15px]',
  md: 'rounded-control px-8 py-4 text-[17px]',
};

type CommonProps = { variant?: Variant; size?: Size; className?: string; children: ReactNode };

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={cn(BASE, VARIANTS[variant], SIZES[size], className)} {...props}>
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: CommonProps & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a className={cn(BASE, VARIANTS[variant], SIZES[size], className)} {...props}>
      {children}
    </a>
  );
}
