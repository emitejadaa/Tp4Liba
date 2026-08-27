import type { ComponentType, SVGProps } from 'react';
import { BallIcon, CardIcon, StopwatchIcon, WhistleIcon } from '@/components/icons';

export type TournamentFact = {
  /** Número de orden, que la vista compacta del diseño muestra como 01–04. */
  index: string;
  title: string;
  description: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
};

/** Las cuatro tarjetas de «El torneo», con el texto exacto del diseño. */
export const TOURNAMENT_FACTS: readonly TournamentFact[] = [
  {
    index: '01',
    title: 'Formato',
    description: '8 equipos, todos contra todos, 7 fechas.',
    Icon: BallIcon,
  },
  {
    index: '02',
    title: 'Partidos',
    description: 'Presenciales, con árbitro oficial en cancha.',
    Icon: WhistleIcon,
  },
  {
    index: '03',
    title: 'Horarios',
    description: 'Domingos de 11:00 a 14:00 hs.',
    Icon: StopwatchIcon,
  },
  {
    index: '04',
    title: 'Inscripción',
    description: '$100.000 por equipo vía Mercado Pago + $25.000 por fecha.',
    Icon: CardIcon,
  },
];
