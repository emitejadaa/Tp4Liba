# LIBA — Landing del torneo

Landing de **LIBA**, una liga amateur de básquet 3v3 que se juega los domingos en Palermo, Buenos
Aires. La página está construida a partir del diseño de Figma del torneo y suma interacciones de
scroll, hover y tap, además de un minijuego de tiro al aro.

## Stack

| Herramienta                                                    | Para qué                                   |
| -------------------------------------------------------------- | ------------------------------------------ |
| [Next.js](https://nextjs.org) (App Router, `output: 'export'`) | Sitio estático con buen SEO                |
| TypeScript en modo estricto                                    | Tipado de datos y lógica del juego         |
| [Tailwind CSS v4](https://tailwindcss.com)                     | Estilos a partir de los tokens del diseño  |
| [Motion](https://motion.dev)                                   | Reveals al scroll, parallax y transiciones |
| [Vitest](https://vitest.dev) + Testing Library                 | Tests unitarios y de componentes           |
| [Playwright](https://playwright.dev)                           | Tests end-to-end                           |

## Puesta en marcha

```bash
npm install
npm run dev      # http://localhost:3000
```

## Scripts

| Script                  | Qué hace                                     |
| ----------------------- | -------------------------------------------- |
| `npm run dev`           | Servidor de desarrollo                       |
| `npm run build`         | Genera el sitio estático en `out/`           |
| `npm run serve`         | Sirve `out/` en el puerto 3100               |
| `npm run lint`          | ESLint                                       |
| `npm run typecheck`     | `tsc --noEmit`                               |
| `npm test`              | Tests unitarios                              |
| `npm run test:coverage` | Tests unitarios con cobertura                |
| `npm run test:e2e`      | Tests end-to-end (buildea y sirve el export) |
| `npm run format`        | Formatea con Prettier                        |

## Estructura

```
src/
  app/           layout, página y estilos globales
  components/    layout, secciones, primitivos de UI y minijuego
  hooks/         hooks de scroll, viewport y accesibilidad
  lib/           lógica pura (minijuego, ordenamientos, validación)
  data/          contenido de la landing
public/assets/   imágenes e íconos exportados del diseño
tests/e2e/       specs de Playwright
```

## Tests

Los tests unitarios cubren la lógica pura (minijuego, ordenamiento de la tabla, validación del
formulario), los hooks y el comportamiento de cada componente. Los end-to-end recorren la página ya
construida en Chromium: navegación, acordeón, tabla ordenable, carga diferida del mapa, una partida
del minijuego con el reloj controlado y el flujo completo del formulario de inscripción.

```bash
npm test        # unitarios
npm run test:e2e   # end-to-end (buildea y sirve el export)
```

En entornos que ya traen un Chromium propio, `PW_CHROMIUM` permite apuntar a ese binario y evitar la
descarga:

```bash
PW_CHROMIUM=/ruta/al/chrome npm run test:e2e
```

## Integración continua

`.github/workflows/ci.yml` corre en cada push y pull request a `main`, en dos jobs paralelos:

- **Lint, tipos y tests unitarios**: formato, ESLint, `tsc --noEmit`, Vitest con cobertura y build.
- **Tests end-to-end**: Playwright sobre el sitio ya buildeado, con el navegador cacheado por
  versión.
