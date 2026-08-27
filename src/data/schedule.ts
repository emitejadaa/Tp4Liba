export type Match = {
  id: string;
  home: string;
  away: string;
  court: string;
  time: string;
  /** Línea de cierre de la jornada, sin partido asociado. */
  note?: string;
};

/** Fecha 1 del cronograma, con los cruces y horarios del diseño. */
export const SCHEDULE = {
  round: 'Fecha 1',
  when: 'Domingo · 11:00 a 14:00 hs',
  matches: [
    {
      id: 'halcones-rebote',
      home: 'Los Halcones',
      away: 'Rebote Club',
      court: 'Cancha 1',
      time: '11:00',
    },
    {
      id: 'ballers-poste',
      home: 'Palermo Ballers',
      away: 'Doble Poste',
      court: 'Cancha 2',
      time: '11:00',
    },
    {
      id: 'triple-costa',
      home: 'Triple Doble',
      away: 'Costa Rica FC',
      court: 'Cancha 1',
      time: '12:15',
    },
    {
      id: 'bajoaro-pibes',
      home: 'Bajo Aro',
      away: 'Los Pibes del Fondo',
      court: 'Cancha 2',
      time: '12:15',
    },
  ] satisfies readonly Match[],
  closing: { time: '13:30', note: 'Cierre de fecha · tiros libres abiertos' },
} as const;
