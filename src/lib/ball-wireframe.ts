/**
 * La pelota del encabezado, resuelta como geometría y no como imagen.
 *
 * Las cuatro costuras de una pelota de ocho paneles son curvas sobre una esfera.
 * Acá se las calcula en 3D, se las gira y se las proyecta a coordenadas de SVG,
 * así que lo que se dibuja son trazos vectoriales: nítidos en cualquier pantalla
 * y a cualquier tamaño, sin lienzo, sin texturas y sin WebGL.
 *
 * Es la diferencia con la versión anterior, que era una esfera de Three.js con
 * mapa de color y matcap. Aquella se veía como una foto de una pelota —que es lo
 * que se le pidió que no fuera— y además llegaba a pantalla ya rasterizada, con
 * el borde lavado. Una pelota dibujada con líneas habla el mismo idioma que los
 * íconos y las marcas de cancha del resto de la página.
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

/** Trazados SVG de una costura: el tramo de este lado y el del otro. */
export type SeamPaths = {
  /** Lo que mira a la cámara. */
  front: string;
  /** Lo que pasa por detrás, que se dibuja apenas insinuado. */
  back: string;
};

/**
 * Convierte los puntos girados en dos trazados de SVG.
 *
 * La proyección es ortográfica —se descarta `z` y listo—, que para una esfera es
 * lo correcto: su silueta es exactamente la circunferencia de radio 1, así que el
 * contorno dibujado y las costuras cierran sin corregir nada. Con perspectiva, la
 * silueta sería un círculo más chico que el ecuador y las costuras se saldrían
 * del contorno.
 *
 * `y` se invierte porque en SVG crece hacia abajo.
 *
 * El recorrido se corta donde la curva cruza de un lado al otro de la esfera.
 * Cada tramo sale como un subtrazado propio, con su `M`: unidos, la línea
 * cruzaría la pelota de lado a lado por el medio.
 */
export function seamPaths(points: readonly Vec3[], decimals = 3): SeamPaths {
  const runs = { front: [] as string[], back: [] as string[] };
  if (points.length === 0) return { front: '', back: '' };

  const round = (value: number) => Number(value.toFixed(decimals));
  const facing = (point: Vec3) => point.z >= 0;

  for (const side of ['front', 'back'] as const) {
    const wanted = side === 'front';

    // Se arranca en el primer punto que entra al lado que se está dibujando
    // viniendo del otro, así ningún tramo queda partido por el borde del array.
    let start = -1;
    for (let i = 0; i < points.length; i++) {
      const previous = points[(i - 1 + points.length) % points.length]!;
      if (facing(points[i]!) === wanted && facing(previous) !== wanted) {
        start = i;
        break;
      }
    }

    // Sin cruces, o está toda de un lado o no hay nada de este lado.
    if (start === -1) {
      if (facing(points[0]!) !== wanted) continue;
      const vuelta = points
        .map((point, i) => `${i === 0 ? 'M' : 'L'}${round(point.x)} ${round(-point.y)}`)
        .join(' ');
      runs[side].push(`${vuelta} Z`);
      continue;
    }

    let current: string[] = [];
    for (let step = 0; step <= points.length; step++) {
      const point = points[(start + step) % points.length]!;
      if (facing(point) === wanted) {
        current.push(`${current.length === 0 ? 'M' : 'L'}${round(point.x)} ${round(-point.y)}`);
      } else if (current.length > 0) {
        if (current.length > 1) runs[side].push(current.join(' '));
        current = [];
      }
    }
    if (current.length > 1) runs[side].push(current.join(' '));
  }

  return { front: runs.front.join(' '), back: runs.back.join(' ') };
}

/** Los trazados de las cuatro costuras para un giro dado. */
export function ballPaths(spin: number, tilt: number, steps = 96): SeamPaths[] {
  return SEAMS.map((seam) => seamPaths(seamPoints(seam, spin, tilt, steps)));
}
