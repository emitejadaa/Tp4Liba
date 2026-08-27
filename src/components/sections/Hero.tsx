'use client';

import { Fragment, useRef } from 'react';
import { motion, useScroll, useSpring, useTransform } from 'motion/react';
import { DotBadge } from '@/components/ui/Badge';
import { Button, ButtonLink } from '@/components/ui/Button';
import { HERO } from '@/data/hero';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { asset } from '@/lib/site';

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Encabezado de la landing.
 *
 * La pelota y las líneas de cancha se mueven a distinta velocidad que el resto
 * al scrollear, lo que da profundidad sin tapar el texto. Con
 * `prefers-reduced-motion` todo queda quieto y en su posición final.
 */
export function Hero({ onRegister }: { onRegister?: () => void }) {
  const prefersReduced = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });

  // Un resorte suaviza el seguimiento del scroll para que no se sienta rígido.
  const smooth = useSpring(scrollYProgress, { stiffness: 90, damping: 24, mass: 0.4 });
  const ballY = useTransform(smooth, [0, 1], [0, 110]);
  const ballScale = useTransform(smooth, [0, 1], [1, 0.9]);
  const courtY = useTransform(smooth, [0, 1], [0, 60]);
  const textY = useTransform(smooth, [0, 1], [0, -30]);

  const words = HERO.titleLead.trim().split(' ');

  return (
    <section
      id="inicio"
      ref={sectionRef}
      className="border-line relative overflow-hidden border-b pt-32 pb-20 lg:pt-40 lg:pb-26"
    >
      {/* Líneas de cancha del diseño: decorativas, no se anuncian al lector de pantalla. */}
      <motion.div
        aria-hidden="true"
        style={prefersReduced ? undefined : { y: courtY }}
        className="text-muted pointer-events-none absolute -top-16 -right-40 hidden w-[1100px] opacity-10 md:block"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset('/assets/court-lines.svg')} alt="" width={1100} height={760} />
      </motion.div>

      <div className="layout-container relative flex flex-col items-center gap-10 lg:flex-row lg:gap-[60px]">
        <motion.div
          style={prefersReduced ? undefined : { y: textY }}
          className="flex min-w-0 flex-1 flex-col items-start gap-[21px]"
        >
          <h1 className="text-[clamp(3rem,8vw,6rem)] leading-[0.95] font-bold tracking-[-0.01em]">
            {words.map((word, index) => (
              // El espacio va como nodo de texto entre spans para que el título
              // siga leyéndose «Bienvenidos a LIBA» y no todo pegado.
              <Fragment key={word}>
                <motion.span
                  className="inline-block"
                  initial={prefersReduced ? undefined : { opacity: 0, y: 28 }}
                  animate={prefersReduced ? undefined : { opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.08, ease: EASE }}
                >
                  {word}
                </motion.span>{' '}
              </Fragment>
            ))}
            <motion.span
              className="text-orange inline-block"
              initial={prefersReduced ? undefined : { opacity: 0, y: 28 }}
              animate={prefersReduced ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: words.length * 0.08, ease: EASE }}
            >
              {HERO.titleAccent}
            </motion.span>
          </h1>

          <p className="text-muted max-w-[520px] text-[19px] leading-[1.6]">{HERO.subtitle}</p>

          <ul className="flex flex-wrap items-center gap-[26px] pt-2">
            {HERO.badges.map((badge, index) => (
              <motion.li
                key={badge}
                initial={prefersReduced ? undefined : { opacity: 0, x: -12 }}
                animate={prefersReduced ? undefined : { opacity: 1, x: 0 }}
                transition={{ duration: 0.45, delay: 0.35 + index * 0.1, ease: EASE }}
              >
                <DotBadge>{badge}</DotBadge>
              </motion.li>
            ))}
          </ul>

          <div className="flex flex-wrap items-stretch gap-[14px] pt-4">
            <Button onClick={onRegister}>Inscribirse</Button>
            <ButtonLink href="#cronograma" variant="secondary">
              Ver Cronograma
            </ButtonLink>
          </div>
        </motion.div>

        <motion.div
          aria-hidden="true"
          style={prefersReduced ? undefined : { y: ballY, scale: ballScale }}
          className="flex w-[280px] shrink-0 items-center justify-center sm:w-[360px] lg:w-[440px]"
        >
          <motion.div
            initial={prefersReduced ? undefined : { opacity: 0, scale: 0.85 }}
            animate={prefersReduced ? undefined : { opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: EASE }}
            className="w-full"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={asset('/assets/basketball.svg')}
              alt=""
              width={410}
              height={410}
              className="h-auto w-full"
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
