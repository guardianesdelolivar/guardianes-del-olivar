/**
 * GALERIA-PAGE.JS — renderiza el archivo fotográfico por año y álbum.
 */

(function () {
  "use strict";

  function albumHTML(anio, album) {
    let tiles = "";
    for (let i = 1; i <= album.piezas; i++) {
      tiles += `
        <div class="gallery-item reveal" tabindex="0">
          <div class="gallery-item__overlay">
            <span class="gallery-item__tag">${anio} · TOMA ${String(i).padStart(2, "0")}</span>
            <span class="gallery-item__title">${album.operacion}</span>
          </div>
        </div>`;
    }
    return tiles;
  }

  document.addEventListener("DOMContentLoaded", () => {
    const root = document.querySelector("[data-gallery-root]");
    if (!root) return;
    const anios = [...GALERIA].sort((a, b) => b.anio - a.anio);
    if (!anios.length) {
      root.innerHTML = `<div class="empty-state">EL ARCHIVO DE OPERACIONES ESTÁ VACÍO POR AHORA.<br />Se irá llenando con fotos reales después de cada operación.</div>`;
      return;
    }
    root.innerHTML = anios.map((bloque) => `
      <div class="gallery-year">
        <div class="gallery-year__label"><h2>${bloque.anio}</h2></div>
        <div class="gallery-grid">
          ${bloque.albumes.map((album) => albumHTML(bloque.anio, album)).join("")}
        </div>
      </div>`).join("");
    if (window.reScanReveal) window.reScanReveal();
  });
})();
