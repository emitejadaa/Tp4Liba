/**
 * La pelota del encabezado, resuelta como geometría y no como imagen.
 *
 * Las cuatro costuras de una pelota de ocho paneles son curvas sobre una esfera.
 * Acá se las calcula en 3D, se las gira y se las proyecta a coordenadas de SVG,
 * así que lo que se dibuja son trazos vectoriales: nítidos en cualquier pantalla
 * y a cualquier tamaño, sin lienzo, sin texturas y sin WebGL.
 *
 * Sirve para dibujar una pelota plana —un disco de color con las costuras
 * encima— sin renunciar a que las costuras se muevan como se mueven en una
 * pelota de verdad: barriendo la curvatura y desapareciendo por el borde en vez
 * de deslizarse sobre un círculo. Ese detalle es todo lo que separa «un dibujo
 * que gira» de «una pelota girando», y es la única cuenta que hace falta para
 * conseguirlo.
 *
 * Todo lo de este archivo son funciones puras: no tocan el DOM, no dependen de
 * React y se prueban con números.
 */

export type Axis = 'x' | 'y' | 'z';

export type Seam =
  /** Círculo máximo sobre un plano: `axis` es la normal del plano. */
  | { kind: 'great'; axis: Axis }
  /** Círculo menor a `polarAngle` radianes del semieje positivo `axis`. */
  | { kind: 'small'; axis: Axis; polarAngle: number };

/**
 * Las cuatro costuras de una pelota de ocho paneles.
 *
 * Mirándola de frente se ven tres líneas verticales y una horizontal: el círculo
 * máximo del ecuador da la horizontal, el del plano `x = 0` da la vertical del
 * medio, y los dos círculos menores —tomados **sobre el eje x**, el que apunta a
 * la derecha— dan los dos arcos que la abrazan por los costados.
 *
 * El eje importa: tomados sobre `z`, el que apunta a la cámara, los mismos dos
 * círculos se ven como un anillo concéntrico y la pelota deja de leerse como
 * pelota de básquet.
 */
export const SEAMS: readonly Seam[] = [
  { kind: 'great', axis: 'y' },
  { kind: 'great', axis: 'x' },
  { kind: 'small', axis: 'x', polarAngle: 0.98 },
  { kind: 'small', axis: 'x', polarAngle: Math.PI - 0.98 },
];

export type Vec3 = { x: number; y: number; z: number };

/**
 * Terna ortonormal de un eje: el eje y dos direcciones perpendiculares.
 *
 * Con ella, cualquier círculo alrededor del eje es una vuelta de seno y coseno
 * sobre las dos perpendiculares, sin tener que escribir tres casos distintos.
 */
function frame(axis: Axis): { a: Vec3; u: Vec3; v: Vec3 } {
  if (axis === 'x') {
    return { a: { x: 1, y: 0, z: 0 }, u: { x: 0, y: 1, z: 0 }, v: { x: 0, y: 0, z: 1 } };
  }
  if (axis === 'y') {
    return { a: { x: 0, y: 1, z: 0 }, u: { x: 0, y: 0, z: 1 }, v: { x: 1, y: 0, z: 0 } };
  }
  return { a: { x: 0, y: 0, z: 1 }, u: { x: 1, y: 0, z: 0 }, v: { x: 0, y: 1, z: 0 } };
}

/**
 * Punto de una costura, antes de girar.
 *
 * `t` recorre la vuelta entera, de 0 a 2π. Un círculo máximo es el caso
 * particular de un círculo menor con ángulo polar de 90°, pero se dejan los dos
 * nombres porque en una pelota son dos cosas distintas: la línea que la parte al
 * medio y el arco que abraza un panel.
 */
export function seamPointAt(seam: Seam, t: number): Vec3 {
  const { a, u, v } = frame(seam.axis);
  const polar = seam.kind === 'great' ? Math.PI / 2 : seam.polarAngle;
  const ring = Math.sin(polar);
  const along = Math.cos(polar);
  const cos = Math.cos(t);
  const sin = Math.sin(t);

  return {
    x: a.x * along + (u.x * cos + v.x * sin) * ring,
    y: a.y * along + (u.y * cos + v.y * sin) * ring,
    z: a.z * along + (u.z * cos + v.z * sin) * ring,
  };
}

/**
 * Gira un punto: primero sobre el eje vertical y después inclina la pelota.
 *
 * El orden no es indistinto. Girando primero, el eje de giro queda inclinado
 * junto con la pelota y el movimiento se lee como una pelota que gira apoyada en
 * su propio eje. Al revés, el eje quedaría siempre vertical y la pelota daría
 * vueltas como un globo terráqueo trabado.
 */
export function rotate(point: Vec3, spin: number, tilt: number): Vec3 {
  const cs = Math.cos(spin);
  const ss = Math.sin(spin);
  const x = point.x * cs + point.z * ss;
  const z = -point.x * ss + point.z * cs;

  const ct = Math.cos(tilt);
  const st = Math.sin(tilt);

  return { x, y: point.y * ct - z * st, z: point.y * st + z * ct };
}

/** Puntos de una costura ya girada, listos para proyectar. */
export function seamPoints(seam: Seam, spin: number, tilt: number, steps = 96): Vec3[] {
  const points: Vec3[] = [];
  for (let i = 0; i < steps; i++) {
    points.push(rotate(seamPointAt(seam, (i / steps) * Math.PI * 2), spin, tilt));
  }
  return points;
}

/**
 * Convierte los puntos girados en el trazado SVG de lo que se ve.
 *
 * La proyección es ortográfica —se descarta `z` y listo—, que para una esfera es
 * lo correcto: su silueta es exactamente la circunferencia de radio 1, así que el
 * contorno del cuerpo y las costuras cierran sin corregir nada. Con perspectiva,
 * la silueta sería un círculo más chico que el ecuador y las costuras se saldrían
 * del cuerpo.
 *
 * `y` se invierte porque en SVG crece hacia abajo.
 *
 * Sólo sale el tramo que mira a la cámara: el cuerpo es opaco, así que la mitad
 * de atrás de cada costura está tapada por la pelota misma. El recorrido se corta
 * donde la curva cruza al otro lado; cada tramo visible sale como un subtrazado
 * propio, con su `M`. Unidos, la línea cruzaría la pelota de lado a lado por el
 * medio.
 */
export function seamPath(points: readonly Vec3[], decimals = 3): string {
  if (points.length === 0) return '';

  const round = (value: number) => Number(value.toFixed(decimals));
  const facing = (point: Vec3) => point.z >= 0;
  const toPath = (run: readonly Vec3[]) =>
    run.map((p, i) => `${i === 0 ? 'M' : 'L'}${round(p.x)} ${round(-p.y)}`).join(' ');

  const runs: string[] = [];

  // Se arranca en el primer punto que entra a la cara visible viniendo de la de
  // atrás, así ningún tramo queda partido por el borde del array.
  let start = -1;
  for (let i = 0; i < points.length; i++) {
    const previous = points[(i - 1 + points.length) % points.length]!;
    if (facing(points[i]!) && !facing(previous)) {
      start = i;
      break;
    }
  }

  // Sin cruces, o la costura se ve entera o no se ve nada.
  if (start === -1) {
    if (!facing(points[0]!)) return '';
    return `${toPath(points)} Z`;
  }

  let current: Vec3[] = [];
  for (let step = 0; step < points.length; step++) {
    const index = (start + step) % points.length;
    const point = points[index]!;
    const previous = points[(index - 1 + points.length) % points.length]!;

    if (facing(point)) {
      if (current.length === 0) current.push(silhouetteCrossing(previous, point));
      current.push(point);
    } else if (current.length > 0) {
      current.push(silhouetteCrossing(previous, point));
      runs.push(toPath(current));
      current = [];
    }
  }
  if (current.length > 1) runs.push(toPath(current));

  return runs.join(' ');
}

/**
 * El punto exacto donde la costura cruza el borde de la esfera, entre dos puntos
 * muestreados que cayeron uno de cada lado.
 *
 * Sin esto la costura termina en el último punto muestreado, que está un poco
 * antes del borde: queda un diente de un par de píxeles en la silueta, y como el
 * muestreo es fijo y la pelota gira, el diente aparece y desaparece. Con noventa
 * y seis puntos por costura es chico, pero es de esas cosas que no se sabe qué
 * son y se notan igual.
 *
 * Se interpola sobre la cuerda y después se normaliza: sobre la silueta vale
 * `z = 0`, así que el punto tiene que caer exactamente sobre la circunferencia
 * de radio 1, y la cuerda pasa un poco por dentro.
 */
function silhouetteCrossing(a: Vec3, b: Vec3): Vec3 {
  const span = a.z - b.z;
  const t = span === 0 ? 0 : a.z / span;
  const x = a.x + (b.x - a.x) * t;
  const y = a.y + (b.y - a.y) * t;
  const length = Math.hypot(x, y) || 1;

  return { x: x / length, y: y / length, z: 0 };
}

/** Los trazados visibles de las cuatro costuras para un giro dado. */
export function ballPaths(spin: number, tilt: number, steps = 96): string[] {
  return SEAMS.map((seam) => seamPath(seamPoints(seam, spin, tilt, steps)));
}
