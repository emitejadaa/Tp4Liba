/**
 * De un gesto a un tiro.
 *
 * El gesto se mide **desde la pelota hasta el dedo**, no desde donde se empezó a
 * arrastrar. La diferencia es toda: medido desde donde se apretó, el gesto tiene
 * un ancla invisible —dos dedos en el mismo lugar de la pantalla dan tiros
 * distintos según dónde arrancaron— y no hay nada que una la mano con una pelota
 * que está en la otra punta de la cancha. Medido desde la pelota no hay nada
 * escondido: el dedo **es** la puntería, se ve la banda que los une, y mover el
 * dedo dos centímetros cambia el tiro dos centímetros, se haya apretado donde se
 * haya apretado.
 *
 * Para dónde queda el dedo respecto de la pelota es el ángulo, y qué tan lejos
 * está es la fuerza. Por eso no hay dos controles: hay uno solo que da los dos
 * números, y por eso ningún tiro sale igual a otro.
 *
 * Es el gesto de tirar y no el de una gomera: el dedo va hacia donde uno quiere
 * que vaya la pelota, no para el lado contrario.
 */

/** Velocidad de salida del tiro más flojo que se puede tirar. */
export const MIN_SPEED = 520;

/** Y del más fuerte. Con éste la pelota se va bien por encima del tablero. */
export const MAX_SPEED = 1080;

/**
 * Zona muerta alrededor de la pelota, en unidades de cancha.
 *
 * Es el radio donde el gesto todavía no es un tiro. Es un poco más grande que la
 * pelota a propósito: así llevar el dedo de vuelta encima de la pelota es la
 * manera de arrepentirse, y es la que sale sola porque es el único punto de la
 * cancha que significa algo.
 */
export const DEAD_ZONE = 26;

/** Distancia a la pelota que da la potencia máxima. Más lejos no suma. */
export const MAX_PULL = 190;

/** Topes del ángulo, en grados sobre la horizontal. */
export const MIN_ANGLE = -8;
export const MAX_ANGLE = 90;

export type Aim = {
  /** Grados sobre la horizontal, hacia la derecha. */
  angle: number;
  /** De 0 a 1, entre `MIN_SPEED` y `MAX_SPEED`. */
  power: number;
};

/**
 * Puntería con la que arranca cada partida.
 *
 * Es un tiro que entra: son los números que salen de resolver el tiro limpio
 * desde el punto de lanzamiento hasta el centro del aro. Arrancar con un tiro
 * que entra es lo que hace que el primer tiro enseñe a jugar en vez de castigar
 * por no saber todavía —y es lo que le da sentido al botón «Tirar», que si no
 * sería un botón para errar.
 */
export const INITIAL_AIM: Aim = { angle: 63, power: 0.62 };

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/**
 * Convierte el tirón —el vector de la pelota al dedo— en una puntería.
 *
 * Devuelve `null` con el dedo dentro de la zona muerta: no hay tiro, y el que
 * llama lo trata como que no pasó nada.
 *
 * El eje Y viene como viene en pantalla, creciendo hacia abajo, así que tener el
 * dedo por encima de la pelota da `dy` negativo y el ángulo se calcula contra su
 * opuesto.
 */
export function aimFromPull(dx: number, dy: number): Aim | null {
  const length = Math.hypot(dx, dy);
  if (length < DEAD_ZONE) return null;

  const raw = (Math.atan2(-dy, dx) * 180) / Math.PI;

  return {
    angle: clamp(raw, MIN_ANGLE, MAX_ANGLE),
    power: clamp((length - DEAD_ZONE) / (MAX_PULL - DEAD_ZONE), 0, 1),
  };
}

/**
 * El camino inverso: dónde cae el tirón de una puntería, respecto de la pelota.
 *
 * Con esto se dibuja la banda, y se dibuja desde la puntería **ya recortada** y
 * no desde donde está el dedo. Es a propósito: cuando el dedo se va más lejos que
 * el tope o más atrás que la vertical, la banda se planta y muestra el tiro que
 * de verdad va a salir en vez de seguir al dedo hasta un tiro que no existe.
 */
export function pullFor({ angle, power }: Aim): { x: number; y: number } {
  const length = DEAD_ZONE + clamp(power, 0, 1) * (MAX_PULL - DEAD_ZONE);
  const radians = (angle * Math.PI) / 180;

  return { x: Math.cos(radians) * length, y: -Math.sin(radians) * length };
}

/** Velocidad de salida de una puntería. */
export function launchVelocity({ angle, power }: Aim): { vx: number; vy: number } {
  const speed = MIN_SPEED + clamp(power, 0, 1) * (MAX_SPEED - MIN_SPEED);
  const radians = (angle * Math.PI) / 180;

  return { vx: Math.cos(radians) * speed, vy: -Math.sin(radians) * speed };
}

/** Mantiene una puntería dentro de sus topes después de tocarla con el teclado. */
export function clampAim({ angle, power }: Aim): Aim {
  return { angle: clamp(angle, MIN_ANGLE, MAX_ANGLE), power: clamp(power, 0, 1) };
}

/**
 * Cómo se lee una puntería en voz alta.
 *
 * Es lo que oye quien juega con el teclado y un lector de pantalla, que no tiene
 * la guía punteada ni el medidor: sin esto, apuntar sería mover a ciegas dos
 * números que no se anuncian en ningún lado.
 */
export function describeAim({ angle, power }: Aim): string {
  return `Ángulo ${Math.round(angle)} grados, fuerza ${Math.round(power * 100)}%`;
}
