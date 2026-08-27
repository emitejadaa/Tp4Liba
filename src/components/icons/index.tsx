import type { SVGProps } from 'react';

/*
 * Íconos exportados del diseño de Figma y convertidos a componentes para que
 * hereden el color del texto (`currentColor`) y puedan animarse en hover, algo
 * que un `<img>` no permite. La geometría —viewBox de 30×30 y trazo de 2.125—
 * es la del archivo original.
 */

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  viewBox: '0 0 30 30',
  fill: 'none',
  xmlns: 'http://www.w3.org/2000/svg',
  strokeWidth: 2.125,
  stroke: 'currentColor',
  'aria-hidden': true,
  focusable: false,
} as const;

/** Pelota de básquet: formato del torneo y logo de la liga. */
export function BallIcon(props: IconProps) {
  return (
    <svg width={30} height={30} {...base} {...props}>
      <path d="M15 26.25C21.2132 26.25 26.25 21.2132 26.25 15C26.25 8.7868 21.2132 3.75 15 3.75C8.7868 3.75 3.75 8.7868 3.75 15C3.75 21.2132 8.7868 26.25 15 26.25Z" />
      <path d="M3.75 15H26.25M15 3.75V26.25M7.5 6.25C11.25 11.25 11.25 18.75 7.5 23.75M22.5 6.25C18.75 11.25 18.75 18.75 22.5 23.75" />
    </svg>
  );
}

/** Silbato de árbitro: partidos presenciales. */
export function WhistleIcon(props: IconProps) {
  return (
    <svg width={30} height={30} {...base} {...props}>
      <path d="M5 3.75H25V10H5V3.75Z" />
      <path d="M10 10H20V13.75H10V10Z" />
      <path d="M10 13.75L11.875 21.25H18.125L20 13.75" />
      <path d="M15 10V21.25" />
    </svg>
  );
}

/** Cronómetro: horarios de juego. */
export function StopwatchIcon(props: IconProps) {
  return (
    <svg width={30} height={30} {...base} {...props}>
      <path d="M15 26.25C20.5228 26.25 25 21.7728 25 16.25C25 10.7272 20.5228 6.25 15 6.25C9.47715 6.25 5 10.7272 5 16.25C5 21.7728 9.47715 26.25 15 26.25Z" />
      <path d="M15 11.25V16.25L18.75 18.75M11.25 2.5H18.75M23.75 7.5L25.625 5.625" />
    </svg>
  );
}

/** Tarjeta: costo de inscripción. */
export function CardIcon(props: IconProps) {
  return (
    <svg width={30} height={30} {...base} {...props}>
      <path d="M3.75 8.75H26.25V21.25H3.75V8.75Z" />
      <path d="M3.75 13.75H26.25" />
      <path d="M9.375 19.625C10.2034 19.625 10.875 18.9534 10.875 18.125C10.875 17.2966 10.2034 16.625 9.375 16.625C8.54657 16.625 7.875 17.2966 7.875 18.125C7.875 18.9534 8.54657 19.625 9.375 19.625Z" />
    </svg>
  );
}

/** Isotipo de LIBA: la pelota rellena en naranja del nav y del footer. */
export function LibaMark(props: IconProps) {
  return (
    <svg
      width={30}
      height={30}
      viewBox="0 0 30 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path
        d="M15 28.5C22.4558 28.5 28.5 22.4558 28.5 15C28.5 7.54416 22.4558 1.5 15 1.5C7.54416 1.5 1.5 7.54416 1.5 15C1.5 22.4558 7.54416 28.5 15 28.5Z"
        fill="#F97316"
      />
      <path d="M1.5 15H28.5M15 1.5V28.5" stroke="#07111F" strokeWidth={1.65} />
      <path
        d="M5.25 5.25C11.25 9.75 11.25 20.25 5.25 24.75M24.75 5.25C18.75 9.75 18.75 20.25 24.75 24.75"
        stroke="#07111F"
        strokeWidth={1.65}
      />
    </svg>
  );
}

/** Marca de verificación de las listas de sponsors. */
export function CheckIcon(props: IconProps) {
  return (
    <svg width={16} height={16} {...base} viewBox="0 0 16 16" strokeWidth={2} {...props}>
      <path d="M3 8.5L6.5 12L13 4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
