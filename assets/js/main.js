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

  // Aviso de cookies — se muestra una vez por navegador hasta que se acepta.
  function initCookieBanner() {
    if (localStorage.getItem("gdo_cookies_aceptadas") === "1") return;
    const banner = document.createElement("div");
    banner.className = "cookie-banner";
    banner.innerHTML = `
      <p>Usamos almacenamiento técnico necesario para que funcione la web (por ejemplo, para mantener tu sesión iniciada). No usamos cookies de publicidad ni de analítica. Más info en nuestra <a href="cookies.html">Política de cookies</a>.</p>
      <button type="button" class="btn btn-primary" data-cookie-aceptar>ENTENDIDO</button>`;
    document.body.appendChild(banner);
    banner.querySelector("[data-cookie-aceptar]").addEventListener("click", () => {
      localStorage.setItem("gdo_cookies_aceptadas", "1");
      banner.remove();
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initNavToggle();
    markActiveLink();
    initClock();
    initFooterYear();
    reScanReveal();
    initCookieBanner();
  });
})();
