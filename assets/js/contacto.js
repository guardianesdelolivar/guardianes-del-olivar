/**
 * CONTACTO.JS — validación básica del formulario de contacto.
 */

(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("[data-contact-form]");
    if (!form) return;
    const success = document.querySelector("[data-contact-success]");

    function setError(field, msg) {
      const wrap = field.closest(".field");
      if (!wrap) return;
      wrap.classList.add("has-error");
      const err = wrap.querySelector(".field__error");
      if (err) err.textContent = msg;
    }
    function clearError(field) {
      const wrap = field.closest(".field");
      if (!wrap) return;
      wrap.classList.remove("has-error");
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      let valid = true;
      const nombre = form.querySelector("#c-nombre");
      const email = form.querySelector("#c-email");
      const mensaje = form.querySelector("#c-mensaje");

      if (nombre.value.trim().length < 2) { setError(nombre, "Introduce tu nombre."); valid = false; } else clearError(nombre);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) { setError(email, "Introduce un email válido."); valid = false; } else clearError(email);
      if (mensaje.value.trim().length < 10) { setError(mensaje, "Cuéntanos un poco más (mínimo 10 caracteres)."); valid = false; } else clearError(mensaje);

      if (!valid) return;

      form.style.display = "none";
      success.classList.add("is-visible");
    });
  });
})();
