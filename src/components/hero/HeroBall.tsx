'use client';

import { useSyncExternalStore } from 'react';
import dynamic from 'next/dynamic';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { BallPresetId } from '@/lib/basketball-texture';
import { asset } from '@/lib/site';

/*
 * Three.js pesa bastante más que el resto de la página junta, así que no viaja
 * en la carga inicial: la pelota se pinta primero como SVG —el mismo dibujo que
 * venía del diseño— y el lienzo 3D la reemplaza cuando terminó de bajar. Así el
 * encabezado se ve completo desde el primer cuadro y no hay salto de layout,
 * porque los dos ocupan exactamente el mismo espacio.
 */
const Basketball3D = dynamic(() => import('./Basketball3D'), { ssr: false });

/**
 * Variante de material de la pelota.
 *
 * Se construyeron tres —`cuero`, `nocturno` y `estilizado`, definidas en
 * `basketball-texture.ts`— y quedó ésta: superficie limpia, granulado apenas
 * insinuado y un brillo concentrado que se corre al girarla. Es la más gráfica
 * de las tres, en línea con el resto de la landing, que también es de formas
 * planas y contraste alto antes que de texturas.
 *
 * Cambiar de variante es cambiar esta constante; el resto del componente no la
 * conoce.
 */
const PRESET: BallPresetId = 'estilizado';

/**
 * Fuente del progreso de scroll. Se pasa como objeto con `get()` en vez de como
 * número para que el lienzo 3D lo lea dentro de su propio bucle: un número
 * obligaría a re-renderizar React en cada cuadro de scroll.
 */
export type ScrollSource = { get: () => number };

/**
 * `true` si el navegador puede dibujar WebGL.
 *
 * El resultado se cachea: crear un contexto WebGL sólo para preguntar no es
 * gratis, y la respuesta no cambia durante la vida de la pestaña.
 */
let webGLSupport: boolean | null = null;

function supportsWebGL(): boolean {
  if (webGLSupport !== null) return webGLSupport;
  try {
    const canvas = document.createElement('canvas');
    webGLSupport = Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    webGLSupport = false;
  }
  return webGLSupport;
}

/** Nunca cambia, así que no hace falta suscribirse a nada. */
function subscribeToNothing() {
  return () => {};
}

/** La pelota plana del diseño, que sirve de base y de plan B. */
function FlatBall() {
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={asset('/assets/basketball.svg')}
      alt=""
      width={410}
      height={410}
      className="h-auto w-full"
    />
  );
}

/**
 * Pelota del encabezado.
 *
 * Devuelve la versión 3D arrastrable cuando el navegador puede con ella, y la
 * ilustración plana cuando no: sin WebGL, o con `prefers-reduced-motion`, donde
 * una pelota girando sola sería justo lo que la persona pidió no ver.
 */
export function HeroBall({ scroll }: { scroll?: ScrollSource }) {
  const prefersReduced = useReducedMotion();
  // En el servidor no hay WebGL, así que el HTML sale siempre con la pelota
  // plana y el 3D entra al hidratar: nunca hay diferencia de hidratación.
  const canRender3D = useSyncExternalStore(subscribeToNothing, supportsWebGL, () => false);

  if (prefersReduced || !canRender3D) {
    return (
      <div className="relative aspect-square w-full">
        <FlatBall />
      </div>
    );
  }

  return (
    <div className="relative aspect-square w-full" data-testid="hero-ball-3d">
      <Basketball3D scroll={scroll} preset={PRESET} />
      <p className="text-dim pointer-events-none absolute inset-x-0 -bottom-1 text-center text-xs tracking-[0.12em] uppercase opacity-70">
        Arrástrala
      </p>
    </div>
  );
}
