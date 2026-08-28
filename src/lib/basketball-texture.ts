/**
 * Textura procedural de una pelota de básquet.
 *
 * En vez de traer un mapa de imagen, la textura se dibuja en un canvas al
 * momento: pesa cero en el bundle, se ve nítida en cualquier tamaño de pantalla
 * y los colores salen de los mismos tokens que el resto de la landing.
 *
 * El truco está en no razonar en 2D. Para cada píxel del mapa equirectangular se
 * calcula a qué punto de la esfera corresponde y se mide la distancia angular a
 * cada costura definida en 3D. Dibujar las curvas directamente sobre el
 * rectángulo obligaría a deformarlas a mano cerca de los polos.
 */

/** Las cuatro costuras de una pelota de ocho paneles. */
export type Seam =
  /** Círculo máximo sobre un plano: `axis` es la normal del plano. */
  | { kind: 'great'; axis: 'x' | 'y' }
  /** Círculo menor a `polarAngle` radianes del polo norte. */
  | { kind: 'small'; polarAngle: number };

/**
 * Dos círculos máximos perpendiculares y dos menores simétricos. Es el patrón
 * clásico: los máximos dan la línea vertical y la horizontal, y los menores las
 * dos curvas que abrazan los costados.
 */
export const SEAMS: readonly Seam[] = [
  { kind: 'great', axis: 'y' },
  { kind: 'great', axis: 'x' },
  { kind: 'small', polarAngle: 0.97 },
  { kind: 'small', polarAngle: Math.PI - 0.97 },
];

/** Ancho de la costura, en radianes de arco. */
export const SEAM_WIDTH = 0.045;

export type SpherePoint = { x: number; y: number; z: number };

/**
 * Punto de la esfera unitaria para una coordenada de textura.
 *
 * `u` recorre la longitud y `v` la latitud, ambos de 0 a 1, como espera el
 * mapeo equirectangular de Three.js.
 */
export function sphereAt(u: number, v: number): SpherePoint {
  const phi = v * Math.PI;
  const theta = u * Math.PI * 2;

  return {
    x: Math.sin(phi) * Math.cos(theta),
    y: Math.cos(phi),
    z: Math.sin(phi) * Math.sin(theta),
  };
}

/** Distancia angular de un punto de la esfera a una costura. */
export function distanceToSeam(point: SpherePoint, seam: Seam): number {
  if (seam.kind === 'great') {
    // La distancia a un círculo máximo es el ángulo que sobra respecto del plano.
    return Math.abs(Math.asin(seam.axis === 'y' ? point.y : point.x));
  }

  // Para un círculo menor alcanza con comparar los ángulos polares.
  return Math.abs(Math.acos(Math.max(-1, Math.min(1, point.z))) - seam.polarAngle);
}

/** Distancia a la costura más cercana. */
export function distanceToNearestSeam(point: SpherePoint): number {
  let nearest = Infinity;
  for (const seam of SEAMS) {
    const distance = distanceToSeam(point, seam);
    if (distance < nearest) nearest = distance;
  }
  return nearest;
}

/**
 * Ruido pseudoaleatorio estable a partir de dos enteros.
 *
 * Da el granulado del cuero. Es determinista para que la textura salga idéntica
 * en cada carga y no cambie entre recargas.
 */
export function grainAt(x: number, y: number): number {
  const value = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

export type BasketballMaps = {
  /** Color: naranja con las costuras oscuras y el granulado. */
  color: HTMLCanvasElement;
  /** Relieve: costuras hundidas y granos apenas levantados. */
  bump: HTMLCanvasElement;
};

/**
 * Ancho del mapa; el alto es la mitad, como pide el mapeo equirectangular.
 *
 * 512×256 alcanza de sobra para una pelota que ocupa menos de 450 px en
 * pantalla, y cuesta la cuarta parte que 1024×512 tanto al generarla como al
 * muestrearla en cada cuadro.
 */
const WIDTH = 512;
const HEIGHT = 256;

/**
 * Dibuja los mapas de color y de relieve de la pelota.
 *
 * Sólo corre en el navegador, una vez, después de que la página ya pintó.
 */
export function createBasketballMaps(): BasketballMaps {
  const color = document.createElement('canvas');
  const bump = document.createElement('canvas');
  color.width = bump.width = WIDTH;
  color.height = bump.height = HEIGHT;

  const colorContext = color.getContext('2d');
  const bumpContext = bump.getContext('2d');
  if (!colorContext || !bumpContext) return { color, bump };

  const colorData = colorContext.createImageData(WIDTH, HEIGHT);
  const bumpData = bumpContext.createImageData(WIDTH, HEIGHT);

  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      const point = sphereAt(x / WIDTH, y / HEIGHT);
      const seamDistance = distanceToNearestSeam(point);
      const grain = grainAt(x, y);

      // La costura se apaga hacia los bordes en vez de cortar en seco, así no
      // queda escalonada cuando la pelota se ve grande.
      const seam = 1 - Math.min(1, seamDistance / SEAM_WIDTH);
      const seamFalloff = seam * seam;

      // Naranja del cuero, con el granulado modulando el brillo.
      const grainLift = (grain - 0.5) * 26;
      let r = 226 + grainLift;
      let g = 114 + grainLift * 0.8;
      let b = 45 + grainLift * 0.6;

      // Marrón muy oscuro de la costura.
      r += (48 - r) * seamFalloff;
      g += (18 - g) * seamFalloff;
      b += (6 - b) * seamFalloff;

      const index = (y * WIDTH + x) * 4;
      colorData.data[index] = r;
      colorData.data[index + 1] = g;
      colorData.data[index + 2] = b;
      colorData.data[index + 3] = 255;

      // En el relieve, la costura es un surco y los granos apenas sobresalen.
      const height = 178 + grain * 64 - seamFalloff * 168;
      bumpData.data[index] = height;
      bumpData.data[index + 1] = height;
      bumpData.data[index + 2] = height;
      bumpData.data[index + 3] = 255;
    }
  }

  colorContext.putImageData(colorData, 0, 0);
  bumpContext.putImageData(bumpData, 0, 0);
  return { color, bump };
}
