/* ============================================================
   geoportal.js — Geoportal interactivo (Leaflet)
   Capas: Ganadería (polígonos), Apicultura (puntos),
          Red de artesanas (puntos).
   Datos embebidos en window.GEOPORTAL_DATA (WGS84).
   ============================================================ */
(function () {
  'use strict';

  if (typeof L === 'undefined') { console.error('Leaflet no cargó'); return; }
  var DATA = window.GEOPORTAL_DATA || {};

  /* ---- Paleta de marca por capa ---- */
  var C = {
    ganaderia: { stroke: '#243D2E', fill: '#3D6249', label: 'Ganadería bajo bosque' },
    apicultura: { color: '#C79A3C', label: 'Apicultura' },
    artesanas: { color: '#B05E3B', label: 'Red de artesanas Alma de Monte' },
    turismo: { color: '#3E7CA8', label: 'Turismo comunitario' }
  };

  /* ---- Mapa ---- */
  var map = L.map('map', {
    zoomControl: false,
    scrollWheelZoom: true,
    minZoom: 5,
    maxZoom: 17
  }).setView([-21.0, -63.2], 8);

  L.control.zoom({ position: 'topright' }).addTo(map);
  L.control.scale({ position: 'bottomleft', imperial: false, maxWidth: 160 }).addTo(map);

  /* ---- Mapas base ---- */
  var bases = {
    satelite: L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { attribution: 'Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics', maxZoom: 18 }),
    claro: L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      { attribution: 'Tiles &copy; Esri — Esri, DeLorme, NAVTEQ', maxZoom: 16 }),
    relieve: L.tileLayer(
      'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      { attribution: 'Map data: &copy; OpenStreetMap, SRTM | &copy; OpenTopoMap', maxZoom: 17 })
  };
  var currentBase = bases.claro.addTo(map);

  document.querySelectorAll('.base-opt').forEach(function (opt) {
    opt.addEventListener('click', function () {
      var key = opt.getAttribute('data-base');
      if (!bases[key] || currentBase === bases[key]) return;
      map.removeLayer(currentBase);
      currentBase = bases[key].addTo(map);
      // mantener overlays por encima
      Object.keys(layers).forEach(function (k) { if (map.hasLayer(layers[k])) layers[k].bringToFront(); });
      document.querySelectorAll('.base-opt').forEach(function (o) { o.classList.remove('active'); });
      opt.classList.add('active');
    });
  });

  /* ---- Helpers de popup ---- */
  function esc(v) { return (v == null ? '' : String(v)).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }
  function num(v, d) { return (typeof v === 'number') ? v.toLocaleString('es-BO', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }) : v; }

  function popupGanaderia(p) {
    return '<div class="gp-pop">'
      + '<span class="kind" style="background:#e4ece4;color:#243D2E">Predio ganadero</span>'
      + '<div class="ttl">' + esc(p.Predio || 'Predio') + '</div>'
      + '<dl>'
      + '<dt>Superficie</dt><dd>' + num(p.Sup_ha, 0) + ' ha</dd>'
      + '</dl></div>';
  }
  function popupApicultura(p) {
    return '<div class="gp-pop">'
      + '<span class="kind" style="background:#f6ecd2;color:#8a6a1f">Centro apícola</span>'
      + '<div class="ttl">' + esc(p.Nombre || 'Centro') + '</div>'
      + '<dl>'
      + (p.Integrantes != null ? '<dt>Integrantes</dt><dd>' + num(p.Integrantes, 0) + '</dd>' : '')
      + (p.Departamento ? '<dt>Departamento</dt><dd>' + esc(p.Departamento) + '</dd>' : '')
      + '</dl>'
      + '<p style="margin:.6rem 0 0;font-size:.88rem;color:#6C746A">Producción de miel asociada a la floración del bosque chaqueño.</p>'
      + '</div>';
  }
  function popupArtesanas(p) {
    return '<div class="gp-pop">'
      + '<span class="kind" style="background:#f3e0d6;color:#B05E3B">Red de artesanas Alma de Monte</span>'
      + '<div class="ttl">' + esc(p.Nombre || 'Grupo de artesanas') + '</div>'
      + '<dl>'
      + (p.Integrantes != null ? '<dt>Integrantes</dt><dd>' + num(p.Integrantes, 0) + '</dd>' : '')
      + (p.Departamento ? '<dt>Departamento</dt><dd>' + esc(p.Departamento) + '</dd>' : '')
      + '</dl></div>';
  }

  function popupTurismo(p) {
    return '<div class="gp-pop">'
      + '<span class="kind" style="background:#dce8f1;color:#2f5d80">Turismo comunitario</span>'
      + '<div class="ttl">' + esc(p.Nombre || 'Comunidad') + '</div>'
      + '<p style="margin:0;font-size:.88rem;color:#6C746A">Comunidad con iniciativa de turismo comunitario.</p>'
      + '</div>';
  }

  function pointMarker(latlng, color) {
    return L.circleMarker(latlng, {
      radius: 8, color: '#fff', weight: 2.5,
      fillColor: color, fillOpacity: 1
    });
  }

  /* ---- Construcción de capas ---- */
  var layers = {};

  // Ganadería (polígonos)
  if (DATA.GP_GANADERIA) {
    layers.ganaderia = L.geoJSON(DATA.GP_GANADERIA, {
      style: function () {
        return { color: C.ganaderia.stroke, weight: 1.2, fillColor: C.ganaderia.fill, fillOpacity: 0.45 };
      },
      onEachFeature: function (f, lyr) {
        lyr.bindPopup(popupGanaderia(f.properties || {}), { maxWidth: 280 });
        lyr.bindTooltip((f.properties && f.properties.Predio) || 'Predio', { sticky: true, direction: 'top', opacity: .9 });
        lyr.on({
          mouseover: function () { lyr.setStyle({ weight: 2.4, fillOpacity: .65, color: '#1a2c20' }); lyr.bringToFront(); },
          mouseout: function () { layers.ganaderia.resetStyle(lyr); }
        });
      }
    });
  }

  // Apicultura (puntos)
  if (DATA.GP_APICULTURA) {
    layers.apicultura = L.geoJSON(DATA.GP_APICULTURA, {
      pointToLayer: function (f, ll) { return pointMarker(ll, C.apicultura.color); },
      onEachFeature: function (f, lyr) {
        lyr.bindPopup(popupApicultura(f.properties || {}), { maxWidth: 260 });
        lyr.bindTooltip((f.properties && f.properties.Nombre) || '', { direction: 'top', offset: [0, -8], opacity: .9 });
      }
    });
  }

  // Red de artesanas (puntos)
  if (DATA.GP_ARTESANAS) {
    layers.artesanas = L.geoJSON(DATA.GP_ARTESANAS, {
      pointToLayer: function (f, ll) { return pointMarker(ll, C.artesanas.color); },
      onEachFeature: function (f, lyr) {
        lyr.bindPopup(popupArtesanas(f.properties || {}), { maxWidth: 260 });
        lyr.bindTooltip((f.properties && f.properties.Nombre) || '', { direction: 'top', offset: [0, -8], opacity: .9 });
      }
    });
  }

  // Turismo comunitario (puntos)
  if (DATA.GP_TURISMO) {
    layers.turismo = L.geoJSON(DATA.GP_TURISMO, {
      pointToLayer: function (f, ll) { return pointMarker(ll, C.turismo.color); },
      onEachFeature: function (f, lyr) {
        lyr.bindPopup(popupTurismo(f.properties || {}), { maxWidth: 260 });
        lyr.bindTooltip((f.properties && f.properties.Nombre) || '', { direction: 'top', offset: [0, -8], opacity: .9 });
      }
    });
  }

  // Añadir todas y ajustar vista
  var group = L.featureGroup();
  Object.keys(layers).forEach(function (k) { layers[k].addTo(map); group.addLayer(layers[k]); });
  // puntos al frente
  if (layers.apicultura) layers.apicultura.bringToFront();
  if (layers.artesanas) layers.artesanas.bringToFront();
  if (layers.turismo) layers.turismo.bringToFront();

  var fullBounds = group.getBounds();
  if (fullBounds.isValid()) map.fitBounds(fullBounds, { padding: [40, 40] });

  /* ---- Toggles de capa (panel) ---- */
  document.querySelectorAll('.layer').forEach(function (el) {
    var key = el.getAttribute('data-layer');
    if (!layers[key]) { el.style.display = 'none'; return; }
    el.addEventListener('click', function () {
      var off = el.classList.toggle('off');
      if (off) { map.removeLayer(layers[key]); }
      else {
        layers[key].addTo(map);
        if (key !== 'ganaderia') layers[key].bringToFront();
      }
    });
  });

  /* ---- Panel colapsable (móvil) ---- */
  (function () {
    var panel = document.getElementById('geoPanel');
    var pToggle = document.getElementById('geoPanelToggle');
    var pClose = document.getElementById('geoPanelClose');
    var backdrop = document.getElementById('geoBackdrop');
    if (!panel) return;
    var last = 0;
    function setPanel(open) {
      panel.classList.toggle('is-open', open);
      if (backdrop) backdrop.classList.toggle('is-visible', open);
      if (pToggle) pToggle.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('geo-panel-abierto', open);
      setTimeout(function () { map.invalidateSize(); }, 400);
    }
    // Anti-rebote contra el "click fantasma" del touch en móvil
    function toggle(e) { if (e) e.preventDefault(); var n = Date.now(); if (n - last < 400) return; last = n; setPanel(!panel.classList.contains('is-open')); }
    if (pToggle) pToggle.addEventListener('click', toggle);
    if (pClose) pClose.addEventListener('click', function () { setPanel(false); });
    if (backdrop) backdrop.addEventListener('click', function () { setPanel(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setPanel(false); });
  })();

  /* ---- Botón: restablecer vista ---- */
  var resetBtn = document.getElementById('geo-reset');
  if (resetBtn) resetBtn.addEventListener('click', function () {
    if (fullBounds.isValid()) map.fitBounds(fullBounds, { padding: [40, 40] });
  });

  /* ---- Botón: pantalla completa ---- */
  var fsBtn = document.getElementById('geo-fullscreen');
  var shell = document.querySelector('.geo-map-wrap');
  if (fsBtn && shell) fsBtn.addEventListener('click', function () {
    if (!document.fullscreenElement) {
      (shell.requestFullscreen || shell.webkitRequestFullscreen || function () {}).call(shell);
    } else {
      (document.exitFullscreen || document.webkitExitFullscreen || function () {}).call(document);
    }
    setTimeout(function () { map.invalidateSize(); }, 250);
  });
  document.addEventListener('fullscreenchange', function () { setTimeout(function () { map.invalidateSize(); }, 250); });

  /* ---- Estadísticas ---- */
  function setText(id, v) { var e = document.getElementById(id); if (e) e.textContent = v; }

  var totalHa = 0, predios = 0;
  if (DATA.GP_GANADERIA) {
    DATA.GP_GANADERIA.features.forEach(function (f) { totalHa += (f.properties && f.properties.Sup_ha) || 0; predios++; });
  }
  var artes = DATA.GP_ARTESANAS ? DATA.GP_ARTESANAS.features.length : 0;
  var apis = DATA.GP_APICULTURA ? DATA.GP_APICULTURA.features.length : 0;
  var turis = DATA.GP_TURISMO ? DATA.GP_TURISMO.features.length : 0;
  var pueblos = {};
  if (DATA.GP_ARTESANAS) DATA.GP_ARTESANAS.features.forEach(function (f) { if (f.properties && f.properties.Pueblo) pueblos[f.properties.Pueblo] = 1; });

  setText('st-ha', Math.round(totalHa).toLocaleString('es-BO'));
  setText('st-predios', predios);
  setText('st-artesanas', artes);
  setText('st-apicultura', apis);
  setText('st-turismo', turis);
  setText('st-pueblos', Object.keys(pueblos).length);

  // recalcular tamaño y reencuadrar por si el panel se monta antes de tener
  // su tamaño final (un fitBounds con dimensiones erróneas queda descentrado)
  setTimeout(function () {
    map.invalidateSize();
    if (fullBounds.isValid()) map.fitBounds(fullBounds, { padding: [40, 40] });
  }, 200);
  window.addEventListener('resize', function () { map.invalidateSize(); });
})();
