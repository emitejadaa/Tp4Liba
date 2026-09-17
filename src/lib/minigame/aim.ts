/**
 * De un arrastre a un tiro.
 *
 * El gesto es el de tirar, no el de una gomera: se arrastra **hacia donde se
 * quiere que vaya la pelota**. Es la convención de todos los juegos de básquet
 * de teléfono y la que sale sola la primera vez, porque el dedo hace el mismo
 * recorrido que va a hacer la pelota. La de gomera —tirar para atrás y soltar—
 * es la de otro género y acá se lee al revés.
 *
 * El arrastre lleva las dos cosas que definen un tiro a la vez: para dónde
 * apunta el dedo es el ángulo, y cuánto se arrastró es la fuerza. Por eso no hay
 * dos controles: hay uno solo que da los dos números, y por eso ningún tiro sale
 * igual a otro.
 */

/** Velocidad de salida del tiro más flojo que se puede tirar. */
export const MIN_SPEED = 520;

/** Y del más fuerte. Con éste la pelota se va bien por encima del tablero. */
export const MAX_SPEED = 1080;

/**
 * Arrastre mínimo para que cuente como tiro, en unidades de cancha.
 *
 * Por debajo es un toque y no un arrastre. Sin este piso, cualquier tap sobre la
 * cancha —o el temblor de un dedo al apoyarlo— saldría como un tiro flojísimo, y
 * un tiro que nadie quiso tirar igual corta la racha.
 */
export const MIN_DRAG = 14;

/** Arrastre que da la potencia máxima. Más largo no suma. */
export const MAX_DRAG = 190;

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
 * Convierte un arrastre en una puntería.
 *
 * Devuelve `null` cuando el arrastre fue demasiado corto para ser un tiro: el
 * que llama lo trata como que no pasó nada, así que apoyar el dedo y levantarlo
 * sin mover cancela en vez de tirar.
 *
 * El eje Y del arrastre viene como viene en pantalla, creciendo hacia abajo, así
 * que arrastrar hacia arriba da `dy` negativo y el ángulo se calcula contra su
 * opuesto.
 */
export function aimFromDrag(dx: number, dy: number): Aim | null {
  const length = Math.hypot(dx, dy);
  if (length < MIN_DRAG) return null;

  const raw = (Math.atan2(-dy, dx) * 180) / Math.PI;

  return {
    angle: clamp(raw, MIN_ANGLE, MAX_ANGLE),
    power: clamp((length - MIN_DRAG) / (MAX_DRAG - MIN_DRAG), 0, 1),
  };
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
