/**
 * INSCRIPCION.JS — resumen de la operación seleccionada, validación
 * de formulario en cliente y pantalla de confirmación visual.
 *
 * ARQUITECTURA DE PAGOS: este formulario NO procesa pagos reales.
 * Al confirmar, se genera un objeto `inscripcionPayload` con todos los
 * datos necesarios para conectarlo más adelante a una pasarela real
 * (Stripe Checkout / PayPal Orders API). Sustituir la función
 * `procesarInscripcion()` por la llamada a la pasarela elegida.
 *
 * ENVÍO AUTOMÁTICO DEL BRIEFING POR EMAIL:
 * Al inscribirse, se intenta enviar automáticamente un email de
 * confirmación con la fecha, el horario y la ubicación de la operación
 * (los mismos datos que hay en assets/js/data/operaciones.js: si los
 * actualizáis ahí, el email sale ya actualizado, sin tocar nada más).
 *
 * Para que el envío sea REAL hace falta una cuenta gratuita en
 * https://www.emailjs.com (no requiere servidor propio). Una vez
 * creada, rellenad estos 3 valores con los que os da EmailJS:
 *
 * RENDIMIENTO: el formulario se pinta y queda interactivo de inmediato,
 * sin esperar al contador de plazas en vivo. Cuando llega ese dato se
 * refresca solo el resumen (badge/disponibilidad), sin bloquear la carga.
 */
const EMAILJS_CONFIG = {
  serviceId: "service_wefeffr",
  templateId: "template_v839cbb", // Plantilla que recibe EL INSCRITO (confirmación + briefing)
  templateIdOrganizador: "template_p2ckpzs", // Plantilla que RECIBES TÚ con los datos del inscrito
  publicKey: "V_tz7LdkKL-4X5Iiq",
};

(function () {
  "use strict";

  let emailjsListo =
    typeof window.emailjs !== "undefined" &&
    EMAILJS_CONFIG.publicKey &&
    EMAILJS_CONFIG.publicKey !== "TU_PUBLIC_KEY";

  if (emailjsListo) {
    try {
      window.emailjs.init({ publicKey: EMAILJS_CONFIG.publicKey });
    } catch (err) {
      console.error("No se pudo inicializar EmailJS (el formulario seguirá funcionando igualmente):", err);
      emailjsListo = false;
    }
  }

  function enviarBriefingPorEmail(payload, operacion) {
    if (!emailjsListo) {
      // PRIVACIDAD: no se registra el email ni el nombre del inscrito en
      // consola, solo un aviso genérico de que el envío no está configurado.
      console.info("[EmailJS no configurado] No se ha enviado el briefing automático para esta inscripción.");
      return Promise.resolve({ enviado: false, motivo: "EmailJS no configurado" });
    }
    return window.emailjs
      .send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templateId, {
        to_email: payload.email,
        to_name: payload.nombre,
        operacion_nombre: operacion.nombre,
        fecha: operacion.fechaDisplay,
        horario: operacion.horario,
        ubicacion: `${operacion.ubicacion}, ${operacion.localidad}`,
        precio: `${payload.precioFinal} €`,
        almuerzo: payload.quiereAlmuerzo ? payload.almuerzo : "No almuerza",
        callsign: payload.callsign,
      })
      .then(() => ({ enviado: true }))
      .catch((err) => {
        console.error("No se pudo enviar el email de briefing:", err);
        return { enviado: false, motivo: "Error al enviar" };
      });
  }

  function enviarNotificacionOrganizador(payload, operacion, referencia) {
    const organizadorListo =
      emailjsListo &&
      EMAILJS_CONFIG.templateIdOrganizador &&
      EMAILJS_CONFIG.templateIdOrganizador !== "TU_TEMPLATE_ID_ORGANIZADOR";

    if (!organizadorListo) {
      // PRIVACIDAD: no se vuelcan los datos del inscrito a la consola.
      console.info("[Notificación al organizador no configurada] No se ha enviado el aviso por email para esta inscripción.");
      return Promise.resolve({ enviado: false });
    }
    return window.emailjs
      .send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templateIdOrganizador, {
        referencia: referencia,
        operacion_nombre: operacion.nombre,
        nombre: payload.nombre,
        apellidos: payload.apellidos,
        dni: payload.dni,
        telefono: payload.telefono,
        email: payload.email,
        callsign: payload.callsign,
        equipo: payload.equipo || "—",
        experiencia: payload.experiencia,
        observaciones: payload.observaciones || "—",
        consentimiento_fotos: payload.aceptaFotos ? "Sí" : "No",
        almuerzo: payload.quiereAlmuerzo ? payload.almuerzo : "No almuerza",
        precio_total: `${payload.precioFinal} €`,
      })
      .then(() => ({ enviado: true }))
      .catch((err) => {
        console.error("No se pudo enviar la notificación al organizador:", err);
        return { enviado: false };
      });
  }

  function getParam(name) {
    return new URLSearchParams(location.search).get(name);
  }

  const VALIDADORES = {
    nombre: (v) => v.trim().length >= 2,
    apellidos: (v) => v.trim().length >= 2,
    dni: (v) => /^(\d{8}[A-Za-z]|[XYZxyz]\d{7}[A-Za-z])$/.test(v.trim()),
    telefono: (v) => /^(\+34\s?)?[6789]\d{2}\s?\d{3}\s?\d{3}$/.test(v.trim()),
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
    callsign: (v) => v.trim().length >= 2,
    experiencia: (v) => v.trim().length > 0,
  };

  const MENSAJES_ERROR = {
    nombre: "Introduce tu nombre.",
    apellidos: "Introduce tus apellidos.",
    dni: "Formato de DNI/NIE no válido (ej. 12345678A).",
    telefono: "Introduce un teléfono válido (9 dígitos).",
    email: "Introduce un email válido.",
    callsign: "Introduce tu nombre de operador / callsign.",
    experiencia: "Selecciona tu nivel de experiencia.",
  };

  document.addEventListener("DOMContentLoaded", () => {
    const id = getParam("op");
    const op = id ? obtenerOperacionPorId(id) : null;
    const summary = document.querySelector("[data-inscripcion-summary]");
    const form = document.querySelector("[data-inscripcion-form]");
    const notFound = document.querySelector("[data-inscripcion-not-found]");
    const opSelect = document.querySelector("[data-op-select]");
    const successPanel = document.querySelector("[data-form-success]");
    const hiddenOpId = document.querySelector("[data-hidden-op-id]");

    // Selector de operación (por si el usuario llega sin operación preseleccionada
    // o quiere cambiarla).
    if (opSelect) {
      const inscribibles = ordenarOperacionesPorFecha(
        OPERACIONES.filter((o) => o.status === "abiertas" || o.status === "ultimas")
      );
      opSelect.innerHTML = inscribibles
        .map((o) => `<option value="${o.id}">${o.nombre} — ${o.fechaDisplay}</option>`)
        .join("");
      if (op) opSelect.value = op.id;
      opSelect.addEventListener("change", () => {
        const url = new URL(location.href);
        url.searchParams.set("op", opSelect.value);
        location.href = url.toString();
      });
    }

    function renderSummary(operacion) {
      if (!operacion) return;
      summary.innerHTML = `
        <span class="badge ${ESTADO_BADGE_CLASS[operacion.status]}" style="position:static;display:inline-flex;margin-bottom:14px;"><span class="dot"></span>${ESTADO_TEXTO[operacion.status]}</span>
        <h3 style="margin-bottom:10px;">${operacion.nombre}</h3>
        <dl style="display:grid;grid-template-columns:auto 1fr;gap:8px 12px;font-size:13.5px;margin-bottom:16px;">
          <dt class="divider-coords">FECHA</dt><dd>${operacion.fechaDisplay}</dd>
          <dt class="divider-coords">LUGAR</dt><dd>${operacion.ubicacion}, ${operacion.localidad}${operacion.mapaUbicacion ? ` <a href="${operacion.mapaUbicacion}" target="_blank" rel="noopener" style="color:var(--c-green-bright);">(ver en Maps)</a>` : ""}</dd>
          ${operacion.puntoEncuentro ? `<dt class="divider-coords">ENCUENTRO</dt><dd>${operacion.puntoEncuentro}${operacion.mapaPuntoEncuentro ? ` <a href="${operacion.mapaPuntoEncuentro}" target="_blank" rel="noopener" style="color:var(--c-green-bright);">(ver en Maps)</a>` : ""}</dd>` : ""}
          <dt class="divider-coords">HORARIO</dt><dd>${operacion.horario}</dd>
          <dt class="divider-coords">PRECIO</dt><dd>${operacion.precio} €${operacion.pago ? `<br><small style="color:var(--c-grey-dim);">${operacion.pago}</small>` : ""}</dd>
        </dl>
        ${availabilityHTML(operacion)}`;
      if (hiddenOpId) hiddenOpId.value = operacion.id;
    }

    if (!op) {
      if (form) form.closest(".form-card").style.display = "none";
      if (summary) summary.closest(".info-card").style.display = "none";
      if (notFound) notFound.style.display = "block";
      return;
    }

    if (op.status !== "abiertas" && op.status !== "ultimas") {
      summary.closest(".info-card").innerHTML = `<div class="empty-state">ESTA OPERACIÓN NO ADMITE NUEVAS INSCRIPCIONES (${ESTADO_TEXTO[op.status]}).<br><br><a class="btn btn-outline" href="operaciones.html">VER OTRAS OPERACIONES</a></div>`;
      if (form) form.closest(".form-card").style.display = "none";
      return;
    }

    renderSummary(op);
    // Cuando llegue el número real de plazas, refrescamos solo el resumen
    // (badge y barra de disponibilidad), sin bloquear la carga del formulario.
    (window.PLAZAS_LISTO || Promise.resolve()).then(() => renderSummary(op));

    if (!form) return;

    // CUENTA OBLIGATORIA: solo se puede inscribir quien ha iniciado sesión.
    // Así cada cuenta se apunta una sola vez a cada operación (lo garantiza
    // también la base de datos con una restricción única) y sus datos se
    // rellenan solos desde su perfil.
    let usuarioActual = null;
    const volverAqui = `inscripcion.html?op=${encodeURIComponent(op.id)}`;
    const avisoSesion = document.createElement("div");
    avisoSesion.className = "empty-state";
    avisoSesion.textContent = "Comprobando tu sesión…";
    form.hidden = true;
    form.insertAdjacentElement("beforebegin", avisoSesion);

    function mostrarAccesoObligatorio() {
      avisoSesion.className = "auth-gate";
      avisoSesion.innerHTML = `
        <h3>Necesitas una cuenta para inscribirte</h3>
        <p>Crea tu cuenta (o entra si ya tienes una) y vuelves aquí directamente. Tus datos se guardan en tu perfil, así la próxima vez el formulario se rellena solo.</p>
        <div class="auth-gate__actions">
          <a class="btn btn-primary" href="login.html?modo=registro&volver=${encodeURIComponent(volverAqui)}">CREAR CUENTA</a>
          <a class="btn btn-outline" href="login.html?volver=${encodeURIComponent(volverAqui)}">YA TENGO CUENTA</a>
        </div>`;
    }

    const comprobarSesion = window.obtenerUsuarioActual ? window.obtenerUsuarioActual() : Promise.resolve(null);
    comprobarSesion.then((user) => {
      if (!user) { mostrarAccesoObligatorio(); return; }
      usuarioActual = user;
      avisoSesion.remove();
      form.hidden = false;

      const emailField = form.querySelector('[name="email"]');
      if (emailField && !emailField.value) emailField.value = user.email;
      if (window.obtenerPerfil) {
        window.obtenerPerfil(user.id).then((perfil) => {
          if (!perfil) return;
          ["nombre", "apellidos", "dni", "telefono", "callsign", "equipo"].forEach((campo) => {
            const input = form.querySelector(`[name="${campo}"]`);
            if (input && !input.value && perfil[campo]) input.value = perfil[campo];
          });
          const expSelect = form.querySelector('[name="experiencia"]');
          if (expSelect && !expSelect.value && perfil.experiencia) expSelect.value = perfil.experiencia;
        });
      }

      // Evita que una misma cuenta se inscriba dos veces en la misma operación.
      if (window.supabaseClient) {
        window.supabaseClient
          .from("inscripciones_registro")
          .select("id")
          .eq("user_id", user.id)
          .eq("operacion_id", op.id)
          .maybeSingle()
          .then(({ data }) => {
            if (data) bloquearPorDuplicado();
          });
      }
    });

    function bloquearPorDuplicado() {
      form.querySelectorAll("input, select, textarea, button").forEach((el) => (el.disabled = true));
      if (form.nextElementSibling && form.nextElementSibling.hasAttribute("data-aviso-duplicado")) return;
      const aviso = document.createElement("div");
      aviso.className = "empty-state";
      aviso.setAttribute("data-aviso-duplicado", "");
      aviso.style.marginTop = "18px";
      aviso.textContent = "Ya estás inscrito en esta operación con esta cuenta. Si crees que es un error, contacta con la organización.";
      form.insertAdjacentElement("afterend", aviso);
    }

    // Guarda la inscripción en la base de datos ANTES de dar la plaza por
    // confirmada. Si la cuenta ya estaba inscrita, la base de datos lo rechaza.
    function reservarPlaza(payload) {
      if (!usuarioActual || !window.supabaseClient) return Promise.resolve("sin-sesion");
      // Se guarda una copia de los datos de la inscripción: la usa la lista
      // del organizador y el recordatorio automático por email.
      const datos = {
        fecha: op.fecha,
        fechaDisplay: op.fechaDisplay,
        horario: op.horario,
        operacion: op.nombre,
        ubicacion: `${op.ubicacion}, ${op.localidad}`,
        nombre: payload.nombre,
        apellidos: payload.apellidos,
        callsign: payload.callsign,
        telefono: payload.telefono,
        email: payload.email,
        experiencia: payload.experiencia,
        equipo: payload.equipo || "",
        observaciones: payload.observaciones || "",
        duerme: op.pernocta ? !!payload.duerme : null,
        almuerzo: payload.quiereAlmuerzo ? payload.almuerzo : null,
        fotos: !!payload.aceptaFotos,
        precio: payload.precioFinal,
      };
      return window.supabaseClient
        .from("inscripciones_registro")
        .insert({ user_id: usuarioActual.id, operacion_id: op.id, datos })
        .then(({ error }) => {
          if (!error) return "ok";
          if (error.code === "23505") return "duplicada";
          console.error("No se pudo guardar la inscripción en la base de datos:", error.message);
          return "error";
        });
    }

    function setFieldError(field, message) {
      const wrap = field.closest(".field");
      if (!wrap) return;
      wrap.classList.add("has-error");
      const errEl = wrap.querySelector(".field__error");
      if (errEl) errEl.textContent = message;
    }
    function clearFieldError(field) {
      const wrap = field.closest(".field");
      if (!wrap) return;
      wrap.classList.remove("has-error");
    }

    function validateField(field) {
      const name = field.name;
      if (VALIDADORES[name]) {
        const ok = VALIDADORES[name](field.value);
        if (!ok) { setFieldError(field, MENSAJES_ERROR[name]); return false; }
      }
      clearFieldError(field);
      return true;
    }

    form.querySelectorAll(".field input[name], .field select[name][required]").forEach((field) => {
      field.addEventListener("blur", () => validateField(field));
    });

    // Almuerzo opcional (+10 €). Se oculta en operaciones donde cada
    // jugador trae su comida (almuerzo: false en operaciones.js).
    const bloquePernocta = form.querySelector("[data-pernocta-block]");
    if (bloquePernocta && op.pernocta) bloquePernocta.hidden = false;
    if (op.almuerzo === false) {
      const bloqueAlmuerzo = form.querySelector("[data-almuerzo-block]");
      if (bloqueAlmuerzo) bloqueAlmuerzo.remove();
    }
    const almuerzoToggle = form.querySelector("[data-almuerzo-toggle]");
    const almuerzoDetalle = form.querySelector("[data-almuerzo-detalle]");
    const almuerzoSelect = form.querySelector("#almuerzo");
    const almuerzoOtroWrap = form.querySelector("[data-almuerzo-otro-wrap]");
    const almuerzoOtroInput = form.querySelector("#almuerzo_otro");
    const precioTotalEl = document.querySelector("[data-precio-total]");

    function actualizarPrecioTotal() {
      const base = op.precio;
      const total = almuerzoToggle && almuerzoToggle.checked ? base + 10 : base;
      if (precioTotalEl) precioTotalEl.textContent = `${total} €`;
    }

    if (almuerzoToggle) {
      almuerzoToggle.addEventListener("change", () => {
        if (almuerzoDetalle) almuerzoDetalle.style.display = almuerzoToggle.checked ? "block" : "none";
        if (!almuerzoToggle.checked && almuerzoOtroInput) clearFieldError(almuerzoOtroInput);
        actualizarPrecioTotal();
      });
    }
    if (almuerzoSelect) {
      almuerzoSelect.addEventListener("change", () => {
        const esOtro = almuerzoSelect.value === "otro";
        if (almuerzoOtroWrap) almuerzoOtroWrap.style.display = esOtro ? "block" : "none";
        if (!esOtro && almuerzoOtroInput) clearFieldError(almuerzoOtroInput);
      });
    }
    actualizarPrecioTotal();

    function procesarInscripcion(payload) {
      // Punto de integración futuro: Stripe Checkout Session / PayPal Orders API.
      // De momento solo generamos un identificador visual de confirmación.
      // PRIVACIDAD: no se vuelca el payload completo (DNI, teléfono, email...)
      // a la consola del navegador; solo un registro mínimo sin datos personales.
      console.info("Inscripción registrada (demo, sin pago real) para la operación:", payload.operacionId);
      return { ok: true, referencia: `GDO-${payload.operacionId.toUpperCase()}-${Date.now().toString().slice(-5)}` };
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      let valid = true;
      form.querySelectorAll(".field input[name], .field select[name][required]").forEach((field) => {
        if (!validateField(field)) valid = false;
      });

      // El consentimiento de fotos (acepta_fotos) es opcional a propósito:
      // no debe condicionar la inscripción. Solo normas y riesgos son obligatorios.
      const normas = form.querySelector('[name="acepta_normas"]');
      const riesgos = form.querySelector('[name="acepta_riesgos"]');
      [normas, riesgos].forEach((cb) => {
        const wrap = cb.closest(".field-check");
        if (!cb.checked) {
          valid = false;
          wrap.style.color = "var(--c-red-bright)";
        } else {
          wrap.style.color = "";
        }
      });

      if (almuerzoToggle && almuerzoToggle.checked && almuerzoSelect && almuerzoSelect.value === "otro") {
        if (!almuerzoOtroInput.value.trim()) {
          valid = false;
          setFieldError(almuerzoOtroInput, "Indica qué te gustaría almorzar.");
        } else {
          clearFieldError(almuerzoOtroInput);
        }
      }

      if (!valid) {
        const firstError = form.querySelector(".has-error input, .has-error select, .field-check[style*='red']");
        if (firstError) firstError.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }

      const data = new FormData(form);
      const quiereAlmuerzo = data.get("quiere_almuerzo") === "on";
      let almuerzoElegido = null;
      if (quiereAlmuerzo) {
        const valorSelect = data.get("almuerzo");
        almuerzoElegido = valorSelect === "otro" ? data.get("almuerzo_otro").trim() : valorSelect;
      }
      const precioFinal = op.precio + (quiereAlmuerzo ? 10 : 0);
      const payload = {
        operacionId: op.id,
        nombre: data.get("nombre"),
        apellidos: data.get("apellidos"),
        dni: data.get("dni"),
        telefono: data.get("telefono"),
        email: data.get("email"),
        callsign: data.get("callsign"),
        equipo: data.get("equipo") || null,
        experiencia: data.get("experiencia"),
        observaciones: data.get("observaciones") || null,
        aceptaFotos: data.get("acepta_fotos") === "on",
        quiereAlmuerzo: quiereAlmuerzo,
        almuerzo: almuerzoElegido,
        precioFinal: precioFinal,
        duerme: data.get("duerme") === "on",
      };

      const submitBtn = form.querySelector('button[type="submit"]');
      const errorEnvio = form.querySelector("[data-error-envio]");
      if (errorEnvio) errorEnvio.textContent = "";
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "CONFIRMANDO…"; }

      reservarPlaza(payload).then((reserva) => {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "CONFIRMAR INSCRIPCIÓN"; }
        if (reserva === "sin-sesion") {
          if (errorEnvio) errorEnvio.textContent = "Tu sesión ha caducado. Vuelve a iniciar sesión para inscribirte.";
          return;
        }
        if (reserva === "duplicada") {
          bloquearPorDuplicado();
          return;
        }

        const resultado = procesarInscripcion(payload);
        if (!resultado.ok) return;
        form.style.display = "none";
        successPanel.classList.add("is-visible");
        successPanel.querySelector("[data-ref]").textContent = resultado.referencia;
        successPanel.scrollIntoView({ behavior: "smooth", block: "center" });

        const emailNote = successPanel.querySelector("[data-email-status]");
        enviarBriefingPorEmail(payload, op).then((estado) => {
          if (!emailNote) return;
          emailNote.textContent = estado.enviado
            ? `Te hemos enviado el briefing (fecha, horario y ubicación) a ${payload.email}.`
            : `Guardaremos tu inscripción y te enviaremos el briefing a ${payload.email} en cuanto confirmemos los últimos detalles.`;
        });
        enviarNotificacionOrganizador(payload, op, resultado.referencia);
        if (op.contadorEnVivo) incrementarPlazasEnVivo();
        if (window.actualizarRecuentoInscritos) window.actualizarRecuentoInscritos(op);
        if (usuarioActual && window.guardarPerfil) {
          window.guardarPerfil(usuarioActual.id, {
            nombre: payload.nombre,
            apellidos: payload.apellidos,
            dni: payload.dni,
            telefono: payload.telefono,
            callsign: payload.callsign,
            equipo: payload.equipo || "",
            experiencia: payload.experiencia,
          });
        }
        if (window.registrarInscripcion) {
          window.registrarInscripcion({
            referencia: resultado.referencia,
            operacion: op.nombre,
            nombre: payload.nombre,
            apellidos: payload.apellidos,
            dni: payload.dni,
            telefono: payload.telefono,
            email: payload.email,
            callsign: payload.callsign,
            equipo: payload.equipo || "",
            experiencia: payload.experiencia,
            almuerzo: payload.quiereAlmuerzo ? payload.almuerzo : "No almuerza",
            precio_total: `${payload.precioFinal} €`,
            fotos: payload.aceptaFotos ? "Sí" : "No",
            observaciones: payload.observaciones || "",
          });
        }
      });
    });
  });
})();
