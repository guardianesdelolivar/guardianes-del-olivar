/**
 * OPERACIONES-PAGE.JS — listado de operaciones, separadas en próximas
 * y finalizadas (sin filtros: con pocas operaciones activas a la vez,
 * un listado cronológico simple es más útil que filtrar).
 *
 * RENDIMIENTO: se pinta de inmediato con los datos que ya hay, y se
 * repinta solo cuando llega el número real de plazas del contador en vivo,
 * sin bloquear la carga inicial de la página.
 */

(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    function pintar() {
      const grid = document.querySelector("[data-ops-grid]");
      const gridPast = document.querySelector("[data-ops-grid-past]");
      const pastBlock = document.querySelector("[data-ops-past-block]");

      const ordenadas = ordenarOperacionesPorFecha(OPERACIONES);
      const proximas = ordenadas.filter((op) => op.status !== "finalizado");
      const finalizadas = ordenadas.filter((op) => op.status === "finalizado").reverse();

      renderOpGrid(grid, proximas, { expanded: true });

      if (finalizadas.length) {
        renderOpGrid(gridPast, finalizadas, { expanded: false });
        if (pastBlock) pastBlock.style.display = "";
      }
    }

    pintar();
    (window.PLAZAS_LISTO || Promise.resolve()).then(pintar);
  });
})();
