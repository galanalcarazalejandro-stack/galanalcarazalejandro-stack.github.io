# GFX. — Portfolio

Portfolio estático de GFX, diseñador gráfico freelance en la zona de Valencia. La interfaz usa azul, blanco y superficies glass con esquinas rectas; el hero anima por separado el fondo, las letras y la figura, y se reduce al desplazarse. En móvil se usan recortes transparentes de las mismas capas para mostrar la composición completa.

El hero permanece detrás de la sección de portadas mientras se reduce progresivamente con el scroll; la segunda sección asciende y lo cubre. El efecto se invierte al subir y se desactiva con movimiento reducido. La portada de TRAMA utiliza la página 13 de su manual.

## Abrir

```powershell
npm.cmd start
```

Después abre <http://127.0.0.1:4173>.

## Estructura de carpetas

```text
index.html                 Entrada del portfolio
assets/
  css/                     Estilos generales, glass, vinilos y manual
  js/                      Proyectos, interacciones y carrusel
  images/
    brand/                 Logo de GFX
    hero/                  Capas del hero y variantes móviles
    albums/                Portadas optimizadas del carrusel
    photography/           Fotografías optimizadas
    projects/              Portadas de proyectos y páginas del manual de TRAMA
  videos/                  Vídeos optimizados
proyectos/
  identidad/gfx/           Originales del logo
  identidad/trama/         Manual PDF original
  audiovisual/ice/         Vídeo original de ICE
  fotografia/              Fotografías originales y HEIC
  hero/                    Fotografía original del hero
  portadas-albums/         Portadas originales
scripts/
  assets/                  Preparación y optimización de recursos
  checks/                  Comprobaciones del portfolio
  serve.mjs                Servidor local
  clean-checks.mjs          Limpieza de capturas generadas
reports/screenshots/       Capturas de las comprobaciones
archivo/recursos-anteriores/ Recursos conservados que ya no usa la web
```

`package.json` y `package-lock.json` mantienen los comandos y dependencias. `node_modules/` contiene las dependencias instaladas; se regenera con `npm.cmd ci`.

Para publicar el portfolio se necesitan `index.html`, `assets/` y `proyectos/`, porque algunos enlaces permiten consultar los originales. `scripts/`, `reports/`, `archivo/` y `node_modules/` son carpetas de trabajo.

## Contenido

Los proyectos y sus enlaces están definidos en `assets/js/app.js`. Las imágenes y vídeos optimizados están en `assets/`; los originales están en `proyectos/`. Carmín se reproduce desde YouTube. ICE usa la misma portada que el carrusel de álbumes y reproduce el vídeo completo con audio en la ventana del proyecto. El archivo fotográfico tiene un carrusel deslizable. Los enlaces de contacto abren WhatsApp o un correo a `galanalcarazalejandro@gmail.com`.

Entre el hero y «Sobre mí», `assets/css/vinyl.css` y `assets/js/vinyl.js` presentan las ocho portadas de `proyectos/portadas-albums` en un carrusel con perspectiva y reflejo. Todas tienen el mismo tamaño base; el disco de la portada central sale de su funda. Incluye flechas, selectores, teclado, deslizamiento táctil y reproducción automática cada cuatro segundos, con pausa por foco, ratón y visibilidad. Con movimiento reducido no avanza automáticamente. Las formas circulares corresponden a los discos y al cursor.

## Mantenimiento

El manual de TRAMA se consulta completo dentro de la ventana del proyecto, con navegación de páginas y ampliación. `node scripts/assets/prepare-manual.mjs` regenera sus 29 páginas optimizadas en `assets/images/projects/trama-manual/` desde el PDF original; también se ejecuta con `prepare:assets`.

```powershell
npm.cmd run prepare:assets
npm.cmd run check
```

`prepare:assets` regenera las imágenes y vídeos en sus carpetas correspondientes, incluido el vídeo completo de ICE en `assets/videos/ice-full.mp4`. `node scripts/assets/prepare-albums.mjs` optimiza solo las ocho portadas en `assets/images/albums/` (960 px); los originales se conservan. `check` comprueba escritorio, móvil, los showcases de Identidad, Audiovisual y Fotografía, el menú lateral y las ventanas de proyectos. Las comprobaciones usan Google Chrome instalado en Windows y guardan sus capturas en `reports/screenshots/`.

`npm.cmd run clean:checks` elimina únicamente las capturas PNG generadas. No elimina originales ni recursos de la web.

`assets/css/effects.css` contiene las superficies glass y `assets/js/effects.js` controla el cursor circular, la estela y los reflejos que siguen al ratón. El cursor nativo se mantiene en dispositivos táctiles, controles multimedia y cuando se solicita movimiento reducido. `check` también verifica estos comportamientos y el crédito de desarrollo del footer.
