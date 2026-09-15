/**
 * El vocabulario de movimiento, en un solo lugar.
 *
 * La landing anima con tres motores distintos —Motion para lo atado a React,
 * anime.js para las coreografías imperativas y el motor de scroll-craft para los
 * dispositivos de scroll— y cada uno expresa las curvas a su manera. Si cada
 * archivo escribe su propio bézier, tres cosas que arrancan juntas terminan
 * desfasadas por un dígito, que es exactamente el tipo de error que nadie ve
 * pero todos sienten.
 *
 * Así que la curva se define una vez y se exporta en los tres dialectos.
 */

/** La curva de la casa: sale rápido y frena largo. */
export const EASE = [0.22, 1, 0.36, 1] as const;

/** La misma curva, como la escribe CSS. Es `--sc-ease-out` en `globals.css`. */
export const EASE_CSS = `cubic-bezier(${EASE.join(', ')})`;

/**
 * Duraciones, en milisegundos.
 *
 * `quick` y `base` son las mismas que `--duration-quick` y `--duration-base` del
 * CSS; `entrance` es lo que tarda una pieza en entrar al viewport.
 */
export const DURATION = {
  quick: 180,
  base: 320,
  entrance: 620,
  curtain: 520,
} as const;

/**
 * Resorte compartido por los efectos de puntero.
 *
 * Con esta rigidez la tarjeta llega al ángulo en unos 200 ms y no rebota: un
 * rebote acá se lee como que la tarjeta está flotando suelta en vez de
 * respondiendo a la mano.
 */
export const POINTER_SPRING = { type: 'spring', stiffness: 260, damping: 26, mass: 0.5 } as const;

/**
 * Tasas de parallax de los planos decorativos, para `data-sc-parallax`.
 *
 * El motor traduce la tasa a `rate * (p - 0.5) * 100` píxeles, así que 1 es un
 * recorrido de 100 px a lo largo de toda la vida en pantalla de la sección.
 *
 * Lo que arma la perspectiva no son los valores en sí sino el **signo y el
 * orden**: el fondo se mueve en contra del scroll y poco, el plano medio un
 * poco más, y el de adelante acompaña. Tres capas alcanzan; con más, el ojo
 * deja de leer profundidad y empieza a leer ruido.
 */
export const PLANE_RATE = {
  back: -0.55,
  mid: -1.1,
  front: 0.7,
} as const;
