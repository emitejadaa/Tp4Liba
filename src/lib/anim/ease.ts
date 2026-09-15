import { cubicBezier } from 'animejs';
import { EASE } from './tokens';

/**
 * La curva de la casa, como función de anime.js.
 *
 * Vive aparte de `tokens.ts` para que ese módulo siga sin dependencias: lo
 * importan también los planos decorativos, que no tienen por qué arrastrar la
 * librería entera para leer tres números.
 *
 * Y va como función y no como el texto `'cubicBezier(...)'` porque anime.js v4
 * sacó esa forma del núcleo: pasarla como texto no rompe nada, avisa por consola
 * y anima lineal, que es la clase de error que se nota recién al mirar.
 */
export const EASE_ANIME = cubicBezier(...EASE);
