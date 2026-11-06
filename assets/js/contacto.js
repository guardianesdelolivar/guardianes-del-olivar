/**
 * CONTACTO.JS — validación del formulario de contacto y envío REAL por email.
 *
 * ANTES: este archivo solo ocultaba el formulario y mostraba "MENSAJE
 * RECIBIDO" sin enviar el mensaje a ningún sitio. Es un problema de
 * confianza real (el usuario cree que ha contactado con la organización
 * y el mensaje no llega a ningún lado), así que se ha corregido.
 *
 * AHORA: usa el mismo servicio EmailJS que ya usa la web para el briefing
 * de inscripción (sin servidor propio). Para activarlo de verdad:
 *   1. Entra en tu cuenta de https://www.emailjs.com (la misma que ya usas).
 *   2. Crea una plantilla nueva (Email Templates → Create New Template)
 *      que reciba estas variables: from_name, from_email, asunto, mensaje.
 *      Configúrala para que te la envíe a ti (guardianesdelolivar@gmail.com).
 *   3. Copia el ID de esa plantilla y sustituye CONTACTO_TEMPLATE_ID más abajo.
 * Mientras no hagas ese paso, el formulario sigue funcionando y sigue
 * validando los datos, pero en vez de mentir diciendo "mensaje recibido"
 * mostrará honestamente que no se ha podido enviar automáticamente y
 * ofrecerá contactar por WhatsApp o email directo.
 */
const CONTACTO_TEMPLATE_ID = "TU_TEMPLATE_ID_CONTACTO";
// Misma cuenta/servicio de EmailJS que ya usa assets/js/inscripcion.js.
const EMAILJS_CONTACTO_CONFIG = {
  serviceId: "service_wefeffr",
  publicKey: "V_tz7LdkKL-4X5Iiq",
};

(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("[data-contact-form]");
    if (!form) return;
    const success = document.querySelector("[data-contact-success]");

    const emailjsListo =
      typeof window.emailjs !== "undefined" &&
      EMAILJS_CONTACTO_CONFIG.publicKey &&
      CONTACTO_TEMPLATE_ID &&
      CONTACTO_TEMPLATE_ID !== "TU_TEMPLATE_ID_CONTACTO";

    if (typeof window.emailjs !== "undefined" && EMAILJS_CONTACTO_CONFIG.publicKey) {
      try {
        window.emailjs.init({ publicKey: EMAILJS_CONTACTO_CONFIG.publicKey });
      } catch (err) {
        console.error("No se pudo inicializar EmailJS en contacto:", err);
      }
    }

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

    function mostrarResultado(ok) {
      form.style.display = "none";
      success.classList.add("is-visible");
      const titulo = success.querySelector("h3");
      const texto = success.querySelector("p");
      if (ok) {
        if (titulo) titulo.textContent = "MENSAJE ENVIADO";
        if (texto) texto.textContent = "Gracias por escribirnos. La organización responde normalmente en menos de 48 horas.";
      } else {
        if (titulo) titulo.textContent = "NO SE HA PODIDO ENVIAR AUTOMÁTICAMENTE";
        if (texto) {
          texto.innerHTML = 'No hemos podido enviar tu mensaje por este formulario. Escríbenos directamente por <a href="https://wa.me/34642064232" target="_blank" rel="noopener" style="color:var(--c-green-bright);">WhatsApp</a> o a <a href="mailto:guardianesdelolivar@gmail.com" style="color:var(--c-green-bright);">guardianesdelolivar@gmail.com</a>.';
        }
      }
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      let valid = true;
      const nombre = form.querySelector("#c-nombre");
      const email = form.querySelector("#c-email");
      const asunto = form.querySelector("#c-asunto");
      const mensaje = form.querySelector("#c-mensaje");

      if (nombre.value.trim().length < 2) { setError(nombre, "Introduce tu nombre."); valid = false; } else clearError(nombre);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) { setError(email, "Introduce un email válido."); valid = false; } else clearError(email);
      if (mensaje.value.trim().length < 10) { setError(mensaje, "Cuéntanos un poco más (mínimo 10 caracteres)."); valid = false; } else clearError(mensaje);

      if (!valid) return;

      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "ENVIANDO…"; }

      if (!emailjsListo) {
        // No hay plantilla configurada todavía: no simulamos un envío que
        // no ha ocurrido. Mensaje honesto y alternativa de contacto directo.
        console.info("[Contacto: EmailJS no configurado] El mensaje no se ha enviado automáticamente.");
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "ENVIAR MENSAJE"; }
        mostrarResultado(false);
        return;
      }

      window.emailjs
        .send(EMAILJS_CONTACTO_CONFIG.serviceId, CONTACTO_TEMPLATE_ID, {
          from_name: nombre.value.trim(),
          from_email: email.value.trim(),
          asunto: asunto ? asunto.value : "general",
          mensaje: mensaje.value.trim(),
        })
        .then(() => {
          mostrarResultado(true);
        })
        .catch((err) => {
          console.error("No se pudo enviar el mensaje de contacto:", err);
          mostrarResultado(false);
        })
        .finally(() => {
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "ENVIAR MENSAJE"; }
        });
    });
  });
})();
