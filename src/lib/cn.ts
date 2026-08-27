/** Une clases descartando `false`, `null` y `undefined`. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
