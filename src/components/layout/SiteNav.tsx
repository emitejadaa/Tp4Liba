'use client';

import { useEffect, useState } from 'react';
import { motion, useScroll, useSpring, useTransform } from 'motion/react';
import { LibaMark } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { NAV_LINKS } from '@/data/navigation';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useScrollSpy } from '@/hooks/useScrollSpy';
import { cn } from '@/lib/cn';
import { SITE } from '@/lib/site';

const SPY_IDS = NAV_LINKS.map((link) => link.id);

/**
 * Barra de navegación fija.
 *
 * Se compacta al scrollear y marca en naranja el link de la sección que se está
 * viendo. En pantallas chicas los links se pliegan en un panel desplegable.
 */
export function SiteNav({ onRegister }: { onRegister?: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const activeId = useScrollSpy(SPY_IDS);
  const prefersReduced = useReducedMotion();

  /*
   * El isotipo se va girando sobre su eje vertical a medida que avanza la
   * página: es un indicador de cuánto se leyó, igual que la barra del tope, pero
   * en el objeto de la marca.
   *
   * El giro llega hasta 42 grados y no da la vuelta entera a propósito. El
   * isotipo es un dibujo plano: al pasar por los 90 grados se ve de canto y
   * desaparece, y como el scroll puede quedar frenado justo ahí, el logo del
   * sitio se esfumaba. Acotado, gira lo suficiente para leerse en 3D y nunca
   * deja de verse.
   *
   * Va por `useScroll` de Motion y no por `useScrollProgress`, que hace un
   * `setState`: acá el valor se escribe directo en el estilo y no re-renderiza
   * el nav sesenta veces por segundo.
   */
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 70, damping: 22, mass: 0.4 });
  const markSpin = useTransform(smoothProgress, [0, 1], [0, 42]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // El panel mobile no debe quedar abierto al pasar a desktop.
  useEffect(() => {
    if (!menuOpen) return;
    const onResize = () => {
      if (window.innerWidth >= 1024) setMenuOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [menuOpen]);

  return (
    <header
      data-scrolled={scrolled}
      className={cn(
        'border-line-card fixed inset-x-0 top-0 z-50 border-b backdrop-blur-[7px]',
        'bg-[rgb(7_17_31/0.88)] transition-[padding,background-color] duration-300',
        scrolled ? 'py-2' : 'py-[18px]',
      )}
    >
      <nav
        aria-label="Navegación principal"
        className="layout-container flex items-center justify-between"
      >
        <a
          href="#inicio"
          className="group flex items-center gap-3"
          aria-label={`${SITE.name}, ir al inicio`}
        >
          {/*
            El giro del scroll va en un contenedor y el del hover en el propio
            isotipo: son dos transformaciones distintas sobre el mismo elemento,
            y anidándolas se componen en vez de pisarse.
          */}
          <motion.span
            className="inline-flex"
            style={prefersReduced ? undefined : { rotateY: markSpin, transformPerspective: 420 }}
          >
            <LibaMark
              className={cn(
                'size-[30px] transition-transform duration-500',
                !prefersReduced && 'group-hover:rotate-180',
              )}
            />
          </motion.span>
          <span className="font-display text-chalk text-[28px] leading-none font-bold tracking-[0.06em]">
            {SITE.name}
          </span>
        </a>

        <div className="hidden items-center gap-[34px] lg:flex">
          {NAV_LINKS.map((link) => {
            const isActive = activeId === link.id;
            return (
              <a
                key={link.id}
                href={`#${link.id}`}
                aria-current={isActive ? 'true' : undefined}
                className={cn(
                  'group relative py-1 text-[15px] font-semibold tracking-[0.04em] uppercase transition-colors',
                  isActive ? 'text-orange' : 'text-soft hover:text-chalk',
                )}
              >
                {link.label}
                {isActive ? (
                  <motion.span
                    layoutId={prefersReduced ? undefined : 'nav-active'}
                    className="bg-orange absolute -bottom-0.5 left-0 h-0.5 w-full"
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  />
                ) : (
                  <span className="bg-orange absolute -bottom-0.5 left-0 h-0.5 w-0 transition-[width] duration-300 group-hover:w-full" />
                )}
              </a>
            );
          })}
          <Button size="sm" onClick={onRegister}>
            Inscribirse
          </Button>
        </div>

        <button
          type="button"
          className="text-soft hover:text-orange -mr-2 p-2 transition-colors lg:hidden"
          aria-expanded={menuOpen}
          aria-controls="nav-mobile"
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d={menuOpen ? 'M5 5L19 19M19 5L5 19' : 'M3 6H21M3 12H21M3 18H21'}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </nav>

      <div
        id="nav-mobile"
        hidden={!menuOpen}
        className="layout-container border-line mt-3 flex flex-col gap-1 border-t pt-3 lg:hidden"
      >
        {NAV_LINKS.map((link) => (
          <a
            key={link.id}
            href={`#${link.id}`}
            onClick={() => setMenuOpen(false)}
            className={cn(
              'rounded-chip px-2 py-3 text-[15px] font-semibold tracking-[0.04em] uppercase transition-colors',
              activeId === link.id ? 'text-orange' : 'text-soft hover:text-chalk',
            )}
          >
            {link.label}
          </a>
        ))}
        <Button
          size="sm"
          className="mt-2 w-full"
          onClick={() => {
            setMenuOpen(false);
            onRegister?.();
          }}
        >
          Inscribirse
        </Button>
      </div>
    </header>
  );
}
