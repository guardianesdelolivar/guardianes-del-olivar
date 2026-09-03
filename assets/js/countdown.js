/**
 * COUNTDOWN.JS — cuenta atrás hasta la próxima operación en la portada.
 * Lee la fecha/hora directamente de assets/js/data/operaciones.js,
 * así que si cambiáis la fecha ahí, la cuenta atrás se actualiza sola.
 */

(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    const wrap = document.querySelector("[data-countdown]");
    const titleEl = document.querySelector("[data-countdown-title]");
    if (!wrap || typeof OPERACIONES === "undefined") return;

    const proxima = ordenarOperacionesPorFecha(
      OPERACIONES.filter((op) => op.status !== "finalizado")
    )[0];

    if (!proxima) {
      if (titleEl) titleEl.textContent = "No hay operaciones programadas todavía";
      wrap.style.display = "none";
      return;
    }

    if (titleEl) titleEl.textContent = proxima.nombre;

    const target = new Date(`${proxima.fecha}T${proxima.horaInicio}:00`);
    const dEl = document.querySelector("[data-cd-days]");
    const hEl = document.querySelector("[data-cd-hours]");
    const mEl = document.querySelector("[data-cd-mins]");
    const sEl = document.querySelector("[data-cd-secs]");

    function pad(n) { return String(n).padStart(2, "0"); }

    let timer;
    function tick() {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) {
        if (titleEl) titleEl.textContent = `${proxima.nombre} — ¡EN CURSO!`;
        [dEl, hEl, mEl, sEl].forEach((el) => { if (el) el.textContent = "00"; });
        clearInterval(timer);
        return;
      }
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      if (dEl) dEl.textContent = pad(days);
      if (hEl) hEl.textContent = pad(hours);
      if (mEl) mEl.textContent = pad(mins);
      if (sEl) sEl.textContent = pad(secs);
    }

    tick();
    timer = setInterval(tick, 1000);
  });
})();
