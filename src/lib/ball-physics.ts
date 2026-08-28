/**
 * Física del pique de la pelota.
 *
 * Vive acá, sin React ni Three, por lo mismo que la lógica del minijuego: se
 * puede probar sin montar una escena, y el componente queda reducido a leer un
 * estado y moverlo a la malla.
 *
 * Lo que hace que una pelota se lea como pelota y no como una esfera flotando
 * es que tenga peso: cae acelerando, pica, y en el pique se aplasta y se estira.
 * Sin eso, cualquier material por bueno que sea sigue pareciendo una maqueta.
 */

export type BounceState = {
  /** Altura del centro sobre el piso, en unidades de escena. */
  height: number;
  /** Velocidad vertical; negativa mientras cae. */
  velocity: number;
  /** Cuántas veces picó desde que arrancó. */
  bounces: number;
};

export type BounceConfig = {
  /** Aceleración de la gravedad, en unidades por segundo al cuadrado. */
  gravity: number;
  /** Qué proporción de la velocidad conserva en cada pique. */
  restitution: number;
  /** Altura de reposo: donde queda flotando cuando deja de picar. */
  restHeight: number;
  /** Por debajo de esta velocidad deja de picar y se asienta. */
  settleSpeed: number;
};

export const DEFAULT_BOUNCE: BounceConfig = {
  gravity: 9.2,
  restitution: 0.52,
  restHeight: 0,
  settleSpeed: 0.9,
};

/** Estado inicial: la pelota entra cayendo desde arriba del cuadro. */
export function introState(fromHeight = 2.4): BounceState {
  return { height: fromHeight, velocity: 0, bounces: 0 };
}

/**
 * Avanza la simulación `dt` segundos.
 *
 * El paso se integra en trozos chicos: con un `dt` grande —una pestaña que
 * vuelve del fondo— la pelota podría atravesar el piso entre dos cuadros y
 * salir disparada, que es el error clásico de integrar a paso fijo.
 */
export function stepBounce(
  state: BounceState,
  dt: number,
  config: BounceConfig = DEFAULT_BOUNCE,
): BounceState {
  const MAX_STEP = 1 / 120;
  let { height, velocity, bounces } = state;
  let remaining = Math.min(Math.max(dt, 0), 0.25);

  while (remaining > 0) {
    const step = Math.min(remaining, MAX_STEP);
    remaining -= step;

    velocity -= config.gravity * step;
    height += velocity * step;

    if (height <= config.restHeight) {
      height = config.restHeight;

      if (Math.abs(velocity) < config.settleSpeed) {
        // Ya no le queda energía para otro pique: se queda quieta.
        velocity = 0;
        break;
      }

      velocity = Math.abs(velocity) * config.restitution;
      bounces += 1;
    }
  }

  return { height, velocity, bounces };
}

/** `true` cuando la pelota se quedó quieta en el piso. */
export function hasSettled(state: BounceState, config: BounceConfig = DEFAULT_BOUNCE): boolean {
  return state.velocity === 0 && state.height <= config.restHeight;
}

/** Le da un envión hacia arriba, para el pique al tocarla. */
export function dribble(state: BounceState, impulse = 3.4): BounceState {
  return { ...state, velocity: impulse };
}

export type Squash = { x: number; y: number; z: number };

/**
 * Aplastamiento y estirado de la pelota.
 *
 * Se deforma sólo cerca del piso y en proporción a la velocidad. El volumen se
 * conserva —lo que se achata a lo alto se ensancha a lo ancho— porque si no la
 * pelota parece encogerse en lugar de golpear contra algo.
 */
export function squashFor(
  state: BounceState,
  config: BounceConfig = DEFAULT_BOUNCE,
  maxSquash = 0.22,
): Squash {
  const nearFloor = Math.max(0, 1 - (state.height - config.restHeight) / 0.55);
  const speed = Math.min(1, Math.abs(state.velocity) / 5);
  const amount = nearFloor * speed * maxSquash;

  const y = 1 - amount;
  // Conservar volumen en una esfera: lo que baja en `y` sube en los otros dos
  // ejes por la raíz, no por el mismo factor.
  const widen = 1 / Math.sqrt(y);

  return { x: widen, y, z: widen };
}
