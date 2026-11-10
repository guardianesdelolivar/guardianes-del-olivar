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

  cuandoOperaciones(() => {
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
        else if (librasEl.dataset.animado !== String(totalLibres) && window.animarNumero) {
          librasEl.dataset.animado = String(totalLibres);
          window.animarNumero(librasEl, totalLibres);
        } else librasEl.textContent = totalLibres;
      }

      const activasEl = document.querySelector("[data-ops-activas]");
      if (activasEl) {
        const activas = OPERACIONES.filter((op) => op.status !== "finalizado").length;
        if (activasEl.dataset.animado !== String(activas) && window.animarNumero) {
          activasEl.dataset.animado = String(activas);
          window.animarNumero(activasEl, activas);
        } else activasEl.textContent = activas;
      }
    }

    // Franja de teletipo con los datos reales de la próxima operación.
    function pintarTeletipo() {
      const cinta = document.querySelector("[data-ticker]");
      const pista = document.querySelector("[data-ticker-track]");
      if (!cinta || !pista) return;
      const op = ordenarOperacionesPorFecha(OPERACIONES.filter((o) => o.status !== "finalizado"))[0];
      if (!op) { cinta.hidden = true; return; }
      const piezas = [
        `PRÓXIMA OPERACIÓN: ${op.nombre}`,
        op.fechaDisplay,
        `${op.horaInicio} H`,
        `${op.ubicacion.toUpperCase()}, ${op.localidad.toUpperCase()}`,
        `${op.precio} € POR JUGADOR`,
        op.plazasTotal ? `${Math.max(0, op.plazasTotal - op.plazasOcupadas)} DE ${op.plazasTotal} PLAZAS LIBRES` : "PLAZAS SIN LÍMITE",
        ESTADO_TEXTO[op.status],
      ];
      const bloque = piezas.map((p) => `<span>${p}</span><i></i>`).join("");
      pista.innerHTML = bloque + bloque;
      cinta.hidden = false;
    }

    pintar();
    pintarTeletipo();
    (window.PLAZAS_LISTO || Promise.resolve()).then(pintarTeletipo);
    (window.PLAZAS_LISTO || Promise.resolve()).then(pintar);
  });
})();
