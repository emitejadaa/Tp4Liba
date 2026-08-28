'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { BounceState } from '@/lib/ball-physics';
import { dribble, hasSettled, introState, squashFor, stepBounce } from '@/lib/ball-physics';
import type { BallPreset, BallPresetId } from '@/lib/basketball-texture';
import { BALL_PRESETS, createBasketballMaps } from '@/lib/basketball-texture';
import { createMatcap } from '@/lib/ball-matcap';

/** Vueltas por segundo del giro en reposo. */
const IDLE_SPIN = 0.24;

/** Cuánto conserva la velocidad de giro en cada cuadro al soltar. */
const FRICTION = 0.94;

/** Radianes de giro por píxel arrastrado. */
const DRAG_SENSITIVITY = 0.007;

/** Tope de giro, para que un manotazo no la deje girando eterna. */
const MAX_SPIN = 9;

/** A partir de cuántos píxeles un gesto cuenta como arrastre y no como toque. */
const DRAG_THRESHOLD = 4;

/** Progreso de scroll de la sección, de 0 a 1, leído sin re-renderizar. */
export type ScrollSource = { get: () => number };

type BallProps = { preset: BallPreset; scroll?: ScrollSource };

/**
 * La pelota: material, física y arrastre.
 *
 * Todo el estado que cambia por cuadro vive en refs. Llevarlo a estado de React
 * re-renderizaría decenas de veces por segundo, que es justo lo que un lienzo 3D
 * no puede permitirse.
 */
function Ball({ preset, scroll }: BallProps) {
  const group = useRef<THREE.Group>(null);
  const mesh = useRef<THREE.Mesh>(null);
  const shadow = useRef<THREE.Mesh>(null);
  const bounce = useRef<BounceState>(introState());
  const drag = useRef({
    dragging: false,
    moved: 0,
    last: { x: 0, y: 0 },
    /** Radianes por segundo; decae por fricción al soltar. */
    velocity: { x: 0, y: 0 },
    /** Giro acumulado desde el último cuadro, en radianes. */
    pending: { x: 0, y: 0 },
  });

  const canvas = useThree((state) => state.gl.domElement);

  const maps = useMemo(() => {
    const canvases = createBasketballMaps(preset);
    const color = new THREE.CanvasTexture(canvases.color);
    const normal = new THREE.CanvasTexture(canvases.normal);

    // El mapa da la vuelta completa, así que se repite a lo largo de la longitud.
    for (const texture of [color, normal]) {
      texture.wrapS = THREE.RepeatWrapping;
      texture.anisotropy = 4;
    }
    color.colorSpace = THREE.SRGBColorSpace;

    // El matcap trae la luz ya en sRGB, como cualquier imagen de referencia.
    const matcap = new THREE.CanvasTexture(createMatcap(preset));
    matcap.colorSpace = THREE.SRGBColorSpace;

    return { color, normal, matcap };
  }, [preset]);

  /** La sombra es un degradé radial: más barato que proyectar una de verdad. */
  const shadowTexture = useMemo(() => {
    const element = document.createElement('canvas');
    element.width = element.height = 128;
    const context = element.getContext('2d');
    if (context) {
      const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
      // El corte cae rápido: una sombra que se desvanece de a poco se lee como
      // suciedad en el fondo en vez de como apoyo sobre el piso.
      gradient.addColorStop(0, 'rgba(0,0,0,0.85)');
      gradient.addColorStop(0.35, 'rgba(0,0,0,0.42)');
      gradient.addColorStop(0.7, 'rgba(0,0,0,0.08)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      context.fillStyle = gradient;
      context.fillRect(0, 0, 128, 128);
    }
    return new THREE.CanvasTexture(element);
  }, []);

  // Texturas y mapas reservan memoria de video: hay que liberarlos al desmontar.
  useEffect(
    () => () => {
      Object.values(maps).forEach((texture) => texture.dispose());
      shadowTexture.dispose();
    },
    [maps, shadowTexture],
  );

  useEffect(() => {
    const state = drag.current;

    const onPointerDown = (event: PointerEvent) => {
      state.dragging = true;
      state.moved = 0;
      state.last = { x: event.clientX, y: event.clientY };
      state.velocity = { x: 0, y: 0 };
      canvas.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!state.dragging) return;

      const dx = event.clientX - state.last.x;
      const dy = event.clientY - state.last.y;
      state.last = { x: event.clientX, y: event.clientY };
      state.moved += Math.abs(dx) + Math.abs(dy);

      // El giro se acumula y se aplica una vez por cuadro, no por evento.
      state.pending = {
        x: state.pending.x + dy * DRAG_SENSITIVITY,
        y: state.pending.y + dx * DRAG_SENSITIVITY,
      };

      // El arrastre fija la velocidad en lugar de sumarse, así la pelota sigue
      // al dedo en vez de acelerarse sola mientras se la mueve.
      state.velocity = {
        x: Math.max(-MAX_SPIN, Math.min(MAX_SPIN, dy * DRAG_SENSITIVITY * 60)),
        y: Math.max(-MAX_SPIN, Math.min(MAX_SPIN, dx * DRAG_SENSITIVITY * 60)),
      };
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!state.dragging) return;
      state.dragging = false;
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);

      // Un toque sin desplazamiento la pica; con desplazamiento, ya la giró.
      if (state.moved < DRAG_THRESHOLD) bounce.current = dribble(bounce.current);
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
    };
  }, [canvas]);

  useFrame((state, delta) => {
    const container = group.current;
    const ball = mesh.current;
    const shade = shadow.current;
    const spin = drag.current;
    if (!container || !ball || !shade) return;

    // El delta se acota para que volver de una pestaña en segundo plano no
    // dispare la pelota media vuelta de golpe.
    const step = Math.min(delta, 0.05);

    // --- Giro --------------------------------------------------------------
    ball.rotation.y += spin.pending.y;
    ball.rotation.x += spin.pending.x;
    spin.pending = { x: 0, y: 0 };

    if (!spin.dragging) {
      ball.rotation.y += (spin.velocity.y + IDLE_SPIN) * step;
      ball.rotation.x += spin.velocity.x * step;

      // Fricción independiente de los Hz de la pantalla.
      const decay = Math.pow(FRICTION, step * 60);
      spin.velocity = { x: spin.velocity.x * decay, y: spin.velocity.y * decay };
    }

    // --- Pique -------------------------------------------------------------
    bounce.current = stepBounce(bounce.current, step);
    const { height } = bounce.current;
    const squash = squashFor(bounce.current);
    ball.scale.set(squash.x, squash.y, squash.z);

    // Ya asentada, flota apenas: quieta del todo parece una imagen.
    const float = hasSettled(bounce.current) ? Math.sin(state.clock.elapsedTime * 1.1) * 0.045 : 0;

    const progress = scroll?.get() ?? 0;
    container.position.y = height + float - progress * 0.55;
    container.rotation.z = progress * 0.4;

    // La sombra se achica y se aclara a medida que la pelota sube: es lo que
    // hace leer la altura, más que la posición de la pelota en sí.
    const closeness = Math.max(0, 1 - height / 2.2);
    shade.scale.set(0.62 + closeness * 0.45, 0.55 + closeness * 0.5, 1);
    (shade.material as THREE.MeshBasicMaterial).opacity = 0.08 + closeness * 0.62;
    // Queda pegada al piso mientras la pelota sube, que es lo que la delata.
    shade.position.y = -1.24 - height;
  });

  return (
    <group ref={group}>
      <mesh ref={mesh}>
        {/* 64×48 son unos 6.000 triángulos: a este tamaño en pantalla la
            silueta ya se ve redonda y subir la malla sólo agrega costo. */}
        <sphereGeometry args={[1, 64, 48]} />
        {/*
          Material de matcap y no PBR. Medido en renderizado por software, la
          versión con mapa de entorno filtrado corría a 36 cuadros por segundo y
          ésta a 60, con la pelota viéndose igual o mejor: toda la iluminación
          entra en una lectura de textura en vez de un muestreo de cubemap por
          nivel de detalle. El mapa de normales sigue puesto, que es lo que hace
          que el granulado se lea como cuero.
        */}
        <meshMatcapMaterial
          matcap={maps.matcap}
          map={maps.color}
          normalMap={maps.normal}
          normalScale={new THREE.Vector2(1, 1)}
        />
      </mesh>

      {/*
        Sombra de contacto, dentro de la escena para que siga al pique. El plano
        mira a la cámara en lugar de estar acostado en el piso: con la cámara
        de frente, un plano horizontal se ve de canto y la sombra queda como una
        banda en vez de una mancha.
      */}
      <mesh ref={shadow} position={[0, -1.2, -0.3]}>
        <planeGeometry args={[2.3, 0.9]} />
        <meshBasicMaterial
          map={shadowTexture}
          transparent
          depthWrite={false}
          opacity={0.5}
          color="#000000"
        />
      </mesh>
    </group>
  );
}

/**
 * Pelota de básquet en 3D.
 *
 * Entra cayendo y picando, después gira sola despacio. Se la puede agarrar y
 * girar en cualquier dirección —sigue por inercia al soltarla— y un toque sin
 * arrastre la vuelve a picar.
 *
 * El lienzo se congela cuando la sección sale de pantalla o se oculta la
 * pestaña: un bucle de render 3D corriendo de fondo es de lo más caro que puede
 * hacer una landing.
 */
export default function Basketball3D({
  scroll,
  preset = 'nocturno',
}: {
  scroll?: ScrollSource;
  preset?: BallPresetId;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(true);

  useEffect(() => {
    const element = container.current;
    if (!element || typeof IntersectionObserver === 'undefined') return;

    // Hacen falta las dos condiciones: la pelota puede estar en pantalla pero
    // con la pestaña oculta, o la pestaña visible con la pelota ya scrolleada.
    const visible = { onScreen: true };
    const sync = () => setActive(visible.onScreen && !document.hidden);

    const observer = new IntersectionObserver(
      (entries) => {
        visible.onScreen = entries[0]?.isIntersecting ?? true;
        sync();
      },
      { threshold: 0.05 },
    );
    observer.observe(element);
    document.addEventListener('visibilitychange', sync);

    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', sync);
    };
  }, []);

  return (
    <div
      ref={container}
      /*
       * `touch-pan-y` deja que el gesto vertical siga scrolleando la página:
       * apropiarse del toque entero convertiría la pelota en una trampa en el
       * celular. El cursor sale de CSS puro, sin estado de React de por medio.
       */
      className="relative size-full cursor-grab touch-pan-y active:cursor-grabbing"
      data-ball-preset={preset}
    >
      <Canvas
        frameloop={active ? 'always' : 'never'}
        // Más de 1.5 no se distingue en una esfera lisa y duplica los píxeles
        // a sombrear.
        dpr={[1, 1.5]}
        /*
         * Sin MSAA a propósito. Medido, es lo más caro de toda la escena y en
         * una esfera lisa sobre fondo oscuro casi no se nota: el borde lo
         * suaviza el `dpr`.
         */
        gl={{ antialias: false, alpha: true }}
        camera={{ position: [0, 0, 3.4], fov: 42 }}
        aria-hidden="true"
      >
        {/*
          Sin luces en la escena: el material de matcap trae la iluminación
          horneada, así que agregarlas no cambiaría un píxel.
        */}
        <Ball preset={BALL_PRESETS[preset]} scroll={scroll} />
      </Canvas>
    </div>
  );
}
