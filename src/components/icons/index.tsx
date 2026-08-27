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

/**
 * Viñeta de las listas de sponsors: una pelota en miniatura, no un tilde.
 * Sale del nodo 4:331 del diseño, con su trazo de 1.275 sobre 17×17.
 */
export function PerkBallIcon(props: IconProps) {
  return (
    <svg width={17} height={17} {...base} viewBox="0 0 17 17" strokeWidth={1.275} {...props}>
      <path d="M8.5 14.875C12.0208 14.875 14.875 12.0208 14.875 8.5C14.875 4.97918 12.0208 2.125 8.5 2.125C4.97918 2.125 2.125 4.97918 2.125 8.5C2.125 12.0208 4.97918 14.875 8.5 14.875Z" />
      <path d="M2.125 8.5H14.875M8.5 2.125V14.875" />
    </svg>
  );
}

/*
 * Íconos de contacto del cierre de la página. Comparten la geometría del
 * diseño: 20×20 con trazo de 1.41667.
 */
const contact = { ...base, strokeWidth: 1.41667, viewBox: '0 0 20 20' } as const;

export function InstagramIcon(props: IconProps) {
  return (
    <svg width={20} height={20} {...contact} {...props}>
      <path d="M13.3333 2.5H6.66667C4.36548 2.5 2.5 4.36548 2.5 6.66667V13.3333C2.5 15.6345 4.36548 17.5 6.66667 17.5H13.3333C15.6345 17.5 17.5 15.6345 17.5 13.3333V6.66667C17.5 4.36548 15.6345 2.5 13.3333 2.5Z" />
      <path d="M10 13.3333C11.8409 13.3333 13.3333 11.8409 13.3333 10C13.3333 8.15905 11.8409 6.66667 10 6.66667C8.15905 6.66667 6.66667 8.15905 6.66667 10C6.66667 11.8409 8.15905 13.3333 10 13.3333Z" />
      <path d="M14.3333 6.5C14.7936 6.5 15.1667 6.1269 15.1667 5.66667C15.1667 5.20643 14.7936 4.83333 14.3333 4.83333C13.8731 4.83333 13.5 5.20643 13.5 5.66667C13.5 6.1269 13.8731 6.5 14.3333 6.5Z" />
    </svg>
  );
}

export function WhatsAppIcon(props: IconProps) {
  return (
    <svg width={20} height={20} {...contact} {...props}>
      <path d="M17.5 10C17.5058 11.2951 17.1761 12.5697 16.543 13.6996C15.9099 14.8295 14.995 15.7762 13.8873 16.4474C12.7797 17.1187 11.5171 17.4917 10.2225 17.5302C8.92795 17.5686 7.64548 17.2711 6.5 16.6667L2.5 17.5L3.41667 13.6667C2.87081 12.6663 2.5601 11.5546 2.50816 10.4162C2.45622 9.27771 2.6644 8.14239 3.1169 7.09644C3.56939 6.05049 4.2543 5.12141 5.1196 4.37976C5.9849 3.63812 7.00783 3.10343 8.1107 2.81629C9.21357 2.52915 10.3674 2.49712 11.4845 2.72264C12.6016 2.94815 13.6526 3.42527 14.5577 4.11777C15.4628 4.81026 16.1982 5.69992 16.708 6.71916C17.2179 7.7384 17.4887 8.86042 17.5 10Z" />
      <path
        d="M7.16667 7.83333C7.66667 9.83333 10.1667 12.3333 12.1667 12.8333L13.1667 11.6667L11.5833 10.8333L10.8333 11.5C10.0833 11.0833 9.25 10.25 8.83333 9.5L9.5 8.75L8.66667 7.16667L7.16667 8.16667V7.83333Z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <svg width={20} height={20} {...contact} {...props}>
      <path d="M15.8333 4.16667H4.16667C3.24619 4.16667 2.5 4.91286 2.5 5.83333V14.1667C2.5 15.0871 3.24619 15.8333 4.16667 15.8333H15.8333C16.7538 15.8333 17.5 15.0871 17.5 14.1667V5.83333C17.5 4.91286 16.7538 4.16667 15.8333 4.16667Z" />
      <path d="M2.91667 5.41667L10 10.8333L17.0833 5.41667" />
    </svg>
  );
}
