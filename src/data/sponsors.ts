export type SponsorTier = {
  id: string;
  name: string;
  summary: string;
  perks: readonly string[];
  /** El plan destacado del diseño, con el badge «Recomendado». */
  featured?: boolean;
};

/** Los tres planes de sponsoreo, con el texto exacto del diseño. */
export const SPONSOR_TIERS: readonly SponsorTier[] = [
  {
    id: 'bronce',
    name: 'Bronce',
    summary: 'Presencia local',
    perks: ['Logo en la web de la liga', 'Mención en redes por fecha', 'Banner en cancha'],
  },
  {
    id: 'plata',
    name: 'Plata',
    summary: 'Presencia en jornada',
    perks: ['Todo lo de Bronce', 'Logo en camiseta de árbitros', 'Activación en 2 fechas'],
  },
  {
    id: 'oro',
    name: 'Oro',
    summary: 'Sponsor principal de la liga',
    perks: [
      'Todo lo de Plata',
      'Nombre en la liga y en el trofeo',
      'Logo en las 8 camisetas',
      'Presencia en las 7 fechas',
    ],
    featured: true,
  },
];

/**
 * Beneficios de la tabla comparativa que el diseño usa en pantallas angostas
 * (nodo 5:1536), donde las tres tarjetas no entran una al lado de la otra.
 */
export type SponsorComparisonRow = { perk: string; tiers: readonly string[] };

export const SPONSOR_COMPARISON: readonly SponsorComparisonRow[] = [
  { perk: 'Logo en la web', tiers: ['bronce', 'plata', 'oro'] },
  { perk: 'Banner en cancha', tiers: ['bronce', 'plata', 'oro'] },
  { perk: 'Logo en camiseta de árbitros', tiers: ['plata', 'oro'] },
  { perk: 'Nombre en la liga y el trofeo', tiers: ['oro'] },
  { perk: 'Logo en las 8 camisetas', tiers: ['oro'] },
];
