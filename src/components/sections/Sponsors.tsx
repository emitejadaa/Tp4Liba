'use client';

import { PerkBallIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { Pill } from '@/components/ui/Badge';
import { Reveal3D } from '@/components/ui/Reveal3D';
import { Section } from '@/components/ui/Section';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { TiltCard } from '@/components/ui/TiltCard';
import { SPONSOR_COMPARISON, SPONSOR_TIERS } from '@/data/sponsors';
import { cn } from '@/lib/cn';

/** Color del título de cada plan, como en el diseño. */
const TIER_TITLE_COLOR: Record<string, string> = {
  bronce: 'text-[#cd7f32]',
  plata: 'text-soft',
  oro: 'text-orange',
};

type SponsorsProps = { onSponsor?: (tierId: string) => void };

/**
 * «Tu marca en la cancha»: los tres planes de sponsoreo.
 *
 * En desktop son tres tarjetas; en pantallas angostas el diseño las resuelve
 * como una tabla comparativa con puntos y guiones, que es mucho más legible que
 * apilar tres listas de beneficios repetidos.
 */
export function Sponsors({ onSponsor }: SponsorsProps) {
  return (
    <Section id="sponsors" aria-labelledby="sponsors-titulo" className="border-b bg-[#0a1524]" depth>
      <SectionHeading id="sponsors-titulo" eyebrow="Sponsors" className="max-w-[720px]">
        Tu marca en la cancha
      </SectionHeading>
      <p className="text-muted -mt-6 mb-10 max-w-[720px] text-lg leading-[1.6]">
        Siete domingos de juego, ocho equipos y una comunidad de básquet en Palermo. Elegí cómo
        acompañar la temporada.
      </p>

      {/* Tarjetas: la vista principal del diseño, a partir de 1024px. */}
      <ul aria-label="Planes de sponsoreo" className="hidden gap-5 lg:grid lg:grid-cols-3">
        {SPONSOR_TIERS.map((tier, index) => (
          <Reveal3D
            as="li"
            key={tier.id}
            className="group/tilt"
            delay={index * 0.11}
            // La de Oro llega desde más atrás y un toque después: entra última y
            // desde más lejos, que es lo que la despega de las otras dos.
            depth={tier.featured ? 150 : 90}
            rotate={tier.featured ? 18 : 12}
          >
            <TiltCard
              maxDegrees={tier.featured ? 9 : 6}
              className={cn(
                'relative flex h-full flex-col rounded-[14px] border p-[33px] transition-shadow duration-300',
                tier.featured
                  ? 'border-[rgb(249_115_22/0.55)] bg-[#142138] shadow-[0_0_40px_-20px_#f97316] hover:shadow-[0_0_70px_-18px_#f97316]'
                  : 'border-line-card bg-ink-raised hover:border-line-strong',
              )}
            >
              {tier.featured ? (
                <Pill className="absolute -top-[13px] left-8">Recomendado</Pill>
              ) : null}

              <h3
                className={cn(
                  'text-[30px] leading-none font-bold',
                  TIER_TITLE_COLOR[tier.id] ?? 'text-chalk',
                )}
              >
                {tier.name}
              </h3>
              <p className={cn('mt-1.5 text-[15px]', tier.featured ? 'text-muted' : 'text-dim')}>
                {tier.summary}
              </p>

              <ul className="mt-4 flex flex-1 flex-col gap-3 pb-5">
                {tier.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-2.5">
                    <PerkBallIcon className="text-orange mt-1 size-[17px] shrink-0" />
                    <span className={tier.featured ? 'text-[#e2e8f0]' : 'text-soft'}>{perk}</span>
                  </li>
                ))}
              </ul>

              <Button
                size="sm"
                variant={tier.featured ? 'primary' : 'secondary'}
                className="w-full justify-center py-[14px]"
                onClick={() => onSponsor?.(tier.id)}
              >
                Quiero ser sponsor
              </Button>
            </TiltCard>
          </Reveal3D>
        ))}
      </ul>

      {/* Tabla comparativa: la variante del diseño para pantallas angostas. */}
      <div className="lg:hidden">
        {/* `relative` por lo mismo que en la tabla de posiciones. */}
        <div className="border-line-card relative overflow-x-auto rounded-[14px] border">
          <table className="w-full min-w-[420px] border-collapse text-left">
            <caption className="sr-only">Beneficios incluidos en cada plan de sponsoreo</caption>
            <thead>
              <tr className="border-line-card border-b">
                <th
                  scope="col"
                  className="text-dim px-4 py-4 text-xs font-semibold tracking-[0.12em] uppercase"
                >
                  Beneficio
                </th>
                {SPONSOR_TIERS.map((tier) => (
                  <th
                    key={tier.id}
                    scope="col"
                    className={cn(
                      'font-display px-3 py-4 text-center text-xl font-bold',
                      TIER_TITLE_COLOR[tier.id] ?? 'text-chalk',
                      tier.featured && 'bg-[#142138]',
                    )}
                  >
                    {tier.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SPONSOR_COMPARISON.map((row) => (
                <tr key={row.perk} className="border-line-card border-b last:border-b-0">
                  <th scope="row" className="text-soft px-4 py-4 text-[15px] font-normal">
                    {row.perk}
                  </th>
                  {SPONSOR_TIERS.map((tier) => {
                    const included = row.tiers.includes(tier.id);
                    return (
                      <td
                        key={tier.id}
                        className={cn('px-3 py-4 text-center', tier.featured && 'bg-[#142138]')}
                      >
                        <span className={included ? 'text-orange' : 'text-dim'}>
                          {included ? '●' : '—'}
                        </span>
                        <span className="sr-only">
                          {included ? 'incluido' : 'no incluido'} en {tier.name}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          {SPONSOR_TIERS.map((tier) => (
            <Button
              key={tier.id}
              size="sm"
              variant={tier.featured ? 'primary' : 'secondary'}
              className="flex-1"
              onClick={() => onSponsor?.(tier.id)}
            >
              Quiero {tier.name}
            </Button>
          ))}
        </div>
      </div>
    </Section>
  );
}
