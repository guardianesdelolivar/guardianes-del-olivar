/**
 * GALERIA-PAGE.JS — renderiza el archivo fotográfico por año y operación,
 * con fotos reales (desde assets/js/data/galeria.js), carga diferida,
 * manejo de imágenes que no cargan, y una vista ampliada (lightbox)
 * navegable con ratón, dedo y teclado.
 */

(function () {
  "use strict";

  // Lista plana de todas las fotos, en el mismo orden en que se pintan,
  // para poder navegar "anterior/siguiente" en el lightbox sin importar
  // en qué año o álbum esté cada una.
  let todasLasFotos = [];
  let indiceActual = -1;

  function tileHTML(foto, indiceGlobal, anio, operacion) {
    return `
      <button type="button" class="gallery-item reveal" data-gallery-tile="${indiceGlobal}" aria-label="Ampliar foto: ${foto.alt}">
        <img class="gallery-item__img" src="${foto.src}" alt="${foto.alt}" loading="lazy" decoding="async" />
        <div class="gallery-item__overlay">
          <span class="gallery-item__tag">${anio}</span>
          <span class="gallery-item__title">${operacion}</span>
        </div>
      </button>`;
  }

  function albumHTML(anio, album) {
    const fotos = Array.isArray(album.fotos) ? album.fotos : [];
    if (!fotos.length) return "";
    return fotos
      .map((foto) => {
        const indiceGlobal = todasLasFotos.length;
        todasLasFotos.push({ src: foto.src, alt: foto.alt, anio, operacion: album.operacion });
        return tileHTML(foto, indiceGlobal, anio, album.operacion);
      })
      .join("");
  }

  function abrirLightbox(indice) {
    const lightbox = document.querySelector("[data-lightbox]");
    if (!lightbox || !todasLasFotos.length) return;
    indiceActual = ((indice % todasLasFotos.length) + todasLasFotos.length) % todasLasFotos.length;
    const foto = todasLasFotos[indiceActual];
    const img = lightbox.querySelector("[data-lightbox-img]");
    const caption = lightbox.querySelector("[data-lightbox-caption]");
    if (img) { img.src = foto.src; img.alt = foto.alt; }
    if (caption) caption.textContent = `${foto.anio} · ${foto.operacion}`;
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
    const closeBtn = lightbox.querySelector("[data-lightbox-close]");
    if (closeBtn) closeBtn.focus();
  }

  function cerrarLightbox() {
    const lightbox = document.querySelector("[data-lightbox]");
    if (!lightbox) return;
    lightbox.hidden = true;
    document.body.style.overflow = "";
    if (indiceActual >= 0) {
      const tile = document.querySelector(`[data-gallery-tile="${indiceActual}"]`);
      if (tile) tile.focus();
    }
    indiceActual = -1;
  }

  function initLightbox() {
    const lightbox = document.querySelector("[data-lightbox]");
    if (!lightbox) return;
    lightbox.querySelector("[data-lightbox-close]").addEventListener("click", cerrarLightbox);
    lightbox.querySelector("[data-lightbox-prev]").addEventListener("click", () => abrirLightbox(indiceActual - 1));
    lightbox.querySelector("[data-lightbox-next]").addEventListener("click", () => abrirLightbox(indiceActual + 1));
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) cerrarLightbox();
    });
    document.addEventListener("keydown", (e) => {
      if (lightbox.hidden) return;
      if (e.key === "Escape") cerrarLightbox();
      if (e.key === "ArrowLeft") abrirLightbox(indiceActual - 1);
      if (e.key === "ArrowRight") abrirLightbox(indiceActual + 1);
    });

    document.addEventListener("click", (e) => {
      const tile = e.target.closest("[data-gallery-tile]");
      if (!tile) return;
      abrirLightbox(Number(tile.getAttribute("data-gallery-tile")));
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    const root = document.querySelector("[data-gallery-root]");
    if (!root) return;
    initLightbox();

    const anios = [...GALERIA].sort((a, b) => b.anio - a.anio);
    todasLasFotos = [];

    const bloques = anios
      .map((bloque) => {
        const contenidoAlbumes = (bloque.albumes || []).map((album) => albumHTML(bloque.anio, album)).join("");
        if (!contenidoAlbumes) return "";
        return `
          <div class="gallery-year">
            <div class="gallery-year__label"><h2>${bloque.anio}</h2></div>
            <div class="gallery-grid">${contenidoAlbumes}</div>
          </div>`;
      })
      .filter(Boolean);

    if (!bloques.length) {
      root.innerHTML = `<div class="empty-state">EL ARCHIVO DE OPERACIONES ESTÁ VACÍO POR AHORA.<br />Se irá llenando con fotos reales después de cada operación.</div>`;
      return;
    }

    root.innerHTML = bloques.join("");
    // Si una foto no carga, se muestra un aviso en vez del icono roto.
    root.querySelectorAll(".gallery-item__img").forEach((img) => {
      img.addEventListener("error", () => {
        const tile = img.closest(".gallery-item");
        if (tile) tile.classList.add("is-error");
        img.remove();
      }, { once: true });
    });
    if (window.reScanReveal) window.reScanReveal();
  });
})();
