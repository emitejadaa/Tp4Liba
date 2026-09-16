/**
 * El recorrido de la pelota a lo largo de la página.
 *
 * La landing es una sola página larga, y sin algo que la atraviese se lee como
 * una pila de bloques: se termina uno, empieza el siguiente. La pelota es lo que
 * la cose. Sale del encabezado, cruza de un costado al otro mientras se baja y
 * queda abajo de todo al final, así que en cualquier punto del scroll hay un
 * objeto que se acuerda de dónde venía.
 *
 * Lo importante es que **no está pegada al documento**: vive fija respecto de la
 * pantalla y se mueve sobre ella. Es lo que da la sensación de que las cosas se
 * mueven delante de quien mira, y no de que quien mira baja por encima de cosas
 * quietas.
 *
 * El recorrido son puntos de paso y se interpola entre ellos. Está acá, como
 * funciones puras, para poder cambiarlo y probarlo sin montar la página.
 */

export type FlightPoint = {
  /** Avance de la página en el que la pelota pasa por acá, de 0 a 1. */
  at: number;
  /** Centro de la pelota, en porcentaje del ancho y del alto de la pantalla. */
  x: number;
  y: number;
  /** Diámetro, en porcentaje del lado más corto de la pantalla. */
  size: number;
  opacity: number;
};

/**
 * Los puntos de paso.
 *
 * Tres cosas los gobiernan. El recorrido es un rectángulo: se baja pegada a un
 * costado, se cruza por abajo, se sube pegada al otro y se cruza por arriba. Los
 * cruces de lado a lado nunca pasan a media altura porque el medio de la pantalla
 * es donde está el texto; un cruce en diagonal arrastra la pelota por encima de
 * un párrafo entero. Varios puntos tienen el centro
 * fuera de cuadro, porque una pelota entera flotando se lee como una calcomanía
 * y una pelota cortada por el borde se lee como un objeto grande que está
 * pasando. Y arranca transparente: en el encabezado la pelota de verdad es la
 * del encabezado, y ésta recién aparece cuando aquella se está yendo, así que se
 * leen como una sola.
 */
export const FLIGHT: readonly FlightPoint[] = [
  { at: 0, x: 78, y: 40, size: 30, opacity: 0 },
  { at: 0.1, x: 92, y: 60, size: 34, opacity: 0.55 },
  { at: 0.26, x: 96, y: 84, size: 36, opacity: 0.5 },
  { at: 0.42, x: 6, y: 88, size: 38, opacity: 0.5 },
  { at: 0.6, x: 2, y: 22, size: 32, opacity: 0.5 },
  { at: 0.8, x: 98, y: 16, size: 30, opacity: 0.5 },
  { at: 1, x: 70, y: 104, size: 36, opacity: 0.55 },
];

/** Vueltas que da la pelota a lo largo de toda la página. */
export const FLIGHT_TURNS = 1.15;

/**
 * Suavizado entre dos puntos de paso.
 *
 * Con interpolación lineal la pelota cambiaría de dirección de golpe en cada
 * punto: se vería el quiebre, como un objeto tironeado por una soga. Con esta
 * curva llega a cada punto frenando y sale acelerando, que es como se mueve algo
 * que tiene peso.
 */
function smooth(t: number): number {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
}

export type FlightState = {
  x: number;
  y: number;
  size: number;
  opacity: number;
  /** Giro acumulado, en radianes. */
  spin: number;
};

/** Dónde está la pelota para un avance de página dado. */
export function flightAt(progress: number, path: readonly FlightPoint[] = FLIGHT): FlightState {
  const clamped = Math.max(0, Math.min(1, progress));
  const spin = clamped * FLIGHT_TURNS * Math.PI * 2;

  const first = path[0]!;
  const last = path[path.length - 1]!;
  if (clamped <= first.at) return { ...pointState(first), spin };
  if (clamped >= last.at) return { ...pointState(last), spin };

  for (let i = 1; i < path.length; i++) {
    const to = path[i]!;
    if (clamped > to.at) continue;

    const from = path[i - 1]!;
    const span = to.at - from.at;
    const t = smooth(span === 0 ? 1 : (clamped - from.at) / span);

    return {
      x: from.x + (to.x - from.x) * t,
      y: from.y + (to.y - from.y) * t,
      size: from.size + (to.size - from.size) * t,
      opacity: from.opacity + (to.opacity - from.opacity) * t,
      spin,
    };
  }

  return { ...pointState(last), spin };
}

function pointState({ x, y, size, opacity }: FlightPoint) {
  return { x, y, size, opacity };
}
