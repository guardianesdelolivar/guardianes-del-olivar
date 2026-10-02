/**
 * HOME.JS — lógica específica de la página de inicio:
 * próximas operaciones y franja de estado HUD.
 *
 * RENDIMIENTO: se pinta de inmediato con los datos que ya hay, y se
 * repinta solo cuando llega el número real de plazas del contador en vivo,
 * sin bloquear la carga inicial de la página.
 */

(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    function pintar() {
      const grid = document.querySelector("[data-home-ops]");
      const futuras = ordenarOperacionesPorFecha(
        OPERACIONES.filter((op) => op.status !== "finalizado")
      ).slice(0, 3);
      renderOpGrid(grid, futuras);

      const proxima = futuras[0];
      const nextNameEl = document.querySelector("[data-next-op-name]");
      const nextDateEl = document.querySelector("[data-next-op-date]");
      const nextCodeEl = document.querySelector("[data-next-op-code]");
      const heroCta = document.querySelector("[data-hero-cta]");
      if (proxima) {
        if (nextNameEl) nextNameEl.textContent = proxima.nombre.replace("OPERACIÓN: ", "");
        if (nextDateEl) nextDateEl.textContent = proxima.fechaDisplay;
        if (nextCodeEl) nextCodeEl.textContent = proxima.codigo;
        if (heroCta) heroCta.href = `calendario.html?op=${proxima.id}`;
      }

      const totalLibres = OPERACIONES
        .filter((op) => op.status === "abiertas" || op.status === "ultimas")
        .reduce((acc, op) => acc + (op.plazasTotal - op.plazasOcupadas), 0);
      const librasEl = document.querySelector("[data-plazas-libres]");
      if (librasEl) librasEl.textContent = totalLibres;

      const activasEl = document.querySelector("[data-ops-activas]");
      if (activasEl) {
        activasEl.textContent = OPERACIONES.filter((op) => op.status !== "finalizado").length;
      }
    }

    pintar();
    (window.PLAZAS_LISTO || Promise.resolve()).then(pintar);
  });
})();
