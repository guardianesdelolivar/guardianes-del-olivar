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
      renderOpGrid(grid, futuras, { vacio: "AHORA MISMO NO HAY OPERACIONES PROGRAMADAS.<br />Anunciamos la próxima en el grupo de WhatsApp y en Instagram." });

      const proxima = futuras[0];
      const nextNameEl = document.querySelector("[data-next-op-name]");
      const nextDateEl = document.querySelector("[data-next-op-date]");
      const nextCodeEl = document.querySelector("[data-next-op-code]");
      const heroCta = document.querySelector("[data-hero-cta]");
      const heroHud = document.querySelector("[data-hero-next-chip]");
      if (proxima) {
        if (nextNameEl) nextNameEl.textContent = proxima.nombre.replace("OPERACIÓN: ", "");
        if (nextDateEl) nextDateEl.textContent = proxima.fechaDisplay;
        if (nextCodeEl) nextCodeEl.textContent = proxima.codigo;
        if (heroCta) { heroCta.href = `calendario.html?op=${proxima.id}`; heroCta.textContent = "VER PRÓXIMAS OPERACIONES"; }
        if (heroHud) heroHud.style.display = "";
      } else {
        if (nextNameEl) nextNameEl.textContent = "Sin operaciones programadas";
        if (nextDateEl) nextDateEl.textContent = "Consulta el calendario";
        if (heroCta) { heroCta.href = "contacto.html"; heroCta.textContent = "CONTACTA CON LA ORGANIZACIÓN"; }
        if (heroHud) heroHud.style.display = "none";
      }

      const abiertas = OPERACIONES.filter((op) => op.status === "abiertas" || op.status === "ultimas");
      const totalLibres = abiertas
        .filter(tieneLimitePlazas)
        .reduce((acc, op) => acc + (op.plazasTotal - op.plazasOcupadas), 0);
      const librasEl = document.querySelector("[data-plazas-libres]");
      if (librasEl) {
        if (!abiertas.length) librasEl.textContent = "—";
        else if (abiertas.some((op) => !tieneLimitePlazas(op))) librasEl.textContent = "Sin límite";
        else librasEl.textContent = totalLibres;
      }

      const activasEl = document.querySelector("[data-ops-activas]");
      if (activasEl) {
        activasEl.textContent = OPERACIONES.filter((op) => op.status !== "finalizado").length;
      }
    }

    pintar();
    (window.PLAZAS_LISTO || Promise.resolve()).then(pintar);
  });
})();
