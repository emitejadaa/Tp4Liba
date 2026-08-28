import { defineConfig, devices } from '@playwright/test';

const PORT = 3100;
const baseURL = `http://127.0.0.1:${PORT}`;

/*
 * En CI se instala el navegador que pide la versión de Playwright. En entornos
 * que ya traen un Chromium propio —contenedores de desarrollo, por ejemplo— se
 * puede apuntar a ese binario con PW_CHROMIUM y evitar la descarga.
 */
const executablePath = process.env.PW_CHROMIUM;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL,
    trace: 'on-first-retry',
    /*
     * Los tests corren con `prefers-reduced-motion` por defecto. No es para
     * esquivar las animaciones: es que casi todas las aserciones son sobre
     * comportamiento, y una página con movimiento continuo hace que el chequeo
     * de estabilidad de Playwright —que compara la posición de un elemento
     * entre dos cuadros -- nunca se dé por satisfecho en una máquina lenta.
     *
     * De paso, esta es la misma configuración que usa quien pidió menos
     * movimiento en su sistema, así que la suite verifica que ese camino
     * funcione. Las animaciones se prueban aparte, en `animaciones.spec.ts`,
     * que vuelve a habilitarlas.
     */
    contextOptions: { reducedMotion: 'reduce' },
    launchOptions: {
      ...(executablePath ? { executablePath } : {}),
      /*
       * El encabezado dibuja la pelota con WebGL. Chromium headless no trae
       * GPU, así que se le pide el renderizador por software: sin esto la
       * página cae a la ilustración plana y los tests del 3D no probarían nada.
       */
      args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
    },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run build && npm run serve',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: { PORT: String(PORT) },
  },
});
