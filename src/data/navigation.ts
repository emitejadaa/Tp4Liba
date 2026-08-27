/** Enlaces del nav. Los `id` tienen que coincidir con los de cada `<Section>`. */
export const NAV_LINKS = [
  { id: 'tabla', label: 'Tabla' },
  { id: 'cronograma', label: 'Cronograma' },
  { id: 'reglamento', label: 'Reglamento' },
] as const;

/** Secciones que sigue el scroll-spy, en el orden en que aparecen. */
export const SPY_SECTIONS = [
  'torneo',
  'minijuego',
  'sponsors',
  'tabla',
  'cronograma',
  'reglamento',
  'cancha',
] as const;
