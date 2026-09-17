'use client';

import type { Ref } from 'react';
import { motion } from 'motion/react';
import { BALL_RADIUS, BOARD, FLOOR_Y, POST, RIM, RIM_CENTER } from '@/lib/minigame/court';

/**
 * El aro, visto de costado.
 *
 * Antes se veía de frente. Se dio vuelta cuando el juego pasó a tener física de
 * verdad, porque de frente el tablero queda **detrás** del aro —en una
 * profundidad que dos dimensiones no tienen— y ahí hay que elegir entre ponerlo
 * en el camino de la pelota, donde tapa todos los tiros buenos, o no ponerlo y
 * que la pelota lo atraviese dibujado. De costado los tres cuerpos están en el
 * mismo plano que la pelota y cada rebote es el que se ve.
 *
 * De paso se gana lo que más importa en un juego de tirar: se ve el arco. De
 * frente, un tiro corto y uno largo se dibujan casi igual.
 *
 * La geometría sale entera de `lib/minigame/court.ts`, que es la misma que lee
 * el simulador. Tenerla en un solo lugar es lo que evita el peor error posible
 * acá, que es que la pelota pase por al lado del aro dibujado y cuente.
 */

/** Ancho del trazo del aro. Los nodos de choque son medio trazo. */
const RIM_STROKE = RIM.nodeRadius * 2;

type HoopProps = {
  /** Sacude la red cuando entra la pelota. */
  swish: boolean;
  /** Cambia en cada tiro, para reiniciar la animación de la red. */
  shotId: number;
  reducedMotion: boolean;
  /**
   * El grupo que sube y baja cuando el aro está móvil.
   *
   * Lo mueve el bucle de la cancha escribiéndole la transformación, no React:
   * es una posición que cambia sesenta veces por segundo y no tiene por qué
   * pasar por un re-render.
   */
  moveRef?: Ref<SVGGElement>;
};

export function Hoop({ swish, shotId, reducedMotion, moveRef }: HoopProps) {
  return (
    <g aria-hidden="true">
      {/*
        El poste va afuera del grupo que se mueve: está clavado en el piso y el
        tablero se desliza sobre él, como en un aro regulable de verdad.
      */}
      <path
        d={`M${(POST.left + POST.right) / 2} ${POST.top}V${POST.bottom}`}
        stroke="#334155"
        strokeWidth={POST.right - POST.left}
      />

      <g ref={moveRef} data-testid="aro" style={{ willChange: 'transform' }}>
        {/* El brazo que cuelga el tablero del poste. */}
        <path
          d={`M${BOARD.right} 46H${(POST.left + POST.right) / 2}`}
          stroke="#334155"
          strokeWidth={5}
        />

        {/* El tablero, de canto. */}
        <rect
          x={BOARD.left}
          y={BOARD.top}
          width={BOARD.right - BOARD.left}
          height={BOARD.bottom - BOARD.top}
          fill="#0A1524"
          stroke="#CBD5E1"
          strokeWidth={3}
        />

        {/* El recuadro de tiro, que de canto es la franja naranja de la cara. */}
        <path d={`M${BOARD.left} 40V78`} stroke="#F97316" strokeWidth={3} />

        {/*
        La red va antes que el aro para que el aro le pase por encima: de costado
        la red cuelga por detrás del anillo, y dibujada al revés se ve pegada por
        delante.
      */}
        <motion.g
          key={shotId}
          opacity={0.65}
          style={{ transformBox: 'view-box', transformOrigin: `${RIM_CENTER.x}px ${RIM.y}px` }}
          animate={
            swish && !reducedMotion
              ? { scaleY: [1, 1.35, 0.9, 1.12, 1], scaleX: [1, 0.88, 1.05, 0.97, 1] }
              : undefined
          }
          transition={{ duration: 0.55, ease: 'easeOut' }}
        >
          <path
            d={`M${RIM.front} ${RIM.y}L${RIM.front + 12} ${RIM.y + 30}H${RIM.back - 12}L${RIM.back} ${RIM.y}
             M${RIM.front + 13} ${RIM.y}L${RIM.front + 18} ${RIM.y + 30}
             M${RIM_CENTER.x} ${RIM.y}V${RIM.y + 30}
             M${RIM.back - 13} ${RIM.y}L${RIM.back - 18} ${RIM.y + 30}
             M${RIM.front + 5} ${RIM.y + 13}H${RIM.back - 5}`}
            stroke="#CBD5E1"
            strokeWidth={1.6}
            fill="none"
          />
        </motion.g>

        {/* El aro: la barra que va del frente al tablero. */}
        <path
          d={`M${RIM.front} ${RIM.y}H${RIM.back}`}
          stroke="#F97316"
          strokeWidth={RIM_STROKE}
          strokeLinecap="round"
        />
      </g>

      {/* El piso, apenas marcado: da de qué agarrarse para leer la altura. */}
      <path d={`M0 ${FLOOR_Y}H460`} stroke="#1E293B" strokeWidth={2} />
    </g>
  );
}

/**
 * La pelota del juego.
 *
 * Es la misma familia que la del encabezado —disco naranja, costuras en tinta—
 * pero dibujada y no calculada: acá gira sobre sí misma en dos dimensiones, que
 * es lo que hace una pelota que vuela de costado, así que no hay curvatura que
 * proyectar.
 *
 * Va centrada en el origen a propósito: la posiciona el simulador escribiéndole
 * una transformación, y un dibujo centrado se traslada a su centro sin tener que
 * restarle medio radio en cada cuadro.
 */
export function Ball() {
  const r = BALL_RADIUS;
  const seam = r * 0.0453;

  return (
    <g aria-hidden="true">
      <circle r={r} fill="#E9741D" />
      <g stroke="#431504" strokeWidth={seam * 2.1} fill="none">
        <circle r={r} />
        <path
          d={`M${-r} 0H${r}M0 ${-r}V${r}
             M${-r * 0.684} ${-r * 0.737}C${-r * 0.368} ${-r * 0.316} ${-r * 0.368} ${r * 0.316} ${-r * 0.684} ${r * 0.737}
             M${r * 0.684} ${-r * 0.737}C${r * 0.368} ${-r * 0.316} ${r * 0.368} ${r * 0.316} ${r * 0.684} ${r * 0.737}`}
        />
      </g>
    </g>
  );
}
