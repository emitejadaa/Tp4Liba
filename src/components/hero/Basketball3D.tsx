'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { createBasketballMaps } from '@/lib/basketball-texture';

/** Vueltas por segundo del giro en reposo. */
const IDLE_SPIN = 0.22;

/** Cuánto conserva la velocidad en cada cuadro al soltar: da la inercia. */
const FRICTION = 0.94;

/** Radianes de giro por píxel arrastrado. */
const DRAG_SENSITIVITY = 0.007;

/** Tope de velocidad, para que un manotazo no la deje girando eterna. */
const MAX_SPIN = 9;

/** Progreso de scroll de la sección, de 0 a 1, leído sin re-renderizar. */
export type ScrollSource = { get: () => number };

type BallProps = { scroll?: ScrollSource };

/**
 * La esfera, su textura y el arrastre.
 *
 * El estado del arrastre vive acá adentro, en una ref: cambia en cada evento de
 * puntero y llevarlo a estado de React re-renderizaría decenas de veces por
 * segundo, que es justo lo que un lienzo 3D no puede permitirse.
 */
function Ball({ scroll }: BallProps) {
  const mesh = useRef<THREE.Mesh>(null);
  const drag = useRef({
    dragging: false,
    last: { x: 0, y: 0 },
    /** Radianes por segundo; decae por fricción al soltar. */
    velocity: { x: 0, y: 0 },
    /** Giro acumulado desde el último cuadro, en radianes. */
    pending: { x: 0, y: 0 },
  });
  const canvas = useThree((state) => state.gl.domElement);

  const { map, bumpMap } = useMemo(() => {
    const maps = createBasketballMaps();
    const color = new THREE.CanvasTexture(maps.color);
    const bump = new THREE.CanvasTexture(maps.bump);
    // La textura da la vuelta completa, así que se repite en la longitud.
    color.wrapS = bump.wrapS = THREE.RepeatWrapping;
    color.anisotropy = 8;
    color.colorSpace = THREE.SRGBColorSpace;
    return { map: color, bumpMap: bump };
  }, []);

  // Las texturas reservan memoria de video: hay que liberarlas al desmontar.
  useEffect(() => () => [map, bumpMap].forEach((texture) => texture.dispose()), [map, bumpMap]);

  useEffect(() => {
    const state = drag.current;

    const onPointerDown = (event: PointerEvent) => {
      state.dragging = true;
      state.last = { x: event.clientX, y: event.clientY };
      state.velocity = { x: 0, y: 0 };
      canvas.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!state.dragging) return;

      const dx = event.clientX - state.last.x;
      const dy = event.clientY - state.last.y;
      state.last = { x: event.clientX, y: event.clientY };

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

  useFrame((_, delta) => {
    const ball = mesh.current;
    const state = drag.current;
    if (!ball) return;

    // El delta se acota para que volver de una pestaña en segundo plano no
    // dispare la pelota media vuelta de golpe.
    const step = Math.min(delta, 0.05);

    ball.rotation.y += state.pending.y;
    ball.rotation.x += state.pending.x;
    state.pending = { x: 0, y: 0 };

    if (!state.dragging) {
      ball.rotation.y += (state.velocity.y + IDLE_SPIN) * step;
      ball.rotation.x += state.velocity.x * step;

      // Fricción independiente de los Hz de la pantalla.
      const decay = Math.pow(FRICTION, step * 60);
      state.velocity = { x: state.velocity.x * decay, y: state.velocity.y * decay };
    }

    // Al scrollear la pelota se hunde y se inclina, acompañando a la sección.
    const progress = scroll?.get() ?? 0;
    ball.position.y = -progress * 0.55;
    ball.rotation.z = progress * 0.4;
  });

  return (
    <mesh ref={mesh} rotation={[0.25, 0.6, 0]}>
      {/* 64×48 son unos 6.000 triángulos: a este tamaño en pantalla la silueta
          ya se ve redonda y subir la malla sólo agrega costo. */}
      <sphereGeometry args={[1, 64, 48]} />
      <meshStandardMaterial
        map={map}
        bumpMap={bumpMap}
        bumpScale={0.9}
        roughness={0.82}
        metalness={0.04}
      />
    </mesh>
  );
}

/**
 * Pelota de básquet en 3D, arrastrable.
 *
 * Se la puede girar con el dedo o el mouse y sigue girando por inercia al
 * soltarla; en reposo gira sola despacio. El lienzo se congela cuando la
 * sección sale de pantalla o se oculta la pestaña: un bucle de render 3D
 * corriendo de fondo es de lo más caro que puede hacer una landing.
 */
export default function Basketball3D({ scroll }: { scroll?: ScrollSource }) {
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
    >
      <Canvas
        frameloop={active ? 'always' : 'never'}
        // Más de 1.5 no se distingue en una esfera lisa y duplica los píxeles
        // a sombrear.
        dpr={[1, 1.5]}
        /*
         * Sin MSAA a propósito. Medido, es lo más caro de toda la escena
         * —cuesta más que el relieve del cuero— y en una esfera lisa sobre
         * fondo oscuro casi no se nota: el borde lo suaviza el `dpr`.
         */
        gl={{ antialias: false, alpha: true }}
        camera={{ position: [0, 0, 3.15], fov: 42 }}
        aria-hidden="true"
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[-2.4, 3, 3]} intensity={2.5} color="#fff3e6" />
        <directionalLight position={[3, -1.5, 1.5]} intensity={0.7} color="#f97316" />
        <Ball scroll={scroll} />
      </Canvas>
    </div>
  );
}
