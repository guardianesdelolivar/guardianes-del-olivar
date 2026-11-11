/**
 * RESTABLECER.JS — página a la que lleva el enlace de "¿Has olvidado tu
 * contraseña?". El enlace abre una sesión temporal y aquí se elige la
 * contraseña nueva.
 */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    const cliente = window.supabaseClient;
    const estado = document.querySelector("[data-reset-estado]");
    const form = document.querySelector("[data-reset-form]");
    const msg = document.querySelector("[data-reset-msg]");
    const emailEl = document.querySelector("[data-reset-email]");
    if (!cliente) { estado.textContent = "No se ha podido conectar con el sistema de cuentas."; return; }

    // El enlace puede traer un error (caducado, ya usado…).
    const hash = new URLSearchParams(location.hash.slice(1));
    const query = new URLSearchParams(location.search);
    const errorEnlace = hash.get("error_description") || query.get("error_description");

    let mostrado = false;
    function mostrarFormulario(user) {
      if (mostrado || !user) return;
      mostrado = true;
      estado.hidden = true;
      form.hidden = false;
      emailEl.textContent = user.email || "—";
      form.password.focus();
    }
    function enlaceNoValido() {
      if (mostrado) return;
      estado.innerHTML = `El enlace no es válido o ha caducado (dura 1 hora y solo sirve una vez). <a href="login.html" style="color:var(--c-green-bright);">Pide uno nuevo</a> desde «¿Has olvidado tu contraseña?».`;
    }

    if (errorEnlace) { enlaceNoValido(); return; }

    cliente.auth.onAuthStateChange((evento, sesion) => {
      if (sesion && sesion.user) mostrarFormulario(sesion.user);
    });
    // Margen para que Supabase lea el enlace; si no hay sesión, el enlace no vale.
    setTimeout(() => {
      cliente.auth.getSession().then(({ data }) => {
        if (data && data.session) mostrarFormulario(data.session.user);
        else enlaceNoValido();
      });
    }, 2500);

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const p1 = form.password.value;
      const p2 = form.password2.value;
      const ok1 = p1.length >= 6;
      const ok2 = ok1 && p1 === p2;
      form.password.closest(".field").classList.toggle("has-error", !ok1);
      form.password2.closest(".field").classList.toggle("has-error", ok1 && !ok2);
      if (!ok2) return;
      const btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      msg.style.color = "";
      msg.textContent = "Guardando…";
      cliente.auth.updateUser({ password: p1 }).then(({ error }) => {
        if (error) {
          btn.disabled = false;
          msg.style.color = "var(--c-red-bright)";
          const m = (error.message || "").toLowerCase();
          msg.textContent = m.includes("different from the old")
            ? "La contraseña nueva tiene que ser distinta de la anterior."
            : m.includes("session")
              ? "El enlace ha caducado. Pide uno nuevo desde «¿Has olvidado tu contraseña?»."
              : "No se pudo guardar la contraseña. Inténtalo de nuevo.";
          return;
        }
        msg.style.color = "var(--c-green-bright)";
        msg.textContent = "Contraseña cambiada. Ya has iniciado sesión; te llevamos a tu cuenta…";
        setTimeout(() => { location.href = "login.html"; }, 2000);
      });
    });
  });
})();
