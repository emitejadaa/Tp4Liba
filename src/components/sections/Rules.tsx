'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Section } from '@/components/ui/Section';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { RULES } from '@/data/rules';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/cn';

/**
 * Reglamento en acordeón.
 *
 * Permite varios ítems abiertos a la vez: son reglas independientes y quien las
 * lee suele querer comparar dos, no ir cerrando la anterior. El primero arranca
 * abierto, como en el diseño.
 */
export function Rules() {
  const [openIds, setOpenIds] = useState<readonly string[]>([RULES[0]!.id]);
  const prefersReduced = useReducedMotion();

  const toggle = (id: string) =>
    setOpenIds((current) =>
      current.includes(id) ? current.filter((open) => open !== id) : [...current, id],
    );

  return (
    <Section id="reglamento" aria-labelledby="reglamento-titulo">
      <SectionHeading id="reglamento-titulo">Reglamento</SectionHeading>

      <div className="max-w-[940px]">
        {RULES.map((rule) => {
          const isOpen = openIds.includes(rule.id);
          const panelId = `regla-${rule.id}`;
          const buttonId = `${panelId}-boton`;

          return (
            <div
              key={rule.id}
              className={cn(
                'bg-ink-raised mb-3 rounded-xl border transition-colors duration-300',
                isOpen ? 'border-orange/40' : 'border-line-card hover:border-line-strong',
              )}
            >
              <h3>
                <button
                  type="button"
                  id={buttonId}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => toggle(rule.id)}
                  className="flex w-full items-center justify-between gap-4 px-7 py-5 text-left"
                >
                  <span
                    className={cn(
                      'font-display text-[26px] leading-none font-bold uppercase transition-colors',
                      isOpen ? 'text-orange' : 'text-chalk',
                    )}
                  >
                    {rule.title}
                  </span>
                  <span
                    aria-hidden="true"
                    className={cn(
                      'text-2xl leading-none transition-transform duration-300',
                      isOpen ? 'text-orange rotate-180' : 'text-muted',
                    )}
                  >
                    {isOpen ? '−' : '+'}
                  </span>
                </button>
              </h3>

              <AnimatePresence initial={false}>
                {isOpen ? (
                  <motion.div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    initial={prefersReduced ? undefined : { height: 0, opacity: 0 }}
                    animate={prefersReduced ? undefined : { height: 'auto', opacity: 1 }}
                    exit={prefersReduced ? undefined : { height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="text-muted px-7 pb-6 text-[17px] leading-[1.7]">{rule.body}</p>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
