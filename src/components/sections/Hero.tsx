'use client';

import { useRef } from 'react';
import { motion, useScroll, useSpring, useTransform } from 'motion/react';
import { HeroBall } from '@/components/hero/HeroBall';
import { DotBadge } from '@/components/ui/Badge';
import { Button, ButtonLink } from '@/components/ui/Button';
import { ChalkLines } from '@/components/ui/ChalkLines';
import { KineticWords } from '@/components/ui/KineticWords';
import { HERO } from '@/data/hero';
import { EASE } from '@/lib/anim/tokens';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/**
 * Encabezado de la landing.
 *
 * Son tres planos a distinta distancia de la cámara y ninguno se mueve igual que
 * los otros: las líneas de cancha se hunden hacia atrás, el texto se adelanta y
 * se acuesta al salir, y la pelota cruza la pantalla rodando hacia afuera. Esa
 * diferencia —de velocidad y de profundidad— es lo que hace que el encabezado se
 * lea como un espacio y no como una imagen que sube.
 *
 * Con `prefers-reduced-motion` todo queda quieto y en su posición final.
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
  /*
   * La pelota se corre apenas mientras se scrollea: baja un poco y se va para la
   * izquierda, como si rodara fuera de cuadro.
   *
   * Poco, y sin agrandarse. Antes bajaba 220 px y crecía a 1,35: a media pantalla
   * de scroll quedaba enorme, la sección la cortaba al ras por el borde de abajo
   * y el resto se le metía atrás del nav. El recorrido corto alcanza para que el
   * plano se despegue del texto, que es lo único que el parallax tiene que hacer.
   */
  const ballY = useTransform(smooth, [0, 1], [0, 90]);
  const ballX = useTransform(smooth, [0, 1], [0, -40]);
  // El lienzo 3D lee este valor dentro de su propio bucle de render, así el
  // scroll no dispara un re-render de React por cuadro.
  const ballProgress = smooth;
  const courtY = useTransform(smooth, [0, 1], [0, 60]);
  const courtRotate = useTransform(smooth, [0, 1], [0, 6]);
  const textY = useTransform(smooth, [0, 1], [0, -30]);
  const textFade = useTransform(smooth, [0, 0.75], [1, 0.25]);

  /*
   * Las tres capas se separan además en profundidad, no sólo en velocidad: las
   * líneas de cancha se hunden hacia atrás y el texto se adelanta. Es lo que
   * convierte el parallax en volumen, porque los planos dejan de estar todos a
   * la misma distancia.
   */
  const courtDepth = useTransform(smooth, [0, 1], [-120, -320]);
  const textDepth = useTransform(smooth, [0, 1], [0, 90]);
  /*
   * Y al irse, el bloque de texto se acuesta hacia atrás. Es el mismo gesto con
   * el que después entra cada sección, así que el encabezado no es una excepción
   * dentro de la página: es la primera vez que se ve la regla.
   */
  const textTilt = useTransform(smooth, [0, 1], [0, -9]);

  return (
    <section
      id="inicio"
      ref={sectionRef}
      data-sc-act="flow"
      data-sc-drift="#07111f"
      className="border-line relative isolate overflow-hidden border-b pt-[clamp(5.5rem,16svh,8rem)] pb-[clamp(3rem,10svh,5rem)] lg:pt-[clamp(6rem,18svh,10rem)] lg:pb-[clamp(4rem,12svh,6.5rem)]"
    >
      {/* Líneas de cancha del diseño: decorativas, no se anuncian al lector de pantalla. */}
      <motion.div
        aria-hidden="true"
        style={
          prefersReduced
            ? undefined
            : { y: courtY, rotate: courtRotate, z: courtDepth, transformPerspective: 1200 }
        }
        className="text-soft pointer-events-none absolute -top-16 -right-40 z-0 hidden w-[1100px] opacity-[0.14] md:block"
      >
        <ChalkLines />
      </motion.div>

      <div className="layout-container relative z-10 flex flex-col items-center gap-10 lg:flex-row lg:gap-[60px]">
        <motion.div
          style={
            prefersReduced
              ? undefined
              : {
                  y: textY,
                  opacity: textFade,
                  z: textDepth,
                  rotateX: textTilt,
                  transformPerspective: 1200,
                }
          }
          className="flex min-w-0 flex-1 flex-col items-start gap-[21px]"
        >
          <h1 className="text-[clamp(3rem,min(8vw,16svh),6rem)] leading-[0.95] font-bold tracking-[-0.01em]">
            <KineticWords accent={HERO.titleAccent} accentClassName="text-orange">
              {HERO.titleLead}
            </KineticWords>
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
          style={prefersReduced ? undefined : { y: ballY, x: ballX }}
          className="relative flex w-full max-w-[280px] shrink-0 items-center justify-center sm:max-w-[340px] lg:w-[380px] lg:max-w-none"
        >
          <motion.div
            initial={prefersReduced ? undefined : { opacity: 0, scale: 0.85 }}
            animate={prefersReduced ? undefined : { opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: EASE }}
            className="w-full"
          >
            <HeroBall scroll={ballProgress} />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
