'use client';

import { useScrollProgress } from '@/hooks/useScrollProgress';

/** Barra fina en el tope que indica cuánto se leyó de la página. */
export function ScrollProgress() {
  const progress = useScrollProgress();

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5">
      <div
        className="bg-orange h-full origin-left transition-transform duration-150 ease-out"
        style={{ transform: `scaleX(${progress})` }}
      />
    </div>
  );
}
