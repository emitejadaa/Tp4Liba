'use client';

import { useState } from 'react';
import { ButtonLink } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { Section } from '@/components/ui/Section';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { VENUE } from '@/data/venue';

/**
 * «Dónde jugamos».
 *
 * El mapa arranca como el placeholder del diseño y carga el iframe recién al
 * hacer click. Son dos ventajas por el mismo precio: no se pide nada a Google
 * hasta que alguien lo quiere ver —ni cookies ni tracking de entrada— y la
 * página no arrastra el peso de un iframe que casi nadie mira.
 */
export function Venue() {
  const [mapLoaded, setMapLoaded] = useState(false);

  return (
    <Section id="cancha" aria-labelledby="cancha-titulo" className="bg-[#0a1524]">
      <div className="flex flex-col items-start gap-12 lg:flex-row lg:items-center">
        <div className="w-full lg:w-[420px] lg:shrink-0">
          <SectionHeading id="cancha-titulo" eyebrow={VENUE.eyebrow} className="mb-4">
            {VENUE.title}
          </SectionHeading>
          <p className="text-muted mb-6 text-lg leading-[1.6]">{VENUE.description}</p>
          <ButtonLink
            href={VENUE.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-7 py-3.5 text-base"
          >
            Ver en Maps
            <span className="sr-only"> (se abre en una pestaña nueva)</span>
          </ButtonLink>
        </div>

        <Reveal className="w-full min-w-0 flex-1">
          <div className="border-line-strong relative h-[342px] overflow-hidden rounded-xl border">
            {mapLoaded ? (
              <iframe
                title={`Mapa de ${VENUE.title}`}
                src={VENUE.embedUrl}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="size-full border-0"
              />
            ) : (
              <button
                type="button"
                onClick={() => setMapLoaded(true)}
                className="group bg-ink-raised flex size-full flex-col items-center justify-center gap-3 transition-colors"
              >
                <span className="text-dim group-hover:text-soft text-[13px] tracking-[0.08em] uppercase transition-colors">
                  {VENUE.placeholder}
                </span>
                <span className="text-orange text-sm font-semibold">Tocá para cargar el mapa</span>
              </button>
            )}
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
