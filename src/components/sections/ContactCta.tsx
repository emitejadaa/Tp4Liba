'use client';

import { useEffect, useState } from 'react';
import { InstagramIcon, MailIcon, WhatsAppIcon } from '@/components/icons';
import { Reveal } from '@/components/ui/Reveal';
import { Section } from '@/components/ui/Section';
import { SITE } from '@/lib/site';

const SOCIALS = [
  { label: 'Instagram', href: 'https://instagram.com/liba.arg', Icon: InstagramIcon },
  { label: 'WhatsApp', href: 'https://wa.me/5491100000000', Icon: WhatsAppIcon },
  { label: 'Mail', href: `mailto:${SITE.email}`, Icon: MailIcon },
] as const;

/**
 * Cierre de la página con el contacto de la liga.
 *
 * El mail se puede copiar de un toque. El aviso de copiado va en un `role="status"`
 * para que también llegue a quien no ve el cambio de color del botón.
 */
export function ContactCta() {
  const [copied, setCopied] = useState(false);

  // El cartel de «copiado» se borra solo a los dos segundos.
  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(SITE.email);
      setCopied(true);
    } catch {
      // Sin permiso de portapapeles el mail igual queda a la vista para copiarlo a mano.
    }
  };

  return (
    <Section id="contacto" aria-labelledby="contacto-titulo">
      <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
        <Reveal>
          <h2 id="contacto-titulo" className="text-4xl font-bold md:text-[2.75rem]">
            ¿Armás tu equipo?
          </h2>
          <button
            type="button"
            onClick={copyEmail}
            className="text-muted hover:text-orange mt-2.5 inline-flex items-center gap-2 text-xl font-semibold transition-colors"
          >
            {SITE.email}
            <span aria-hidden="true" className="text-sm">
              {copied ? '✓' : '⧉'}
            </span>
            <span className="sr-only">Copiar el mail de contacto</span>
          </button>
          <p role="status" aria-live="polite" className="text-orange mt-1 h-5 text-sm">
            {copied ? 'Mail copiado' : ''}
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <ul className="flex gap-3">
            {SOCIALS.map(({ label, href, Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  target={href.startsWith('mailto:') ? undefined : '_blank'}
                  rel={href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
                  aria-label={`${label} de ${SITE.name}`}
                  className="border-line-strong text-soft hover:border-orange hover:text-orange flex size-[52px] items-center justify-center rounded-[10px] border transition-[color,border-color,transform] duration-200 motion-safe:hover:-translate-y-1"
                >
                  <Icon className="size-5" />
                </a>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </Section>
  );
}
