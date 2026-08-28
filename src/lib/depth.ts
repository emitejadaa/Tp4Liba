/**
 * Curvas de la profundidad 3D atada al scroll.
 *
 * Están acá, como funciones puras, por lo mismo que la física de la pelota: se
 * prueban sin montar nada y el hook queda reducido a conectarlas al scroll.
 *
 * La idea es una sola: cada sección llega desde el fondo, se planta de frente
 * cuando está a la vista y vuelve a irse al fondo al salir. Lo que evita que
 * sea mareador es la **meseta**: en la franja central del recorrido no se mueve
 * nada. Sin ella una sección más alta que la pantalla pasa casi todo el tiempo
 * inclinada, y leerla se vuelve incómodo.
 */

/** Cuánto del recorrido, de 0 a 1, queda quieto en el centro. */
export const PLATEAU = 0.42;

export type DepthOptions = {
  /** Grados de inclinación en el extremo del recorrido. */
  rotate: number;
  /** Píxeles que se aleja de la cámara en el extremo. */
  depth: number;
};

export const DEFAULT_DEPTH: DepthOptions = { rotate: 4.5, depth: 130 };

/**
 * Posición dentro del recorrido, de -1 (entrando por abajo) a 1 (saliendo por
 * arriba), con la meseta ya descontada.
 */
export function travelAt(progress: number, plateau = PLATEAU): number {
  const clamped = Math.max(0, Math.min(1, progress));
  // De 0..1 a -1..1: 0 es el borde de abajo de la pantalla y 1 el de arriba.
  const signed = clamped * 2 - 1;
  const direction = Math.sign(signed);
  const beyond = Math.max(0, Math.abs(signed) - plateau);

  return direction * (beyond / (1 - plateau));
}

/**
 * Grados de inclinación en X para un progreso dado.
 *
 * Entrando por abajo se ve desde arriba —la sección está acostada hacia atrás—
 * y saliendo por arriba, al revés. En el medio queda derecha.
 */
export function tiltAt(progress: number, rotate = DEFAULT_DEPTH.rotate): number {
  return -travelAt(progress) * rotate;
}

/**
 * Desplazamiento en Z, siempre negativo: la sección nunca se acerca más que su
 * posición de reposo, sólo se aleja hacia los extremos.
 *
 * Va al cuadrado para que salga y entre suave en lugar de con un pico en el
 * medio del recorrido.
 */
export function pushAt(progress: number, depth = DEFAULT_DEPTH.depth): number {
  const travel = travelAt(progress);
  return -travel * travel * depth;
}
