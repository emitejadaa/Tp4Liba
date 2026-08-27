export type Rule = { id: string; title: string; body: string };

/**
 * Reglamento del torneo. En el diseño el primer ítem viene abierto y el resto
 * cerrados, así que ese es el estado inicial del acordeón.
 */
export const RULES: readonly Rule[] = [
  {
    id: 'formato-de-juego',
    title: 'Formato de juego',
    body: 'Partidos 3v3 en media cancha, dos tiempos de 10 minutos con reloj corrido. Cambios ilimitados en muerto. Posesión inicial por sorteo y check-ball detrás de la línea de 6,75 m tras cada canasta.',
  },
  {
    id: 'presentacion-de-equipos',
    title: 'Presentación de equipos',
    body: 'Cada equipo se presenta con un mínimo de tres jugadores y hasta dos suplentes. La acreditación cierra 15 minutos antes del horario del partido; pasados 10 minutos de tolerancia se pierde por no presentación.',
  },
  {
    id: 'sistema-de-puntaje',
    title: 'Sistema de puntaje',
    body: 'Los tiros dentro del arco valen 1 punto y los de afuera 2. En la tabla, cada partido ganado suma 2 puntos y cada perdido 1. Los desempates se resuelven por partidos ganados y después por diferencia de puntos.',
  },
  {
    id: 'codigo-de-conducta',
    title: 'Código de conducta',
    body: 'La decisión del árbitro es final. Las faltas antideportivas se sancionan con tiro libre y posesión; la segunda implica expulsión del partido. Las agresiones verbales o físicas se sancionan con la exclusión del equipo del torneo.',
  },
];
