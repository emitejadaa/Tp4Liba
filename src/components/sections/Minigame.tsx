import { ShootoutGame } from '@/components/minigame/ShootoutGame';
import { Section } from '@/components/ui/Section';

/** Sección que aloja el minijuego. El diseño la muestra como una única tarjeta. */
export function Minigame() {
  return (
    <Section id="minijuego" bordered={false} className="pt-0" depth>
      <h2 className="sr-only">Minijuego: tirá al aro</h2>
      <ShootoutGame />
    </Section>
  );
}
