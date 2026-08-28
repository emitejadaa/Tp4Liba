'use client';

import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { motion } from 'motion/react';
import { useMagnetic } from '@/hooks/useMagnetic';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md';

const BASE =
  'inline-flex items-center justify-center gap-2 font-bold tracking-[0.03em] whitespace-nowrap ' +
  'transition-[background-color,border-color,box-shadow,color] duration-200 ' +
  'disabled:pointer-events-none disabled:opacity-50';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-orange text-ink hover:bg-orange-strong hover:shadow-[0_14px_38px_-12px_#f97316]',
  secondary: 'border border-line-strong text-soft hover:border-orange hover:text-chalk',
  ghost: 'text-soft hover:text-orange',
};

const SIZES: Record<Size, string> = {
  sm: 'rounded-chip px-[22px] py-[11px] text-[15px]',
  md: 'rounded-control px-8 py-4 text-[17px]',
};

const SPRING = { type: 'spring', stiffness: 320, damping: 22, mass: 0.4 } as const;

type CommonProps = { variant?: Variant; size?: Size; className?: string; children: ReactNode };

/**
 * Motion define sus propios `onDrag*` y `onAnimation*` con firmas distintas a
 * las de React, así que se sacan de los props nativos para que no choquen.
 */
type WithoutMotionConflicts<T> = Omit<
  T,
  'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd' | 'style'
>;

/**
 * Botón con atracción magnética: se corre unos píxeles hacia el puntero y
 * vuelve a su lugar al salir. El desplazamiento está acotado para que el botón
 * nunca se escape de debajo del cursor.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: CommonProps & WithoutMotionConflicts<ButtonHTMLAttributes<HTMLButtonElement>>) {
  const { offset, enabled, handlers } = useMagnetic();

  return (
    <motion.button
      {...(enabled ? handlers : {})}
      animate={enabled ? { x: offset.x, y: offset.y } : undefined}
      whileTap={enabled ? { scale: 0.96 } : undefined}
      transition={SPRING}
      className={cn(BASE, VARIANTS[variant], SIZES[size], className)}
      {...props}
    >
      {children}
    </motion.button>
  );
}

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: CommonProps & WithoutMotionConflicts<AnchorHTMLAttributes<HTMLAnchorElement>>) {
  const { offset, enabled, handlers } = useMagnetic();

  return (
    <motion.a
      {...(enabled ? handlers : {})}
      animate={enabled ? { x: offset.x, y: offset.y } : undefined}
      whileTap={enabled ? { scale: 0.96 } : undefined}
      transition={SPRING}
      className={cn(BASE, VARIANTS[variant], SIZES[size], className)}
      {...props}
    >
      {children}
    </motion.a>
  );
}
