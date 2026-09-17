/**
 * Geometría de la cancha del minijuego.
 *
 * Todo el juego —la física y el dibujo— trabaja en estas unidades y no en
 * píxeles de pantalla. La cancha se dibuja como una sola SVG con
 * `viewBox="0 0 460 300"`, así que una unidad es un píxel cuando la cancha está
 * a tamaño completo y se achica sola con ella en un teléfono. Un tiro se ve
 * exactamente igual en cualquier pantalla porque es el mismo tiro: lo único que
 * cambia es la escala del dibujo.
 *
 * Que la física y el dibujo lean estas constantes y no dos copias es lo que
 * evita el peor error de un juego así: una pelota que pasa por al lado del aro y
 * cuenta, o que lo atraviesa y no.
 *
 * ## Por qué el aro se ve de costado
 *
 * Antes se veía de frente. De frente no se puede simular: el tablero queda
 * **detrás** del aro, en una profundidad que dos dimensiones no tienen, así que
 * o se lo pone en el camino de la pelota —y entonces tapa todos los tiros
 * buenos, que es exactamente lo que pasaba— o no se lo pone y la pelota lo
 * atraviesa dibujado. De costado, los tres cuerpos —el frente del aro, el fondo
 * del aro y el tablero— están en el mismo plano que la pelota, que es lo que
 * hace que un tiro corto pegue en el frente y vuelva, que uno largo pegue en la
 * tabla y baje, y que un tiro pueda entrar después de rebotar.
 *
 * El eje Y crece hacia abajo, como en SVG y en el DOM.
 */

export const COURT_WIDTH = 460;
export const COURT_HEIGHT = 300;

/**
 * Cielo: cuánto se dibuja por encima de la cancha.
 *
 * La cancha llega hasta el aro y nada más, pero la pelota sube bastante más
 * arriba que el aro. Sin cielo, un tiro con fuerza se salía por el borde de
 * arriba y desaparecía en el aire —ochenta y nueve de los tiros que **entran** lo
 * hacían— y volvía a aparecer de la nada un rato después. Un tiro del que no se
 * ve la mitad no se puede corregir, que es justamente lo que hay que hacer con
 * el que falló.
 *
 * Son ciento cuarenta unidades porque el tiro que más sube de todos —vertical y
 * a fondo— llega a −115, y la pelota mide quince de radio. O sea: alcanza para
 * cualquier tiro posible, no para casi todos. El test que lo verifica recorre el
 * espacio entero de punterías, así que subir la velocidad máxima sin subir el
 * cielo lo rompe en vez de volver a esconder la pelota.
 *
 * No cambia nada del juego: el aro, el piso y el lanzamiento siguen en las
 * mismas coordenadas. Lo único que pasa es que arriba hay aire, que es lo que
 * hay arriba de un aro en una cancha.
 */
export const SKY = 140;

/** El `viewBox` de la cancha, cielo incluido. */
export const VIEW_BOX = `0 ${-SKY} ${COURT_WIDTH} ${COURT_HEIGHT + SKY}`;

/** Radio de la pelota. Contra los 52 del aro deja la misma luz que en serio. */
export const BALL_RADIUS = 15;

/** Centro de la pelota en reposo, de donde sale cada tiro. */
export const LAUNCH = { x: 73, y: 257 } as const;

/** Altura del piso. La pelota en reposo lo toca con su borde de abajo. */
export const FLOOR_Y = LAUNCH.y + BALL_RADIUS;

/**
 * El aro, como los dos puntos que lo forman.
 *
 * De costado un aro no es un anillo: es su frente y su fondo, y la pelota pasa
 * entre los dos. Modelarlos como dos círculos es de donde sale toda la gracia de
 * un tiro que da vueltas arriba del aro y cae, porque el rebote no está escrito
 * en ningún lado: sale de resolver el choque.
 */
export const RIM = {
  y: 88,
  /** El frente, el que se lleva los tiros cortos. */
  front: 300,
  /** El fondo, contra el tablero. */
  back: 352,
  /** Radio de cada nodo. Es medio trazo del aro dibujado. */
  nodeRadius: 3,
} as const;

/** Centro de la boca del aro: adonde hay que apuntar. */
export const RIM_CENTER = { x: (RIM.front + RIM.back) / 2, y: RIM.y } as const;

/**
 * El tablero, visto de canto.
 *
 * Es la tabla: un tiro pasado de fuerza le pega en la cara y baja al aro, que es
 * el rebote que más satisface de todos porque parece que se salvó solo. Empieza
 * seis unidades detrás del fondo del aro, como en una cancha, así que hay lugar
 * para que la pelota entre entre el aro y la tabla sin tocar ninguno.
 */
export const BOARD = { left: 358, right: 368, top: 8, bottom: 104 } as const;

/** El poste, detrás del tablero. Frena lo que se va largo por la derecha. */
export const POST = { left: 380, right: 388, top: 30, bottom: FLOOR_Y } as const;

/** Rectángulo con las cuatro caras que chocan. */
export type Box = { left: number; right: number; top: number; bottom: number };

/** Los cuerpos macizos de la cancha. */
export const OBSTACLES: readonly Box[] = [BOARD, POST];

/** Los dos nodos del aro, como círculos. */
export const RIM_NODES: readonly { x: number; y: number; radius: number }[] = [
  { x: RIM.front, y: RIM.y, radius: RIM.nodeRadius },
  { x: RIM.back, y: RIM.y, radius: RIM.nodeRadius },
];
