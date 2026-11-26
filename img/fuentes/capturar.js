/*
 * Renderiza las pantallas de pantallas.html a img/pantalla-<clave>.png.
 *
 * pantallas.html lo genera, a su vez, herramientas/generar_capturas.py del repositorio
 * del sistema, que incrusta la hoja de estilo real y reproduce el marcado de las vistas.
 * Para rehacer las figuras tras un cambio de interfaz:
 *
 *   python3 ../sitrad/herramientas/generar_capturas.py > img/fuentes/pantallas.html
 *   node img/fuentes/capturar.js
 *
 * Requiere Playwright con Chromium:  npm i -D playwright && npx playwright install chromium
 */
const path = require('path');
const { chromium } = require('playwright');

const FUENTE = path.join(__dirname, 'pantallas.html');
const DESTINO = path.resolve(__dirname, '..');          // la carpeta img/

// Las claves se nombran, y no se numeran, para que agregar o dividir una pantalla no
// desplace los nombres de archivo de todas las demás.
const PANTALLAS = [
  'acceso', 'bandeja', 'registro', 'acuse', 'visor',
  'tablero', 'cortes', 'bitacora', 'usuarios', 'catalogo',
];

(async () => {
  const navegador = await chromium.launch();
  const pagina = await navegador.newPage({
    viewport: { width: 1240, height: 900 },
    deviceScaleFactor: 2,
  });

  await pagina.goto('file://' + FUENTE, { waitUntil: 'load' });

  for (const clave of PANTALLAS) {
    const caja = pagina.locator('#' + clave);

    if ((await caja.count()) === 0) {
      console.error(`FALTA la pantalla «${clave}» en pantallas.html`);
      process.exitCode = 1;
      continue;
    }

    // La pantalla se compone a 1 000 px y se amplía 1.18; el recorte toma la altura real
    // del lienzo ya ampliado, para que la imagen no quede con margen sobrante abajo.
    const alto = await caja.evaluate((el) => {
      const lienzo = el.querySelector('.lienzo');
      const h = Math.ceil(lienzo.getBoundingClientRect().height);
      el.style.height = h + 'px';
      return h;
    });

    const salida = path.join(DESTINO, `pantalla-${clave}.png`);
    await caja.screenshot({ path: salida });

    // La proporción advierte si una pantalla quedó demasiado alta para leerse al ancho
    // de la caja de texto de la tesina.
    const razon = (alto / 1180).toFixed(2);
    const aviso = alto / 1180 > 1.35 ? '  ← demasiado alta, conviene dividirla' : '';
    console.log(`pantalla-${clave}.png  1180 x ${alto}  (${razon})${aviso}`);
  }

  await navegador.close();
})();
