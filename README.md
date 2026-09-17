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
del minijuego arrastrando con el mouse y el flujo completo del formulario de inscripción.

`responsive.spec.ts` la recorre además en ocho tamaños —del teléfono plegado de 320 px a la pantalla
de 1920, pasando por el teléfono **apaisado**, que es corto y es el caso que siempre se olvida— y
verifica tres cosas en cada uno: que la página no se arrastre para el costado en ningún punto del
scroll, que todo lo que se toca llegue a los 24×24 px del criterio 2.5.8 de las WCAG 2.2, y que el
título y la acción principal entren enteros en la primera pantalla.

`animaciones.spec.ts` verifica lo que sólo existe con movimiento: el parallax del encabezado, la
profundidad de las secciones, los planos del fondo viajando a distinta velocidad, el tinte del fondo
a lo largo del recorrido, la solapa que tapa el salto entre secciones, la pelota cruzando la pantalla
sin irse nunca con el documento, y que el contenido no suba exactamente lo que sube el scroll.

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

  Se usan los dispositivos que **acompañan** el scroll y no los que se lo apropian. Se probaron los
  de escenario —clavar una sección y hacer avanzar su contenido adentro, mover el cronograma de
  costado— y se sacaron: secuestran la rueda, y con la rueda secuestrada el scroll se siente trabado
  en vez de fluido, por más que lo que pase adentro esté bien hecho. La profundidad tiene que ser
  algo que se atraviesa, no una puerta donde hay que esperar.

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

- **La página se recorre como una presentación, no como un documento.** Es una sola idea: romper el
  1:1 con el scroll. Si todo se desplaza exactamente lo que se movió la rueda, lo que se lee es que
  la vista baja por encima de cosas quietas; si el contenido se mueve **distinto** que la página, lo
  que se lee es que las cosas se están moviendo delante de quien mira. Cada sección se queda atrás
  del scroll al entrar y se adelanta al salir —treinta y cuatro píxeles, `slideAt` en `lib/depth.ts`—
  mientras llega desde el fondo y se endereza.

- **Profundidad en todo el recorrido.** Cada sección llega desde el fondo, se planta de frente
  mientras se la lee y se va al fondo al salir, con una meseta en el medio para que leer no sea leer
  algo inclinado. Detrás de cada una hay tres planos —una marca de cancha, dos rayas y un resplandor—
  que viajan a distinta velocidad y se inclinan con el avance: la diferencia entre ellos es lo que
  arma la perspectiva.
- **El fondo viaja.** El color de la página se va corriendo unos puntos de luminosidad de sección en
  sección. No se nota en la transición; se nota al llegar abajo.
- **Un solo idioma para «esto cambió».** La solapa que gira desde su borde de arriba está en las
  filas de la tabla, en los números del marcador y en el pase entre secciones.
- **La pelota del encabezado es un disco plano, y el movimiento es lo único que no lo es.** Las
  cuatro costuras de una pelota de ocho paneles son curvas sobre una esfera: se calculan en 3D, se
  giran y se proyectan a trazos de SVG cuadro a cuadro (`lib/ball-geometry.ts`), así que barren la
  curvatura y desaparecen por el borde en vez de deslizarse sobre un círculo. Es la diferencia entre
  un dibujo que gira y una pelota girando, y es lo único que hay que hacer bien para que se sienta
  de calidad.

  Todo lo demás es contención: una vuelta cada cuarenta segundos, tan lento que no se la ve girar
  sino distinta cada vez que se la vuelve a mirar, y una flotación de tres centésimas de radio en un
  ciclo de seis segundos que no coincide con el del giro, para que nunca se repita el mismo cuadro.
  Una sola cosa pasa rápido: la entrada, que dura un segundo, llega desde abajo, abre la sombra y
  enciende las costuras de a una. Y no vuelve a pasar.

  Antes fue una esfera de Three.js con textura y matcap, y después un globo de alambre. La primera
  llegaba rasterizada, crecía a 1,35 al scrollear hasta que la sección la cortaba al ras, y era el
  único objeto fotográfico de una página de líneas finas. El alambre se leía como un diagrama
  técnico: sin cuerpo no se distingue el frente del fondo, y a noventa grados de giro los arcos
  laterales se convierten en anillos concéntricos.

- **Las tarjetas se inclinan en 3D hacia el puntero**, y la luz que las cruza es una sola por sección
  en vez de una por tarjeta.
- **Los botones se corren unos píxeles hacia el cursor**, con tope para no escaparse de abajo del
  mouse.
- **Los títulos de sección entran girando desde el fondo**, con la etiqueta adelantándose al título.
- **El minijuego «Tirá al aro» se juega arrastrando**, con el dedo o con el mouse, hacia donde se
  quiere que vaya la pelota. La puntería se mide **desde la pelota hasta el dedo**: para dónde queda
  el dedo es el ángulo y qué tan lejos está es la fuerza, así que no hay dos controles sino un gesto,
  y no hay dos tiros iguales.

  Medirlo desde la pelota y no desde donde se apretó es lo que saca del gesto lo único que no se
  veía. Medido desde donde se apretó, el gesto tenía un ancla invisible —dos dedos en el mismo punto
  de la pantalla daban tiros distintos según de dónde venían— y nada unía la mano con una pelota que
  estaba en la otra punta de la cancha. Ahora el dedo **es** la puntería: se ve la banda que lo une
  con la pelota, la pelota amaga para atrás mientras se carga el tiro, y una guía punteada muestra el
  arranque del arco y corta antes del aro, porque es una ayuda para apuntar y no la respuesta.

  Apretar no apunta, hay que mover: si no, un click cualquiera sobre la cancha saldría como un tiro
  que nadie quiso. Y soltar con el dedo encima de la pelota no tira: es la manera de arrepentirse, y
  se ve dibujada como un círculo punteado alrededor de la pelota.

  Lo que pasa después **no está escrito en ningún lado**. La pelota la mueve un simulador
  (`lib/minigame/physics.ts`) que integra gravedad y viento en pasos fijos y resuelve los choques
  contra el frente del aro, el fondo y la tabla. La diferencia con una animación es la única que
  importa acá: una animación tiene que decidir antes de empezar si el tiro entra; una simulación se
  entera al final, así que un tiro puede pegar en el aro, dar vueltas y caer adentro. Entra limpia
  vale 3 y entra rebotando vale 2.

  El aro se ve **de costado** por eso mismo. De frente el tablero queda detrás del aro, en una
  profundidad que dos dimensiones no tienen, y hay que elegir entre ponerlo en el camino de la
  pelota —donde tapa todos los tiros buenos— o que la pelota lo atraviese dibujado. De costado los
  tres cuerpos están en el mismo plano y cada rebote es el que se ve; de paso, se ve el arco, que de
  frente es lo único que no se distingue entre un tiro corto y uno largo.

  El marco lleva **cielo** arriba de la cancha, y no es decoración: la pelota sube bastante más que
  el aro, así que sin él un tiro con fuerza se salía por el borde de arriba, desaparecía y volvía a
  aparecer de la nada un rato después. No era un caso raro —le pasaba a ochenta y nueve de los tiros
  que entran— y un tiro del que no se ve la mitad no se puede corregir, que es justo lo que hay que
  hacer con el que falló. Son las ciento cuarenta unidades que necesita el tiro que más sube de
  todos, y hay un test que recorre el espacio entero de punterías para que subir la velocidad máxima
  sin subir el cielo lo rompa en vez de volver a esconder la pelota.

  La dificultad sube con la racha por dos caminos, y son dos problemas distintos a propósito. El
  **viento** aparece a la tercera encestada y crece hasta la racha veinte: sin él el juego se termina
  cuando alguien encuentra el arrastre que entra, porque repetirlo sale gratis. Se corrige **antes**
  de tirar, mirando el indicador. Sale del número de tiro y no de `Math.random`, así que dos partidas
  con los mismos tiros se ven igual.

  El **aro se pone a subir y bajar**, y va tomando más recorrido y más velocidad hasta cerca de la
  racha treinta. Ése no se corrige apuntando: se corrige eligiendo **cuándo** soltar. El tablero
  cuelga del aro y se mueve con él; el poste se queda clavado en el piso y el tablero se desliza
  sobre él, como en un aro regulable de verdad.

  Los dos hacen falta, y eso se midió en vez de suponerlo. Contando qué porción del espacio de
  punterías entra **caiga donde caiga el vaivén** —que es la dificultad de verdad, porque quien juega
  no elige la fase del aro— el viento solo daba 12,1%, 12,6% y 14,0% en las primeras rachas: como se
  anuncia, se compensa, así que corre la ventana pero no la achica, y el juego se ponía distinto sin
  ponerse más difícil. Lo que la achica es el aro moviéndose. Con las dos cosas y la rampa estirada,
  esa porción baja de 12% a menos de 2% entre la racha 0 y la 25, y hay tests que verifican las tres
  propiedades que importan: que baje de punta a punta, que baje en cada tramo y no de golpe al final,
  y que **nunca se cierre**, porque una dificultad que sube hasta volver el juego imposible no es
  difícil, es un final.

  Lo que hace que el aro móvil no rompa la reproducibilidad es que su desfasaje se **congela al
  soltar**: entra como un número más del tiro y de ahí en más el vuelo lo lleva con su propio reloj.
  Así el aro no pega un salto al salir la pelota, el dibujo y los choques leen la misma cuenta —si
  leyeran relojes distintos, la pelota rebotaría contra un aro que no está ahí— y el mismo tiro
  sigue dando siempre lo mismo. Con movimiento reducido el aro se queda quieto: apuntarle a un aro
  que se mueve _es_ reaccionar al movimiento, así que dejarlo andando sería pedir justo lo que se
  pidió no tener que hacer.

  Arriba de todo eso quedan el confeti al encestar y el fuego de racha, que sube de nivel cada tres.

  Es también la única sección **sin** cámara de profundidad: la cámara inclina la sección en 3D con
  el scroll, y un arrastre sobre algo inclinado entra deformado —la perspectiva comprime el eje
  vertical y no el horizontal—, así que el mismo gesto salía como un tiro de sesenta grados con la
  sección derecha y de cuarenta con la sección inclinada. La cuenta se puede corregir; que la cancha
  se mueva debajo del dedo mientras se apunta, no.

Todo el movimiento son transformaciones y opacidad, y los efectos de puntero miden el elemento una
sola vez al entrar.

Con `prefers-reduced-motion` no se monta ninguna animación: ni los manejadores de puntero, ni el
confeti, ni las chispas del fuego, ni la solapa de las transiciones —los saltos del nav vuelven a ser
un ancla común—, y las placas del fondo se quedan quietas. El minijuego se sigue jugando: el tiro se
simula entero de una y el resultado se cuenta en el marcador, con la pelota quieta en su lugar. Es la
misma simulación, así que el mismo tiro da lo mismo animado que no.

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
