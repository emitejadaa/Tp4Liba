/**
 * Servidor estático mínimo para el export de Next (`out/`).
 *
 * `next start` no funciona con `output: 'export'`, así que los tests E2E y las
 * verificaciones de build necesitan servir la carpeta generada. Usar el módulo
 * `http` nativo evita sumar una dependencia sólo para esto.
 */
import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';

const ROOT = resolve(process.argv[2] ?? 'out');
const PORT = Number(process.env.PORT ?? 3100);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

/** Resuelve una URL a un archivo dentro de ROOT, o null si se escapa o no existe. */
async function resolveFile(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const candidate = resolve(join(ROOT, normalize(decoded)));
  if (candidate !== ROOT && !candidate.startsWith(ROOT + '/')) return null;

  for (const target of [candidate, join(candidate, 'index.html'), `${candidate}.html`]) {
    try {
      const info = await stat(target);
      if (info.isFile()) return target;
    } catch {
      // seguimos probando el resto de los candidatos
    }
  }
  return null;
}

const server = createServer(async (req, res) => {
  const file = await resolveFile(req.url ?? '/');
  if (!file) {
    const notFound = await resolveFile('/404.html');
    res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
    if (notFound) return createReadStream(notFound).pipe(res);
    return res.end('404');
  }
  res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
  createReadStream(file).pipe(res);
});

server.listen(PORT, '127.0.0.1', () => {
  // eslint-disable-next-line no-console
  console.log(`Sirviendo ${ROOT} en http://127.0.0.1:${PORT}`);
});
