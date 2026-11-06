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
    items.forEach((el) => {
      // Escalonado: los elementos de una misma rejilla aparecen uno tras otro.
      if (!el.style.transitionDelay && el.parentElement) {
        const hermanos = [...el.parentElement.children].filter((c) => c.classList.contains("reveal"));
        const i = hermanos.indexOf(el);
        if (i > 0) el.style.transitionDelay = `${Math.min(i, 6) * 70}ms`;
      }
      window.__revealObserver.observe(el);
    });
  }

  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Encabezados de sección, citas y bloques del dossier aparecen al hacer scroll.
  function marcarRevealExtra() {
    if (reduceMotion) return;
    document.querySelectorAll(".section-head, .pull-quote, .dossier-block, .story-photo, .map-frame, .calendar, .filters")
      .forEach((el) => {
        const r = el.getBoundingClientRect();
        // Lo que ya se ve al cargar no se oculta.
        if (r.top < window.innerHeight * 0.9) return;
        el.classList.add("reveal");
      });
  }

  // Línea fina bajo la barra superior que indica cuánto queda de página.
  function initScrollProgress() {
    if (reduceMotion) return;
    const barra = document.createElement("div");
    barra.className = "scroll-progress";
    barra.setAttribute("aria-hidden", "true");
    document.body.appendChild(barra);
    let pendiente = false;
    function actualizar() {
      pendiente = false;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      barra.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
    }
    window.addEventListener("scroll", () => {
      if (!pendiente) { pendiente = true; requestAnimationFrame(actualizar); }
    }, { passive: true });
    actualizar();
  }

  // Números que suben desde 0 (plazas libres, operaciones activas...).
  function animarNumero(el, destino) {
    if (!el) return;
    if (reduceMotion || typeof destino !== "number" || destino <= 0) { el.textContent = destino; return; }
    const inicio = performance.now(), dur = 900;
    function paso(t) {
      const p = Math.min(1, (t - inicio) / dur);
      el.textContent = Math.round(destino * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(paso);
    }
    requestAnimationFrame(paso);
  }
  window.animarNumero = animarNumero;

  // Titulares que se "descifran" letra a letra al cargar, como un terminal.
  const CARACTERES = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#/<>";
  function descifrar(el) {
    if (reduceMotion || !el || el.dataset.descifrado) return;
    el.dataset.descifrado = "1";
    const nodos = [];
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      if (walker.currentNode.nodeValue.trim()) nodos.push({ n: walker.currentNode, t: walker.currentNode.nodeValue });
    }
    const total = nodos.reduce((a, x) => a + x.t.length, 0);
    if (!total) return;
    const dur = Math.min(1100, 350 + total * 22);
    const inicio = performance.now();
    function paso(ahora) {
      const p = Math.min(1, (ahora - inicio) / dur);
      const resueltos = Math.floor(total * p);
      let g = 0;
      nodos.forEach(({ n, t }) => {
        let out = "";
        for (let i = 0; i < t.length; i++, g++) {
          const c = t[i];
          out += (g < resueltos || c.trim() === "") ? c : CARACTERES[(Math.random() * CARACTERES.length) | 0];
        }
        n.nodeValue = out;
      });
      if (p < 1) requestAnimationFrame(paso);
      else nodos.forEach(({ n, t }) => { n.nodeValue = t; });
    }
    requestAnimationFrame(paso);
  }
  window.descifrar = descifrar;

  // La barra superior se marca al hacer scroll.
  function initNavbarScroll() {
    const nav = document.querySelector(".navbar");
    if (!nav) return;
    const marcar = () => nav.classList.toggle("is-scrolled", window.scrollY > 8);
    window.addEventListener("scroll", marcar, { passive: true });
    marcar();
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
    marcarRevealExtra();
    reScanReveal();
    initScrollProgress();
    initNavbarScroll();
    document.querySelectorAll(".hero__title, .page-header h1").forEach(descifrar);
    initCookieBanner();
  });
})();
