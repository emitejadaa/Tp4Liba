import { ShootoutGame } from '@/components/minigame/ShootoutGame';
import { Section } from '@/components/ui/Section';

/**
 * Sección que aloja el minijuego. El diseño la muestra como una única tarjeta.
 *
 * Es la única sección de la página **sin** cámara de profundidad, y es a
 * propósito. El juego se apunta arrastrando sobre la cancha, y la cámara la
 * inclina en 3D con el scroll: un arrastre en pantalla entra a la cancha
 * deformado —la perspectiva comprime el eje vertical y no el horizontal— así que
 * el mismo gesto salía como un tiro de sesenta grados con la sección derecha y
 * de cuarenta con la sección inclinada. Se puede corregir la cuenta, pero
 * quedaría igual el problema de fondo: no se puede apuntar bien a algo que se
 * está moviendo debajo del dedo.
 *
 * Los planos del fondo y el tono que viaja sí se quedan: no tocan el contenido.
 */
export function Minigame() {
  return (
    <Section id="minijuego" bordered={false} className="pt-0" mark="key" drift="#09141f">
      <h2 className="sr-only">Minijuego: tirá al aro</h2>
      <ShootoutGame />
    </Section>
  );
}
