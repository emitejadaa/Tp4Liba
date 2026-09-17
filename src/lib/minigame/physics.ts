import {
  BALL_RADIUS,
  COURT_WIDTH,
  FIXED_OBSTACLES,
  FLOOR_Y,
  LAUNCH,
  MOVING_OBSTACLES,
  RIM,
  RIM_NODES,
  type Box,
} from './court';

/**
 * El simulador del minijuego.
 *
 * Es física de verdad y no una animación con forma de tiro: se integra la
 * posición cuadro a cuadro y los rebotes salen de resolver choques, no de una
 * trayectoria elegida de antemano. La diferencia se nota en lo único que
 * importa acá, que es que un tiro que pega en el aro pueda entrar igual. Una
 * animación tiene que decidir antes de empezar si entra; una simulación se
 * entera al final, como en una cancha.
 *
 * Vive sin React ni DOM: entra una velocidad y sale un resultado. Eso lo hace
 * probable sin montar nada y deja a la vista reducida a dibujar una posición.
 */

/** Gravedad, en unidades de cancha por segundo al cuadrado. */
export const GRAVITY = 1400;

/**
 * Rozamiento del aire, lineal y flojo.
 *
 * Una pelota de básquet es grande y liviana, así que el aire se le nota: frena
 * el tiro largo más que el corto y es lo que hace que pasarse de fuerza no sea
 * simétrico con quedarse corto. Flojo a propósito: de más, el arco se deforma y
 * la pelota deja de parecer pesada.
 */
export const AIR_DRAG = 0.22;

/**
 * Cuánta velocidad devuelve cada cosa.
 *
 * El aro es el más apagado de todos y no por gusto: un aro de verdad tiene el
 * anillo montado sobre un resorte y se come buena parte del golpe. Es la razón
 * de que una pelota que pega en el frente se quede dando vueltas arriba en vez
 * de salir disparada, que es el rebote que hace que valga la pena mirar.
 */
export const RESTITUTION = { rim: 0.42, board: 0.5, floor: 0.5, wall: 0.45 } as const;

/** Cuánto frena el piso el avance horizontal en cada pique. */
export const FLOOR_FRICTION = 0.76;

/**
 * Paso fijo de la simulación.
 *
 * La física no se integra con el delta del cuadro sino en pasos iguales de
 * 1/240 s, y el bucle de dibujo acumula el tiempo sobrante para el próximo. Con
 * el delta del cuadro, la misma pelota entra en una pantalla de 120 Hz y pega en
 * el aro en una de 60, porque un paso más largo la mete más adentro del aro
 * antes de que nadie mire si chocó. Con paso fijo, un tiro es siempre el mismo
 * tiro.
 */
export const STEP_SECONDS = 1 / 240;

/** A los cuatro segundos un tiro ya terminó, haya pasado lo que haya pasado. */
export const MAX_FLIGHT_SECONDS = 4;

/** Cuánto sigue la simulación después de entrar, para verla cruzar la red. */
const AFTER_SCORE_SECONDS = 0.7;

/** Por debajo de esto la pelota está quieta aunque el número no sea cero. */
const REST_SPEED = 26;

/** Y hay que verla quieta este tiempo para darla por quieta. */
const REST_SECONDS = 0.25;

export type ShotResult = 'perfect' | 'in' | 'miss';

export type Body = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Giro acumulado en grados. Es decorativo: no entra en ninguna cuenta. */
  spin: number;
};

/**
 * El vaivén del aro.
 *
 * Con `amplitude` en cero el aro está clavado y todo lo que sigue vale cero, así
 * que la parte del juego sin aro móvil no paga nada por esto.
 */
export type HoopMotion = {
  /** Cuánto sube y baja desde su altura de siempre, en unidades. */
  amplitude: number;
  /** Segundos que tarda en hacer el ciclo entero. Menos es más rápido. */
  period: number;
  /**
   * Desfasaje en segundos: en qué punto del vaivén estaba el aro al soltar.
   *
   * Se congela en el momento del tiro y de ahí en más el vuelo lo lleva con su
   * propio reloj. Es lo que hace que el aro no pegue un salto al salir la pelota
   * y, sobre todo, que el tiro sea **una cuenta cerrada**: entra el desfasaje,
   * sale un resultado, y el mismo tiro da siempre lo mismo. Con el reloj de pared
   * metido adentro de la simulación, el mismo tiro entraría o no según cuándo se
   * lo mire, y ni los tests ni el modo sin movimiento podrían reproducirlo.
   */
  phase: number;
};

/** Aro quieto. Es el valor por defecto de casi todo el juego. */
export const STILL_HOOP: HoopMotion = { amplitude: 0, period: 1, phase: 0 };

/** Dónde está el aro respecto de su altura de siempre, a los `seconds` del tiro. */
export function hoopOffsetAt(seconds: number, motion: HoopMotion): number {
  if (motion.amplitude === 0) return 0;
  return motion.amplitude * Math.sin((2 * Math.PI * (seconds + motion.phase)) / motion.period);
}

/** Lo que el mundo le hace a la pelota además de la gravedad. */
export type ShotEnv = {
  /** Aceleración horizontal. Positiva empuja hacia el aro. */
  wind: number;
  /** El vaivén del aro. Si no viene, el aro está quieto. */
  hoop?: HoopMotion;
};

export type Shot = {
  body: Body;
  /** Segundos desde el lanzamiento. */
  elapsed: number;
  touchedRim: boolean;
  touchedBoard: boolean;
  /** null mientras el tiro esté indefinido. */
  result: ShotResult | null;
  /** Momento en que entró, para saber cuándo dejar de simular. */
  scoredAt: number | null;
  /** Tiempo acumulado sin moverse. */
  restFor: number;
  /** true cuando ya no hace falta seguir. */
  settled: boolean;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/** Arranca un tiro desde el punto de lanzamiento con la velocidad dada. */
export function launchShot(velocity: { vx: number; vy: number }): Shot {
  return {
    body: { x: LAUNCH.x, y: LAUNCH.y, vx: velocity.vx, vy: velocity.vy, spin: 0 },
    elapsed: 0,
    touchedRim: false,
    touchedBoard: false,
    result: null,
    scoredAt: null,
    restFor: 0,
    settled: false,
  };
}

/**
 * Avanza la pelota un paso sin mirar con qué choca.
 *
 * El giro sale de la velocidad horizontal y en sentido contrario, que es el
 * efecto que le da un tiro de verdad. No influye en nada: una pelota con efecto
 * se desvía en el aire, pero acá sería un factor invisible que cambia dónde cae,
 * y un juego en el que no se entiende por qué falló un tiro no es más difícil,
 * es peor.
 */
function integrate(body: Body, env: ShotEnv, dt: number): Body {
  const vx = body.vx + (env.wind - AIR_DRAG * body.vx) * dt;
  const vy = body.vy + (GRAVITY - AIR_DRAG * body.vy) * dt;

  return {
    x: body.x + vx * dt,
    y: body.y + vy * dt,
    vx,
    vy,
    spin: body.spin - vx * dt * 1.6,
  };
}

/**
 * Rebote contra un círculo.
 *
 * Se separa la pelota hasta que sólo se tocan y se refleja la componente de la
 * velocidad que va contra la normal, dejando intacta la que va de costado. Es lo
 * que hace que pegarle al aro de refilón la desvíe en vez de frenarla.
 */
function bounceOffNode(
  body: Body,
  node: { x: number; y: number; radius: number },
  offsetY: number,
): Body | null {
  const nodeY = node.y + offsetY;
  const dx = body.x - node.x;
  const dy = body.y - nodeY;
  const distance = Math.hypot(dx, dy);
  const minimum = BALL_RADIUS + node.radius;

  if (distance >= minimum) return null;

  // Justo en el centro no hay normal que valga; se la empuja para arriba.
  const nx = distance === 0 ? 0 : dx / distance;
  const ny = distance === 0 ? -1 : dy / distance;
  const normalSpeed = body.vx * nx + body.vy * ny;

  return {
    ...body,
    x: node.x + nx * minimum,
    y: nodeY + ny * minimum,
    vx: normalSpeed < 0 ? body.vx - (1 + RESTITUTION.rim) * normalSpeed * nx : body.vx,
    vy: normalSpeed < 0 ? body.vy - (1 + RESTITUTION.rim) * normalSpeed * ny : body.vy,
  };
}

/**
 * Rebote contra un rectángulo.
 *
 * Se busca el punto de la caja más cercano al centro de la pelota y se sale por
 * ahí. Cuando el centro quedó adentro de la caja —un paso largo puede meterlo—
 * no hay dirección de salida, así que se elige la cara con menos penetración,
 * que es la que se acaba de atravesar.
 */
function bounceOffBox(body: Body, box: Box, offsetY: number): Body | null {
  const top = box.top + offsetY;
  const bottom = box.bottom + offsetY;
  const nearestX = clamp(body.x, box.left, box.right);
  const nearestY = clamp(body.y, top, bottom);
  const dx = body.x - nearestX;
  const dy = body.y - nearestY;
  const inside = dx === 0 && dy === 0;

  if (!inside && dx * dx + dy * dy >= BALL_RADIUS * BALL_RADIUS) return null;

  let nx: number;
  let ny: number;

  if (inside) {
    const toLeft = body.x - box.left;
    const toRight = box.right - body.x;
    const toTop = body.y - top;
    const toBottom = bottom - body.y;
    const least = Math.min(toLeft, toRight, toTop, toBottom);

    nx = least === toLeft ? -1 : least === toRight ? 1 : 0;
    ny = nx !== 0 ? 0 : least === toTop ? -1 : 1;
  } else {
    const distance = Math.hypot(dx, dy);
    nx = dx / distance;
    ny = dy / distance;
  }

  const normalSpeed = body.vx * nx + body.vy * ny;

  return {
    ...body,
    x: nearestX + nx * BALL_RADIUS,
    y: nearestY + ny * BALL_RADIUS,
    vx: normalSpeed < 0 ? body.vx - (1 + RESTITUTION.board) * normalSpeed * nx : body.vx,
    vy: normalSpeed < 0 ? body.vy - (1 + RESTITUTION.board) * normalSpeed * ny : body.vy,
  };
}

/** Piso y paredes, que son lo que mantiene la pelota adentro de la cancha. */
function bounceOffBounds(body: Body): Body {
  let { x, y, vx, vy } = body;

  if (y + BALL_RADIUS > FLOOR_Y) {
    y = FLOOR_Y - BALL_RADIUS;
    if (vy > 0) {
      vy = -vy * RESTITUTION.floor;
      vx *= FLOOR_FRICTION;
    }
  }

  if (x - BALL_RADIUS < 0) {
    x = BALL_RADIUS;
    if (vx < 0) vx = -vx * RESTITUTION.wall;
  } else if (x + BALL_RADIUS > COURT_WIDTH) {
    x = COURT_WIDTH - BALL_RADIUS;
    if (vx > 0) vx = -vx * RESTITUTION.wall;
  }

  return { ...body, x, y, vx, vy };
}

/**
 * ¿Cruzó el plano del aro por adentro y para abajo?
 *
 * Los dos requisitos son el juego entero. **Para abajo**, porque una pelota que
 * sube atravesando el aro no encestó: subió por al lado. Y **por adentro**, con
 * la X interpolada en el momento exacto del cruce y no la del final del paso,
 * porque en un paso la pelota se mueve varias unidades y mirar dónde terminó
 * cuenta canastas que pasaron por afuera.
 *
 * Con el aro móvil el plano no está quieto, así que se mira la pelota **contra
 * el aro** y no contra una altura fija: se toma dónde estaba el aro al principio
 * del paso y dónde está al final. Contra una altura fija, un aro que sube a
 * buscar la pelota contaría canastas que no pasaron y se comería otras que sí.
 */
function crossedRim(before: Body, after: Body, rimBefore: number, rimAfter: number): boolean {
  if (after.vy <= 0) return false;
  if (before.y >= rimBefore || after.y < rimAfter) return false;

  // La fracción del paso en la que la pelota alcanza al aro, con los dos
  // moviéndose: se resuelve sobre la diferencia, que es la que cruza el cero.
  const gapBefore = rimBefore - before.y;
  const gapAfter = rimAfter - after.y;
  const change = gapBefore - gapAfter;
  const share = change === 0 ? 0 : gapBefore / change;
  const crossingX = before.x + (after.x - before.x) * share;

  return crossingX > RIM.front && crossingX < RIM.back;
}

/**
 * Un paso de simulación.
 *
 * El orden importa: primero se mueve la pelota, después se la saca de adonde no
 * puede estar, y recién ahí se mira si cruzó el aro. Mirar el cruce antes de
 * resolver los choques contaría como canasta una pelota que en realidad rebotó
 * en el aro y nunca pasó.
 */
function step(shot: Shot, env: ShotEnv): Shot {
  const before = shot.body;
  const elapsed = shot.elapsed + STEP_SECONDS;
  const hoop = env.hoop ?? STILL_HOOP;
  const offsetBefore = hoopOffsetAt(shot.elapsed, hoop);
  const offset = hoopOffsetAt(elapsed, hoop);

  let body = integrate(before, env, STEP_SECONDS);
  let touchedRim = shot.touchedRim;
  let touchedBoard = shot.touchedBoard;

  for (const node of RIM_NODES) {
    const bounced = bounceOffNode(body, node, offset);
    if (bounced) {
      body = bounced;
      touchedRim = true;
    }
  }

  // El tablero cuelga del aro y se mueve con él; el poste está clavado al piso.
  for (const box of MOVING_OBSTACLES) {
    const bounced = bounceOffBox(body, box, offset);
    if (bounced) {
      body = bounced;
      touchedBoard = true;
    }
  }

  for (const box of FIXED_OBSTACLES) {
    const bounced = bounceOffBox(body, box, 0);
    if (bounced) {
      body = bounced;
      touchedBoard = true;
    }
  }

  body = bounceOffBounds(body);

  const justScored =
    shot.scoredAt === null && crossedRim(before, body, RIM.y + offsetBefore, RIM.y + offset);

  const resting =
    body.y + BALL_RADIUS >= FLOOR_Y - 0.5 && Math.hypot(body.vx, body.vy) < REST_SPEED;
  const restFor = resting ? shot.restFor + STEP_SECONDS : 0;

  const scoredAt = justScored ? elapsed : shot.scoredAt;
  const result: ShotResult | null = justScored
    ? touchedRim || touchedBoard
      ? 'in'
      : 'perfect'
    : shot.result;

  const settled =
    elapsed >= MAX_FLIGHT_SECONDS ||
    (scoredAt !== null && elapsed - scoredAt >= AFTER_SCORE_SECONDS) ||
    (scoredAt === null && restFor >= REST_SECONDS);

  return {
    body,
    elapsed,
    touchedRim,
    touchedBoard,
    result: settled && result === null ? 'miss' : result,
    scoredAt,
    restFor,
    settled,
  };
}

/**
 * Avanza el tiro el tiempo real que pasó, en pasos fijos.
 *
 * El sobrante de tiempo que no alcanza para un paso entero se descarta en vez de
 * acumularse entre llamadas: el bucle de dibujo guarda su propio acumulador, y
 * tenerlo acá también sería llevar la cuenta dos veces. Y el delta se recorta a
 * un cuarto de segundo: volver a una pestaña que estuvo en segundo plano no
 * tiene que teletransportar la pelota media cancha.
 */
export function advanceShot(shot: Shot, env: ShotEnv, deltaSeconds: number): Shot {
  const steps = Math.floor(Math.min(deltaSeconds, 0.25) / STEP_SECONDS);
  let next = shot;

  for (let index = 0; index < steps && !next.settled; index += 1) {
    next = step(next, env);
  }

  return next;
}

/** Corre un tiro entero de una. Lo usan los tests y el modo sin movimiento. */
export function simulateShot(velocity: { vx: number; vy: number }, env: ShotEnv): Shot {
  let shot = launchShot(velocity);

  while (!shot.settled) {
    shot = step(shot, env);
  }

  return shot;
}

/**
 * Los primeros cuadros del vuelo, sin choques, para la guía de puntería.
 *
 * Corta antes del aro a propósito. Una guía que llega hasta el final no es una
 * ayuda para apuntar: es la respuesta, y con ella el juego se termina en el
 * segundo tiro. Mostrando el arranque del arco se entiende para dónde y con
 * cuánta fuerza sale, que es lo que hace falta para aprender a calcularlo.
 */
export function previewPath(
  velocity: { vx: number; vy: number },
  env: ShotEnv,
  seconds: number,
  points: number,
): { x: number; y: number }[] {
  const dt = seconds / points;
  const path: { x: number; y: number }[] = [];
  let body: Body = { x: LAUNCH.x, y: LAUNCH.y, vx: velocity.vx, vy: velocity.vy, spin: 0 };

  for (let index = 0; index < points; index += 1) {
    body = integrate(body, env, dt);
    path.push({ x: body.x, y: body.y });
  }

  return path;
}

/** Puntos que suma cada resultado: 3 la que entra limpia, 2 la que rebotó. */
export function shotPoints(result: ShotResult): number {
  if (result === 'perfect') return 3;
  if (result === 'in') return 2;
  return 0;
}
