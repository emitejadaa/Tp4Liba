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

## Interacciones

La landing está pensada para leerse scrolleando, así que casi todo se mueve:

- La pelota del encabezado es un objeto 3D real, hecho con Three.js: se la arrastra con el dedo o el
  mouse y sigue girando por inercia al soltarla. La textura de cuero, con costuras y granulado, se
  dibuja por código en vez de traerse como imagen.
- Las tarjetas de El torneo y de Sponsors se inclinan en 3D hacia el puntero.
- Los botones se corren unos píxeles hacia el cursor, con tope para no escaparse de abajo del mouse.
- Los títulos de sección entran escalonados y las filas de la tabla en cascada.
- El minijuego «Tirá al aro» tiene seis trayectorias, confeti al encestar y un fuego de racha que
  sube de nivel cada tres encestadas.

Todo el movimiento son transformaciones y opacidad, y los efectos de puntero miden el elemento una
sola vez al entrar. Medido scrolleando la página entera: 60 cuadros por segundo, ninguno por encima
de 32 ms.

Con `prefers-reduced-motion` no se monta ninguna animación: ni los manejadores de puntero, ni el
confeti, ni las chispas del fuego.

## Integración continua

`.github/workflows/ci.yml` corre en cada push y pull request a `main`, en dos jobs paralelos:

- **Lint, tipos y tests unitarios**: formato, ESLint, `tsc --noEmit`, Vitest con cobertura y build.
- **Tests end-to-end**: Playwright sobre el sitio ya buildeado, con el navegador cacheado por
  versión.

## Deploy

El sitio se publica en **Vercel**, conectado al repositorio: cada push a `main` publica producción y
cada pull request genera una preview propia.

`vercel.json` fija el framework, el directorio de salida del export estático y unas cabeceras de
seguridad, más caché largo para los assets, que llevan hash en el nombre.

`next.config.ts` lee `BASE_PATH` del entorno. En Vercel el sitio vive en la raíz del dominio, así que
la variable queda vacía y no hace falta configurar nada; el prefijo existe por si alguna vez se
publica bajo un subdirectorio.

> Los deployments nuevos arrancan con **Vercel Authentication** activada, que pide iniciar sesión
> para verlos. Para que la landing sea pública hay que apagarla en
> _Project → Settings → Deployment Protection_.
