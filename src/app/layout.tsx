import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'LIBA · Liga amateur de básquet 3v3 en Palermo',
  description:
    'Ocho equipos, siete fechas, un solo campeón. Básquet 3v3 con árbitro oficial, todos los domingos en Palermo.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-AR">
      <body>{children}</body>
    </html>
  );
}
