import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Barlow, Barlow_Condensed } from 'next/font/google';
import { SITE } from '@/lib/site';
import './globals.css';

const barlow = Barlow({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-barlow',
  display: 'swap',
});

const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-barlow-condensed',
  display: 'swap',
});

const description =
  'Ocho equipos, siete fechas, un solo campeón. Básquet 3v3 con árbitro oficial, todos los domingos en Palermo.';

export const metadata: Metadata = {
  title: {
    default: `${SITE.name} · ${SITE.tagline} en Palermo`,
    template: `%s · ${SITE.name}`,
  },
  description,
  keywords: ['básquet', 'basquet 3v3', 'liga amateur', 'Palermo', 'Buenos Aires', 'torneo', 'LIBA'],
  authors: [{ name: SITE.name }],
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    siteName: SITE.name,
    title: `${SITE.name} · ${SITE.tagline}`,
    description,
  },
  twitter: { card: 'summary_large_image', title: SITE.name, description },
  robots: { index: true, follow: true },
};

/** Datos estructurados para que los buscadores entiendan de qué se trata el evento. */
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SportsEvent',
  name: `${SITE.name} · Temporada ${SITE.season}`,
  sport: 'Basketball',
  description,
  location: {
    '@type': 'Place',
    name: SITE.city,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Palermo',
      addressRegion: 'CABA',
      addressCountry: 'AR',
    },
  },
  organizer: { '@type': 'Organization', name: SITE.name, email: SITE.email },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-AR" className={`${barlow.variable} ${barlowCondensed.variable}`}>
      <body>
        {children}
        <script
          type="application/ld+json"
          // El JSON-LD es contenido estático propio, no entrada de usuario.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
