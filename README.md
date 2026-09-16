# LIBA — Landing del torneo

Landing de **LIBA**, una liga amateur de básquet 3v3 que se juega los domingos en Palermo, Buenos
Aires. La página está construida a partir del diseño de Figma del torneo y suma interacciones de
scroll, hover y tap, además de un minijuego de tiro al aro.

## Stack

| Herramienta                                                    | Para qué                                  |
| -------------------------------------------------------------- | ----------------------------------------- |
| [Next.js](https://nextjs.org) (App Router, `output: 'export'`) | Sitio estático con buen SEO               |
| TypeScript en modo estricto                                    | Tipado de datos y lógica del juego        |
| [Tailwind CSS v4](https://tailwindcss.com)                     | Estilos a partir de los tokens del diseño |
| [Motion](https://motion.dev)                                   | Movimiento atado a React: scroll y layout |
| [anime.js](https://animejs.com)                                | Coreografías sueltas y trazado de SVG     |
| [scroll-craft](https://github.com/nateherkai/scroll-craft)     | Dispositivos de scroll por atributos      |
| [Vitest](https://vitest.dev) + Testing Library                 | Tests unitarios y de componentes          |
| [Playwright](https://playwright.dev)                           | Tests end-to-end                          |

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
  lib/anim/      vocabulario de movimiento y ciclo de las transiciones
  data/          contenido de la landing
  vendor/        motor de scroll-craft, copiado sin editar
public/assets/   imágenes e íconos exportados del diseño
tests/e2e/       specs de Playwright
```

## Tests

Los tests unitarios cubren la lógica pura (minijuego, ordenamiento de la tabla, validación del
formulario), los hooks y el comportamiento de cada componente. Los end-to-end recorren la página ya
construida en Chromium: navegación, acordeón, tabla ordenable, carga diferida del mapa, una partida
del minijuego con el reloj controlado y el flujo completo del formulario de inscripción.

`responsive.spec.ts` la recorre además en ocho tamaños —del teléfono plegado de 320 px a la pantalla
de 1920, pasando por el teléfono **apaisado**, que es corto y es el caso que siempre se olvida— y
verifica tres cosas en cada uno: que la página no se arrastre para el costado en ningún punto del
scroll, que todo lo que se toca llegue a los 24×24 px del criterio 2.5.8 de las WCAG 2.2, y que el
título y la acción principal entren enteros en la primera pantalla.

`animaciones.spec.ts` verifica lo que sólo existe con movimiento: el parallax del encabezado, la
profundidad de las secciones, los planos del fondo viajando a distinta velocidad, el tinte del fondo
a lo largo del recorrido y la solapa que tapa el salto entre secciones.

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

La landing está pensada para leerse scrolleando, así que el scroll es la línea de tiempo: casi todo
lo que se mueve se mueve porque alguien está bajando por la página.

### Tres motores, tres trabajos

Son tres librerías y cada una hace lo que hace bien. La curva de todas sale del mismo lugar,
`lib/anim/tokens.ts`, así que dos cosas que arrancan juntas terminan juntas.

- **Motion** maneja lo que está atado al estado de React: la profundidad de cada sección con el
  scroll, el parallax del encabezado, el reacomodo de la tabla de posiciones, el diálogo de
  inscripción.
- **anime.js** maneja las coreografías sueltas, que son disparos y no estados: el título que se
  arma palabra por palabra, las líneas de cancha que se dibujan como con tiza, la solapa de las
  transiciones y los números del marcador que se dan vuelta al cambiar.
- **El motor de scroll-craft** maneja los dispositivos de scroll declarativos. Se marca el HTML con
  atributos `data-sc-*` y el motor los mueve desde un único bucle, sin pasar por React: los planos
  de profundidad del fondo (`data-sc-parallax`), el tono del fondo de la página que viaja de sección
  en sección (`data-sc-drift`) y la luz que sigue al puntero (`data-sc-spotlight`). Además publica en
  cada sección su propio avance como la variable CSS `--sc-p`, y de ahí sale, con una sola regla de
  CSS y cero JavaScript, la inclinación de todas las placas del fondo.

El motor está copiado tal cual en `src/vendor/scrollcraft/`, que explica en su README por qué no se
lo edita y cómo se lo tematiza con los tokens del diseño.

### Sobre Barba.js

**No está, y es a propósito.** Barba resuelve la navegación entre documentos: intercepta el click,
baja la otra página, reemplaza el contenedor y anima el cambio. Esta landing es una sola ruta de
Next exportada a un único HTML y sus enlaces son anclas dentro de esa misma página, así que no hay
segundo documento que traer. Inicializarlo acá sería pedirle por red la misma página para reemplazar
con ella el árbol que React está manejando: se rompe la hidratación y no se gana nada.

Lo que sí se tomó es su modelo, que es la parte que vale. `lib/anim/transition.ts` implementa el
mismo ciclo —`once`, `leave`, cambio, `enter`— con el salto de scroll en el lugar del cambio de
contenedor: la solapa tapa, el salto pasa instantáneo por detrás y la solapa se va. Se llega igual de
rápido que con un scroll suave y, a diferencia de un borrón de media página, se entiende que se
cambió de lugar.

### Lo que se ve

- **Profundidad en todo el recorrido.** Cada sección llega desde el fondo, se planta de frente
  mientras se la lee y se va al fondo al salir, con una meseta en el medio para que leer no sea leer
  algo inclinado. Detrás de cada una hay tres planos —una marca de cancha, dos rayas y un resplandor—
  que viajan a distinta velocidad y se inclinan con el avance: la diferencia entre ellos es lo que
  arma la perspectiva.
- **El fondo viaja.** El color de la página se va corriendo unos puntos de luminosidad de sección en
  sección. No se nota en la transición; se nota al llegar abajo.
- **Un solo idioma para «esto cambió».** La solapa que gira desde su borde de arriba está en las
  filas de la tabla, en los números del marcador y en el pase entre secciones.
- **La pelota del encabezado es geometría, dibujada con líneas.** Las cuatro costuras de una pelota
  de ocho paneles son curvas sobre una esfera: se las calcula en 3D, se las gira y se las proyecta a
  trazos de SVG, cuadro a cuadro (`lib/ball-wireframe.ts`). Se mece despacio y el scroll la rota un
  poco más, dentro de un arco de cincuenta grados: pasado eso, el eje de los arcos laterales apunta a
  la cámara, se convierten en anillos concéntricos y la pelota deja de leerse como pelota.

  Antes era una esfera de Three.js con textura y matcap, y se fue por tres razones. Llegaba a
  pantalla ya rasterizada, con el borde lavado. Crecía a 1,35 al scrollear, así que a media pantalla
  la sección la cortaba al ras y el resto quedaba atrás del nav. Y era el único objeto fotográfico
  de una página hecha de líneas finas. La versión vectorial se ve nítida en cualquier pantalla, pesa
  cuatro `<path>`, y sacó `three` y `@react-three/fiber` del bundle.

- **Las tarjetas se inclinan en 3D hacia el puntero**, y la luz que las cruza es una sola por sección
  en vez de una por tarjeta.
- **Los botones se corren unos píxeles hacia el cursor**, con tope para no escaparse de abajo del
  mouse.
- **Los títulos de sección entran girando desde el fondo**, con la etiqueta adelantándose al título.
- **El minijuego «Tirá al aro»** tiene seis trayectorias, confeti al encestar y un fuego de racha que
  sube de nivel cada tres encestadas.

Todo el movimiento son transformaciones y opacidad, y los efectos de puntero miden el elemento una
sola vez al entrar.

Con `prefers-reduced-motion` no se monta ninguna animación: ni los manejadores de puntero, ni el
confeti, ni las chispas del fuego, ni la solapa de las transiciones —los saltos del nav vuelven a ser
un ancla común—, y las placas del fondo se quedan quietas.

## Integración continua

`.github/workflows/ci.yml` corre en cada push y pull request a `main`, en dos jobs paralelos:

- **Lint, tipos y tests unitarios**: formato, ESLint, `tsc --noEmit`, Vitest con cobertura y build.
- **Tests end-to-end**: Playwright sobre el sitio ya buildeado, con el navegador cacheado por
  versión.

## Deploy

El sitio se publica en **Vercel**, conectado al repositorio: cada push a `main` publica producción y
cada pull request genera una preview propia.

`vercel.json` fija el framework y unas cabeceras de seguridad, más caché largo para los assets, que
llevan hash en el nombre.

Lo que **no** fija, a propósito, es `outputDirectory`. Aunque `next.config.ts` exporta a `out/`, el
preset de Next en Vercel busca su `routes-manifest.json` dentro del directorio de salida que se le
declare, y ese archivo lo escribe `next build` en `.next/`. Apuntándolo a `out/` el deploy falla con
«The file "out/routes-manifest.json" couldn't be found». El preset ya entiende `output: 'export'`
solo: hay que dejarlo leer `.next/` y él publica lo exportado.

`next.config.ts` lee `BASE_PATH` del entorno. En Vercel el sitio vive en la raíz del dominio, así que
la variable queda vacía y no hace falta configurar nada; el prefijo existe por si alguna vez se
publica bajo un subdirectorio.

> Los deployments nuevos arrancan con **Vercel Authentication** activada, que pide iniciar sesión
> para verlos. Para que la landing sea pública hay que apagarla en
> _Project → Settings → Deployment Protection_.
