/**
 * Mapas procedurales de una pelota de básquet.
 *
 * En vez de traer imágenes, los mapas se dibujan en canvas al momento: pesan
 * cero en el bundle, se ven nítidos en cualquier tamaño y los colores salen de
 * los mismos tokens que el resto de la landing.
 *
 * El truco está en no razonar en 2D. Para cada píxel del mapa equirectangular se
 * calcula a qué punto de la esfera corresponde y se mide la distancia angular a
 * cada costura definida en 3D. Dibujar las curvas directamente sobre el
 * rectángulo obligaría a deformarlas a mano cerca de los polos.
 *
 * Se generan dos mapas y no uno. El de color por sí solo da una pelota de
 * plástico: lo que la hace parecer cuero es que el relieve desvíe la luz, y eso
 * lo aporta el mapa de normales. La luz que rebota en ese relieve sale del
 * matcap, en `ball-matcap.ts`.
 */

/** Las cuatro costuras de una pelota de ocho paneles. */
export type Axis = 'x' | 'y' | 'z';

export type Seam =
  /** Círculo máximo sobre un plano: `axis` es la normal del plano. */
  | { kind: 'great'; axis: Axis }
  /** Círculo menor a `polarAngle` radianes del semieje positivo `axis`. */
  | { kind: 'small'; axis: Axis; polarAngle: number };

/**
 * Las cuatro costuras de una pelota de ocho paneles.
 *
 * Mirando la pelota de frente se ven tres líneas verticales y una horizontal:
 * el círculo máximo del ecuador da la horizontal, el del plano `x = 0` da la
 * vertical del medio, y los dos círculos menores —tomados **sobre el eje x**,
 * el que apunta a la derecha— dan los dos arcos que la abrazan por los costados.
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

/** Ancho de la costura, en radianes de arco. */
export const SEAM_WIDTH = 0.045;

export type SpherePoint = { x: number; y: number; z: number };

export type Rgb = readonly [number, number, number];

/** Cómo se ve y cómo responde a la luz una variante de pelota. */
export type BallPreset = {
  id: string;
  label: string;
  /** Naranja del cuero. */
  leather: Rgb;
  /** Color del fondo de la costura. */
  seam: Rgb;
  /** Cuánto se nota el granulado, de 0 a 1. */
  grain: number;
  /** Profundidad del surco en el mapa de relieve, de 0 a 1. */
  seamDepth: number;
  /** Cuánto desvía la luz el relieve. */
  normalStrength: number;
  /** Fuerza del brillo especular en el matcap. */
  sheen: number;
  /** Qué tan concentrado es ese brillo: más alto, más chico y más lustroso. */
  sharpness: number;
  /** Cuánto se enciende el borde contra el fondo. */
  rim: number;
};

/**
 * Las tres variantes a comparar. Están acá y no en el componente para que
 * cambiar de una a otra sea cambiar una constante, y no reescribir la escena.
 */
export const BALL_PRESETS = {
  cuero: {
    id: 'cuero',
    label: 'Cuero de partido',
    leather: [232, 116, 44],
    seam: [38, 14, 5],
    grain: 1,
    seamDepth: 1,
    normalStrength: 2.4,
    sheen: 0.12,
    sharpness: 11,
    rim: 0.3,
  },
  nocturno: {
    id: 'nocturno',
    label: 'Editorial nocturno',
    leather: [246, 128, 40],
    seam: [26, 9, 3],
    grain: 0.72,
    seamDepth: 0.9,
    normalStrength: 1.9,
    sheen: 0.26,
    sharpness: 14,
    rim: 0.5,
  },
  estilizado: {
    id: 'estilizado',
    label: 'Estilizado',
    leather: [252, 126, 30],
    seam: [15, 6, 2],
    grain: 0.28,
    seamDepth: 1.15,
    normalStrength: 1.5,
    sheen: 0.5,
    sharpness: 34,
    rim: 0.72,
  },
} as const satisfies Record<string, BallPreset>;

export type BallPresetId = keyof typeof BALL_PRESETS;

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

/** Componente del punto sobre un eje. */
function along(point: SpherePoint, axis: Axis): number {
  return axis === 'x' ? point.x : axis === 'y' ? point.y : point.z;
}

/** Distancia angular de un punto de la esfera a una costura. */
export function distanceToSeam(point: SpherePoint, seam: Seam): number {
  const projection = Math.max(-1, Math.min(1, along(point, seam.axis)));

  if (seam.kind === 'great') {
    // La distancia a un círculo máximo es el ángulo que sobra respecto del plano.
    return Math.abs(Math.asin(projection));
  }

  // Para un círculo menor alcanza con comparar los ángulos polares.
  return Math.abs(Math.acos(projection) - seam.polarAngle);
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

/**
 * Cuánto pesa la costura en un punto, de 0 (cuero liso) a 1 (fondo del surco).
 *
 * El borde se apaga con una curva y no en seco, así el surco no queda escalonado
 * cuando la pelota se ve grande.
 */
export function seamFalloffAt(point: SpherePoint): number {
  const edge = 1 - Math.min(1, distanceToNearestSeam(point) / SEAM_WIDTH);
  return edge * edge;
}

/**
 * Altura de la superficie en una coordenada de textura, de 0 a 1.
 *
 * Es el campo del que salen tanto el relieve como el mapa de normales: el
 * granulado la sube un poco y la costura la hunde.
 */
export function heightAt(x: number, y: number, width: number, preset: BallPreset): number {
  // El mapa da la vuelta completa, así que la coordenada horizontal se envuelve.
  const wrapped = ((x % width) + width) % width;
  const point = sphereAt(wrapped / width, y / (width / 2));
  const grain = grainAt(wrapped, y) * preset.grain;

  return Math.max(0, 0.62 + grain * 0.26 - seamFalloffAt(point) * 0.66 * preset.seamDepth);
}

export type BasketballMaps = {
  /** Color del cuero, con las costuras oscurecidas. */
  color: HTMLCanvasElement;
  /** Normales del relieve, para que la luz rebote como en cuero. */
  normal: HTMLCanvasElement;
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

/** Crea un canvas del tamaño del mapa. */
function createCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  return canvas;
}

/**
 * Dibuja los mapas de la pelota.
 *
 * Sólo corre en el navegador, una vez, después de que la página ya pintó.
 */
export function createBasketballMaps(preset: BallPreset): BasketballMaps {
  const color = createCanvas();
  const normal = createCanvas();

  const colorContext = color.getContext('2d');
  const normalContext = normal.getContext('2d');
  if (!colorContext || !normalContext) return { color, normal };

  const colorData = colorContext.createImageData(WIDTH, HEIGHT);
  const normalData = normalContext.createImageData(WIDTH, HEIGHT);

  const [leatherR, leatherG, leatherB] = preset.leather;
  const [seamR, seamG, seamB] = preset.seam;

  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      const point = sphereAt(x / WIDTH, y / HEIGHT);
      const seam = seamFalloffAt(point);
      const grain = grainAt(x, y);
      const index = (y * WIDTH + x) * 4;

      // --- Color -----------------------------------------------------------
      const grainLift = (grain - 0.5) * 30 * preset.grain;
      let r = leatherR + grainLift;
      let g = leatherG + grainLift * 0.8;
      let b = leatherB + grainLift * 0.6;

      // La costura no sólo cambia de color: el surco recibe menos luz ambiente,
      // así que se hornea algo de oclusión en el borde además del fondo.
      const occlusion = 1 - seam * 0.22;
      r = (r + (seamR - r) * seam) * occlusion;
      g = (g + (seamG - g) * seam) * occlusion;
      b = (b + (seamB - b) * seam) * occlusion;

      colorData.data[index] = r;
      colorData.data[index + 1] = g;
      colorData.data[index + 2] = b;
      colorData.data[index + 3] = 255;

      // --- Normales --------------------------------------------------------
      // Diferencias centradas sobre el campo de alturas. La pendiente en cada
      // eje da la inclinación de la superficie en ese punto.
      const dx = heightAt(x + 1, y, WIDTH, preset) - heightAt(x - 1, y, WIDTH, preset);
      const dy =
        heightAt(x, Math.min(HEIGHT - 1, y + 1), WIDTH, preset) -
        heightAt(x, Math.max(0, y - 1), WIDTH, preset);

      const nx = -dx * preset.normalStrength;
      const ny = -dy * preset.normalStrength;
      const length = Math.hypot(nx, ny, 1);

      // El formato de mapa de normales guarda el rango -1..1 como 0..255.
      normalData.data[index] = ((nx / length) * 0.5 + 0.5) * 255;
      normalData.data[index + 1] = ((ny / length) * 0.5 + 0.5) * 255;
      normalData.data[index + 2] = ((1 / length) * 0.5 + 0.5) * 255;
      normalData.data[index + 3] = 255;
    }
  }

  colorContext.putImageData(colorData, 0, 0);
  normalContext.putImageData(normalData, 0, 0);
  return { color, normal };
}
