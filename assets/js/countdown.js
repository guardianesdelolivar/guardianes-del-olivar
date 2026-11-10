/**
 * COUNTDOWN.JS — cuenta atrás hasta la próxima operación en la portada.
 * Lee la fecha/hora directamente de assets/js/data/operaciones.js,
 * así que si cambiáis la fecha ahí, la cuenta atrás se actualiza sola.
 */

(function () {
  "use strict";

  cuandoOperaciones(() => {
    const wrap = document.querySelector("[data-countdown]");
    const titleEl = document.querySelector("[data-countdown-title]");
    if (!wrap || typeof OPERACIONES === "undefined") return;

    const proxima = ordenarOperacionesPorFecha(
      OPERACIONES.filter((op) => op.status !== "finalizado")
    )[0];

    if (!proxima) {
      if (titleEl) titleEl.textContent = "No hay operaciones programadas todavía";
      wrap.style.display = "none";
      const cta = document.querySelector("[data-countdown-cta]");
      if (cta) cta.textContent = "VER OPERACIONES ANTERIORES";
      return;
    }

    if (titleEl) titleEl.textContent = proxima.nombre;
    const previsionEl = document.querySelector("[data-prevision-linea]");
    if (previsionEl && window.TiempoCampo) {
      window.TiempoCampo.resumen(proxima).then((texto) => {
        if (!texto) return;
        previsionEl.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5"/></svg> PREVISIÓN EN EL CAMPO: ${texto}`;
        previsionEl.hidden = false;
      });
    }

    // Hora de inicio en hora de España, sea cual sea la zona del visitante.
    const target = fechaHoraMadrid(proxima.fecha, proxima.horaInicio);
    const dEl = document.querySelector("[data-cd-days]");
    const hEl = document.querySelector("[data-cd-hours]");
    const mEl = document.querySelector("[data-cd-mins]");
    const sEl = document.querySelector("[data-cd-secs]");

    function pad(n) { return String(n).padStart(2, "0"); }
    // Pone el número y lo hace "saltar" solo si ha cambiado.
    function poner(el, valor) {
      if (!el || el.textContent === valor) return;
      el.textContent = valor;
      el.classList.remove("is-tick");
      void el.offsetWidth;
      el.classList.add("is-tick");
    }

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
      poner(dEl, pad(days));
      poner(hEl, pad(hours));
      poner(mEl, pad(mins));
      poner(sEl, pad(secs));
    }

    tick();
    timer = setInterval(tick, 1000);
  });
})();
