# scroll-craft (motor vendorizado)

`scrollcraft.js` y `scrollcraft.css` vienen tal cual de
[nateherkai/scroll-craft](https://github.com/nateherkai/scroll-craft), commit
`0b81622`, de `plugins/nateherk-design/skills/scroll-craft/engine/`. Licencia MIT,
copiada en `LICENSE`.

**No se editan.** Es la regla del propio proyecto: el motor es el mecanismo y se
tematiza con tokens, no se toca por proyecto. Un runtime que se parchea en cada
sitio es justamente lo que hace que todos los sitios terminen iguales.

Por eso están fuera de ESLint y de Prettier (`eslint.config.mjs`,
`.prettierignore`): formatearlos sería editarlos. Para actualizar el motor se
vuelven a copiar los dos archivos y se revisa este README.

## Cómo se engancha acá

- **CSS**: `src/app/globals.css` lo importa dentro de la capa `scrollcraft`, que
  está declarada **antes** que las de Tailwind. Así las reglas de los
  dispositivos (`[data-sc-*]`, `.sc-stage`, `.sc-split`) siguen valiendo, pero su
  «piso de gusto» —reset de body, escala tipográfica, paleta propia— pierde
  contra el diseño de LIBA. Los seis tokens de color y las dos familias
  tipográficas se remapean a los del sitio en el mismo archivo, que es la vía que
  el motor documenta para tematizarlo.
- **JS**: el módulo es un IIFE que cuelga `window.ScrollCraft` y lee `matchMedia`
  al evaluarse, así que sólo se importa en el navegador, desde
  `src/components/ui/ScrollCraftRoot.tsx`. Los tipos están en `scrollcraft.d.ts`,
  escritos acá porque el motor es JavaScript sin tipos propios.
