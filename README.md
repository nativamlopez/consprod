# Conservación Productiva — Gran Paisaje Chaco · Pantanal

Sitio estático (HTML/CSS/JS, sin build) listo para **GitHub Pages**.

## Contenido
- `index.html` y las líneas productivas: `ganaderia.html`, `apicultura.html`, `artesanias.html`, `turismo.html`
- `geoportal.html` — geoportal interactivo (Leaflet)
- `styles.css`, `script.js`
- `assets/` — datos del geoportal (`assets/data/*.js`) y `assets/js/geoportal.js`
- `IMAGENES/` — imágenes del sitio (optimizadas)
- `.nojekyll` — evita el procesamiento Jekyll de GitHub

## Publicar en GitHub Pages
1. Crear un repositorio nuevo en GitHub (por ejemplo `conservacion-productiva`).
2. Subir **el contenido de esta carpeta** a la raíz del repo:
   ```bash
   cd conservacion-productiva-ghpages
   git init
   git add .
   git commit -m "Sitio Conservación Productiva"
   git branch -M main
   git remote add origin https://github.com/USUARIO/REPO.git
   git push -u origin main
   ```
3. En GitHub: **Settings → Pages → Build and deployment**
   - Source: **Deploy from a branch**
   - Branch: **main** / carpeta **/ (root)** → Save
4. En 1–2 minutos queda publicado en `https://USUARIO.github.io/REPO/`.

## Notas
- El sitio necesita **conexión a internet** para: tipografías (Google Fonts), la librería del mapa (Leaflet, unpkg) y los mapas base (Esri / CARTO / OpenTopoMap).
- Todas las rutas internas son **relativas**, así que funciona tanto en `https://usuario.github.io/REPO/` como abriendo los archivos en local.
- El botón flotante "Ir a Alma de Monte" está **desactivado** por el momento (sin enlace). Para reconectarlo, agregá el `href` al `<a class="cp-fab">` en cada página.
- Los datos del geoportal viven en `assets/data/*.js` (WGS84). Fuente: NATIVA Bolivia.
