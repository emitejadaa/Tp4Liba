import type { BallPreset, Rgb } from './basketball-texture';

/**
 * Iluminación de estudio de la pelota, capturada en un «matcap».
 *
 * Un matcap es una foto de una esfera iluminada: para cada dirección de la
 * normal guarda de qué color se ve. El material lo lee con **una sola** lectura
 * de textura, usando la normal en espacio de cámara como coordenada.
 *
 * Acá había un mapa de entorno filtrado con `PMREMGenerator`, que es la vía
 * canónica y se veía muy bien, pero medido costaba caro: la pelota bajaba de 60
 * a 36 cuadros por segundo en renderizado por software, porque el muestreo del
 * cubemap hace dos lecturas más una mezcla por nivel de detalle en cada píxel.
 * El matcap da el mismo resultado —reflejo suave, borde encendido, brillo que
 * no gira con la pelota— por una fracción del costo.
 *
 * Que el brillo no gire con la pelota no es una limitación: es lo correcto. La
 * luz está en la habitación, no pegada al cuero, así que cuando la pelota gira
 * lo que se mueve son las costuras, no el reflejo.
 */

/** Una luz del estudio, dada por su dirección en espacio de cámara. */
type Light = {
  /** Dirección hacia la luz. `x` a la derecha, `y` arriba, `z` hacia la cámara. */
  direction: readonly [number, number, number];
  color: Rgb;
  intensity: number;
};

/**
 * El estudio: una luz principal fría y alta, un rebote naranja del otro lado y
 * un relleno cenital.
 *
 * Los colores son los de la landing, así que la pelota parece estar dentro de
 * la página en vez de pegada encima.
 */
export const LIGHTS: readonly Light[] = [
  // Principal, arriba a la izquierda: da el brillo grande.
  { direction: [-0.55, 0.62, 0.56], color: [1, 0.96, 0.9], intensity: 0.8 },
  // Rebote cálido del lado opuesto, para que la mitad en sombra no se apague.
  { direction: [0.85, -0.1, 0.25], color: [1, 0.46, 0.14], intensity: 0.24 },
  // Relleno cenital frío, que es lo que hace leer el volumen arriba.
  { direction: [0.05, 0.95, 0.25], color: [0.42, 0.55, 0.85], intensity: 0.13 },
];

/**
 * Cuánto se «envuelve» la luz alrededor del terminador.
 *
 * Con difuso lambertiano puro la mitad oscura queda plana y negra, que es
 * justamente el aspecto barato que se está tratando de evitar. Envolver la luz
 * imita el rebote del entorno sin tener que muestrear ninguno.
 *
 * Es un valor delicado: pasado de rosca la esfera se ilumina entera, el
 * terminador desaparece y la pelota se aplana. Acá quedó bajo a propósito.
 */
const WRAP = 0.2;

/**
 * Ambiente de hemisferio: cielo arriba, piso abajo.
 *
 * Un ambiente constante deja la pelota flotando en una caja de luz. Que lo de
 * abajo sea casi negro —el piso de la landing es azul muy oscuro— es lo que le
 * da el borde inferior apagado que la asienta.
 */
const SKY: Rgb = [0.075, 0.095, 0.15];
const GROUND: Rgb = [0.015, 0.016, 0.027];

/** Color del borde encendido, que despega la silueta del fondo oscuro. */
const RIM: Rgb = [0.55, 0.68, 1];

function normalize([x, y, z]: readonly [number, number, number]): [number, number, number] {
  const length = Math.hypot(x, y, z) || 1;
  return [x / length, y / length, z / length];
}

/**
 * Color con el que se ve una normal dada, de 0 a 1 por canal.
 *
 * Es la función que define el matcap entero; se exporta aparte del canvas para
 * poder probarla sin depender de que exista un contexto 2D.
 */
export function shadeNormal(
  nx: number,
  ny: number,
  nz: number,
  preset: BallPreset,
): [number, number, number] {
  // Mezcla del hemisferio según cuánto mire hacia arriba la normal.
  const up = ny * 0.5 + 0.5;
  let r = GROUND[0] + (SKY[0] - GROUND[0]) * up;
  let g = GROUND[1] + (SKY[1] - GROUND[1]) * up;
  let b = GROUND[2] + (SKY[2] - GROUND[2]) * up;

  for (const light of LIGHTS) {
    const [lx, ly, lz] = normalize(light.direction);

    // Difuso envolvente: en vez de cortar en cero, la luz sigue un poco más
    // allá del terminador y se apaga suave.
    const lambert = nx * lx + ny * ly + nz * lz;
    const diffuse = Math.max(0, (lambert + WRAP) / (1 + WRAP)) * light.intensity;

    // Especular Blinn-Phong con la cámara mirando de frente, o sea `v = z`.
    const [hx, hy, hz] = normalize([lx, ly, lz + 1]);
    const facing = Math.max(0, nx * hx + ny * hy + nz * hz);
    const specular = Math.pow(facing, preset.sharpness) * preset.sheen * light.intensity;

    r += light.color[0] * (diffuse + specular);
    g += light.color[1] * (diffuse + specular);
    b += light.color[2] * (diffuse + specular);
  }

  // Borde encendido: cuanto más de canto se ve la superficie, más se enciende.
  const fresnel = Math.pow(1 - Math.max(0, nz), 3.5) * preset.rim;
  r += RIM[0] * fresnel;
  g += RIM[1] * fresnel;
  b += RIM[2] * fresnel;

  return [Math.min(1, r), Math.min(1, g), Math.min(1, b)];
}

/**
 * Lado del matcap en píxeles.
 *
 * Sólo tiene degradés suaves, así que 256 alcanza: subirlo no agrega detalle y
 * el material lo muestrea con filtrado lineal igual.
 */
export const MATCAP_SIZE = 256;

/**
 * Dibuja el matcap del preset.
 *
 * El disco inscripto en el cuadrado cubre todas las normales visibles: el
 * centro es la normal que mira a la cámara y el borde, las que se ven de canto.
 * Afuera del disco se sigue sombreando con la normal del borde, porque el mapa
 * de normales puede empujar una normal apenas fuera del círculo y un borde
 * negro ahí se vería como un anillo sucio.
 */
export function createMatcap(preset: BallPreset): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = MATCAP_SIZE;

  const context = canvas.getContext('2d');
  if (!context) return canvas;

  const image = context.createImageData(MATCAP_SIZE, MATCAP_SIZE);
  const half = MATCAP_SIZE / 2;

  for (let y = 0; y < MATCAP_SIZE; y++) {
    for (let x = 0; x < MATCAP_SIZE; x++) {
      // La textura crece hacia abajo y la normal, hacia arriba.
      let nx = (x + 0.5) / half - 1;
      let ny = 1 - (y + 0.5) / half;

      const radius = Math.hypot(nx, ny);
      if (radius > 1) {
        nx /= radius;
        ny /= radius;
      }
      const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));

      const [r, g, b] = shadeNormal(nx, ny, nz, preset);
      const index = (y * MATCAP_SIZE + x) * 4;
      image.data[index] = r * 255;
      image.data[index + 1] = g * 255;
      image.data[index + 2] = b * 255;
      image.data[index + 3] = 255;
    }
  }

  context.putImageData(image, 0, 0);
  return canvas;
}
