import type { NextConfig } from 'next';

/**
 * La landing se publica como sitio estático en GitHub Pages, bajo la ruta
 * `/<repo>`. En desarrollo no queremos ese prefijo, así que sólo lo aplicamos
 * cuando el workflow de deploy define BASE_PATH.
 */
const basePath = process.env.BASE_PATH ?? '';

const nextConfig: NextConfig = {
  output: 'export',
  basePath,
  assetPrefix: basePath || undefined,
  images: { unoptimized: true },
  trailingSlash: true,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
