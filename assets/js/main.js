/**
 * MAIN.JS — comportamiento compartido por todas las páginas:
 * menú hamburguesa, reloj HUD, año dinámico del footer,
 * marcado del enlace activo y animación de aparición al hacer scroll.
 */

(function () {
  "use strict";

  function initNavToggle() {
    const toggle = document.querySelector("[data-nav-toggle]");
    const links = document.querySelector("[data-nav-links]");
    if (!toggle || !links) return;
    toggle.addEventListener("click", () => {
      const isOpen = links.classList.toggle("is-open");
      toggle.classList.toggle("is-active", isOpen);
      toggle.setAttribute("aria-expanded", String(isOpen));
    });
    links.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => {
        links.classList.remove("is-open");
        toggle.classList.remove("is-active");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  function markActiveLink() {
    const current = (location.pathname.split("/").pop() || "index.html");
    document.querySelectorAll("[data-nav-links] a").forEach((a) => {
      const href = a.getAttribute("href");
      if (href === current || (current === "" && href === "index.html")) {
        a.setAttribute("aria-current", "page");
      }
    });
  }

  function initClock() {
    const clockEl = document.querySelector("[data-hud-clock]");
    if (!clockEl) return;
    function tick() {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      const ss = String(now.getSeconds()).padStart(2, "0");
      clockEl.textContent = `${hh}:${mm}:${ss} LOCAL`;
    }
    tick();
    setInterval(tick, 1000);
  }

  function initFooterYear() {
    document.querySelectorAll("[data-year]").forEach((el) => {
      el.textContent = new Date().getFullYear();
    });
  }

  // Elementos con clase "reveal" (tarjetas de operación, fotos de galería...)
  // suelen pintarse DESPUÉS de este DOMContentLoaded, porque los datos se
  // cargan por JS. Si solo escaneáramos una vez al principio, esos
  // elementos nunca entrarían en el observer y se quedarían invisibles
  // (opacity:0) para siempre. Por eso exponemos reScanReveal() en window:
  // cualquier script que inserte contenido ".reveal" dinámicamente debe
  // llamarla justo después de pintarlo.
  function reScanReveal() {
    const items = document.querySelectorAll(".reveal");
    if (!items.length) return;
    if (!("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    if (!window.__revealObserver) {
      window.__revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              window.__revealObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12 }
      );
    }
    items.forEach((el) => window.__revealObserver.observe(el));
  }
  window.reScanReveal = reScanReveal;

  function initOperatorsOnline() {
    const el = document.querySelector("[data-operators-online]");
    if (!el) return;
    // Cifra decorativa estable por sesión, con ligera variación para dar sensación de "en vivo".
    const base = 214;
    el.textContent = String(base);
    setInterval(() => {
      const delta = Math.random() > 0.5 ? 1 : -1;
      const current = parseInt(el.textContent, 10) || base;
      const next = Math.min(260, Math.max(190, current + delta));
      el.textContent = String(next);
    }, 4000);
  }

  document.addEventListener("DOMContentLoaded", () => {
    initNavToggle();
    markActiveLink();
    initClock();
    initFooterYear();
    reScanReveal();
    initOperatorsOnline();
  });
})();
