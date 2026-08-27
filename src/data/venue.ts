/** Datos de la cancha, con el texto del diseño. */
export const VENUE = {
  eyebrow: 'Dónde jugamos',
  title: 'Palermo, Buenos Aires',
  description:
    'Canchas al lado de Williamsburg, Palermo. Dos canchas en simultáneo, todos los domingos de 11:00 a 14:00 hs.',
  placeholder: '[ mapa embebido — Google Maps ]',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Williamsburg+Palermo+Buenos+Aires',
  /** El `embed` de Maps sin API key funciona con el modo `q`. */
  embedUrl: 'https://www.google.com/maps?q=Williamsburg+Palermo+Buenos+Aires&output=embed',
} as const;
