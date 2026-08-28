'use client';

import { LibaMark } from '@/components/icons';
import { SITE } from '@/lib/site';

/** Pie de página con la marca y el aviso de copyright del diseño. */
export function Footer() {
  const backToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="border-line border-t py-7">
      <div className="layout-container flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <button
          type="button"
          onClick={backToTop}
          className="group flex items-center gap-2.5"
          aria-label="Volver al inicio de la página"
        >
          <LibaMark className="size-[26px] transition-transform duration-300 motion-safe:group-hover:-translate-y-1.5 motion-safe:group-hover:rotate-180" />
          <span className="font-display text-chalk text-[26px] leading-none font-bold tracking-[0.06em]">
            {SITE.name}
          </span>
        </button>
        <p className="text-dim text-sm">
          © {SITE.season} {SITE.name} · {SITE.tagline} · {SITE.city}
        </p>
      </div>
    </footer>
  );
}
