/**
 * OPERACION.JS — renderiza el dossier de una operación concreta
 * a partir del parámetro ?op=slug, leyendo assets/js/data/operaciones.js.
 *
 * RENDIMIENTO: todo el dossier se pinta de inmediato con los datos que ya
 * hay. Solo la parte que depende del contador de plazas en vivo (barra de
 * disponibilidad, badge de estado y botón de inscripción) se actualiza
 * aparte cuando llega esa respuesta, sin bloquear la carga del resto.
 */

(function () {
  "use strict";

  function getParam(name) {
    return new URLSearchParams(location.search).get(name);
  }

  cuandoOperaciones(() => {
    const id = getParam("op");
    const op = id ? obtenerOperacionPorId(id) : null;
    const root = document.querySelector("[data-dossier-root]");
    const notFound = document.querySelector("[data-dossier-not-found]");

    if (!op) {
      if (root) root.style.display = "none";
      if (notFound) notFound.style.display = "block";
      document.title = "Operación no encontrada · GUARDIANES DEL OLIVAR";
      return;
    }

    document.title = `${op.nombre} · GUARDIANES DEL OLIVAR`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", op.resumen);

    // SEO: la URL canónica y los metadatos Open Graph de esta página son
    // dinámicos (dependen de ?op=), así que se ajustan aquí a la operación real.
    const urlCanonica = `https://www.gdoaragon.es/operacion.html?op=${op.id}`;
    const canonicalTag = document.querySelector("[data-canonical]");
    if (canonicalTag) canonicalTag.setAttribute("href", urlCanonica);
    const ogTitle = document.querySelector("[data-og-title]");
    if (ogTitle) ogTitle.setAttribute("content", `${op.nombre} · GUARDIANES DEL OLIVAR`);
    const ogDesc = document.querySelector("[data-og-description]");
    if (ogDesc) ogDesc.setAttribute("content", op.resumen);
    const ogUrl = document.querySelector("[data-og-url]");
    if (ogUrl) ogUrl.setAttribute("content", urlCanonica);

    // SEO: datos estructurados (JSON-LD) para esta operación, construidos
    // solo con los campos reales ya presentes en OPERACIONES (sin inventar
    // ningún dato: ni dirección exacta, ni valoraciones, ni asistentes).
    (function inyectarJsonLd() {
      try {
        // Desfase real de Madrid ese día (+02:00 en verano, +01:00 en invierno).
        const inicioISO = `${op.fecha}T${op.horaInicio || "00:00"}:00${desfaseMadridISO(op.fecha, op.horaInicio)}`;
        const estadoSchema = "https://schema.org/EventScheduled";
        const disponibilidad = (op.status === "abiertas" || op.status === "ultimas") ? "https://schema.org/InStock" : "https://schema.org/SoldOut";
        const ld = {
          "@context": "https://schema.org",
          "@type": "Event",
          "name": op.nombre,
          "description": op.resumen,
          "startDate": inicioISO,
          "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
          "eventStatus": estadoSchema,
          "location": {
            "@type": "Place",
            "name": op.ubicacion,
            "address": {
              "@type": "PostalAddress",
              "addressLocality": op.localidad,
              "addressCountry": "ES"
            }
          },
          "image": [/^https?:/.test(op.imagenCartelCompartir || op.imagenCartel || "") ? (op.imagenCartelCompartir || op.imagenCartel) : `https://www.gdoaragon.es/${op.imagenCartelCompartir || op.imagenCartel}`],
          "organizer": {
            "@type": "Organization",
            "name": "Guardianes del Olivar",
            "url": "https://www.gdoaragon.es/"
          },
          "offers": {
            "@type": "Offer",
            "price": String(op.precio),
            "priceCurrency": "EUR",
            "availability": disponibilidad,
            "url": urlCanonica
          }
        };
        let script = document.querySelector('script[type="application/ld+json"][data-op-jsonld]');
        if (!script) {
          script = document.createElement("script");
          script.type = "application/ld+json";
          script.setAttribute("data-op-jsonld", "");
          document.head.appendChild(script);
        }
        script.textContent = JSON.stringify(ld);
      } catch (err) {
        console.error("No se pudieron generar los datos estructurados:", err);
      }
    })();

    document.querySelector("[data-op-clasificacion]").textContent = `CLASSIFICATION: ${op.clasificacion}`;
    const clasifTag = document.querySelector("[data-op-clasificacion]");
    if (op.clasificacion === "RESTRICTED") clasifTag.classList.add("tag--restricted");
    if (op.clasificacion === "ARCHIVED") clasifTag.classList.add("tag--archived");

    document.querySelector("[data-op-tipo]").textContent = op.tipo;
    document.querySelector("[data-op-dificultad-tag]").textContent = `NIVEL: ${op.dificultad.toUpperCase()}`;

    document.querySelector("[data-op-nombre]").textContent = op.nombre;
    if (window.descifrar) window.descifrar(document.querySelector("[data-op-nombre]"));
    document.querySelector("[data-op-codigo]").textContent = `${op.codigo} · ${op.fechaDisplay} · ${op.ubicacion}, ${op.localidad}`;

    document.querySelector("[data-op-resumen]").textContent = op.resumen;

    // Parte meteorológico (solo partidas que no han pasado)
    const tiempoBloque = document.querySelector("[data-op-tiempo-block]");
    if (tiempoBloque) {
      if (op.status === "finalizado" || !window.TiempoCampo) tiempoBloque.hidden = true;
      else window.TiempoCampo.pintar(document.querySelector("[data-op-tiempo]"), op);
    }

    // Crónica, cuando la partida ya se ha jugado
    const cronicaBloque = document.querySelector("[data-op-cronica-block]");
    if (cronicaBloque && op.cronica) {
      const cronicaEl = document.querySelector("[data-op-cronica]");
      cronicaEl.innerHTML = "";
      op.cronica.split(/\n{2,}/).forEach((parrafo) => {
        const pEl = document.createElement("p");
        pEl.textContent = parrafo.trim();
        cronicaEl.appendChild(pEl);
      });
      const res = document.querySelector("[data-op-resultados]");
      res.innerHTML = "";
      (op.resultados || []).forEach((r) => {
        const li = document.createElement("li");
        li.innerHTML = `<span></span><strong></strong>`;
        li.querySelector("span").textContent = r.mision;
        li.querySelector("strong").textContent = r.ganador;
        res.appendChild(li);
      });
      cronicaBloque.hidden = false;
    }

    // Cartel de la operación dentro del propio dossier (antes solo salía en las tarjetas).
    const cartelBlock = document.querySelector("[data-op-cartel-block]");
    if (cartelBlock && op.imagenCartel) {
      const img = cartelBlock.querySelector("[data-op-cartel]");
      img.src = op.imagenCartel;
      img.alt = `Cartel de ${op.nombre}`;
      cartelBlock.querySelector("[data-op-cartel-link]").href = op.imagenCartelCompartir || op.imagenCartel;
      cartelBlock.hidden = false;
    }
    document.querySelector("[data-op-historia]").textContent = op.historia;
    document.querySelector("[data-op-briefing]").textContent = op.briefing;

    document.querySelector("[data-op-objetivos]").innerHTML = op.objetivos.map((o) => `<li class="has-ico">${icono(o.icono)}<span>${o.texto}</span></li>`).join("");

    document.querySelector("[data-op-misiones]").innerHTML = op.misiones.map((m) => `
      <div class="mission-item">
        <div class="mission-item__num">${m.numero}</div>
        <div><h4>${m.titulo}</h4><p>${m.detalle}</p></div>
      </div>`).join("");

    const rulesBlock = document.querySelector("[data-op-reglas-block]");
    if (op.reglasEspeciales.length) {
      document.querySelector("[data-op-reglas]").innerHTML = op.reglasEspeciales.map((r) => `<li>${r}</li>`).join("");
    } else if (rulesBlock) {
      rulesBlock.style.display = "none";
    }

    // Ficha lateral
    document.querySelector("[data-op-fecha]").textContent = op.fechaDisplay;
    document.querySelector("[data-op-horario]").textContent = op.horario;
    document.querySelector("[data-op-lugar]").innerHTML = `${op.ubicacion}, ${op.localidad}` +
      (op.mapaUbicacion ? ` <a href="${op.mapaUbicacion}" target="_blank" rel="noopener" style="color:var(--c-green-bright);">(ver en Maps)</a>` : "");
    if (op.puntoEncuentro) {
      const encuentroDd = document.querySelector("[data-op-lugar]").closest("dl");
      if (encuentroDd) {
        const dt = document.createElement("dt");
        dt.textContent = "Encuentro";
        const dd = document.createElement("dd");
        dd.innerHTML = `${op.puntoEncuentro}` +
          (op.mapaPuntoEncuentro ? ` <a href="${op.mapaPuntoEncuentro}" target="_blank" rel="noopener" style="color:var(--c-green-bright);">(ver en Maps)</a>` : "") +
          (op.puntoEncuentroAlternativo ? `<br><small style="color:var(--c-grey-dim);">${op.puntoEncuentroAlternativo}${op.mapaPuntoEncuentroAlternativo ? ` <a href="${op.mapaPuntoEncuentroAlternativo}" target="_blank" rel="noopener" style="color:var(--c-green-bright);">(Maps)</a>` : ""}</small>` : "");
        document.querySelector("[data-op-lugar]").closest("dl").appendChild(dt);
        document.querySelector("[data-op-lugar]").closest("dl").appendChild(dd);
      }
    }
    document.querySelector("[data-op-precio]").innerHTML = `${op.precio} €` + (op.pago ? `<br><small style="color:var(--c-grey-dim);font-family:var(--ff-mono);font-size:11px;">${op.pago}</small>` : "");
    document.querySelector("[data-op-dificultad]").textContent = op.dificultad;
    document.querySelector("[data-op-facciones]").textContent = op.facciones.length ? op.facciones.join(" vs ") : "Se reparten en el campo";
    document.querySelector("[data-op-max]").textContent = op.maxParticipantes ? `${op.maxParticipantes} operadores` : "Sin límite";

    const checklist = document.querySelector("[data-op-checklist]");
    const checklistBlock = document.querySelector("[data-op-checklist-block]");
    if (op.queLlevar.length) {
      checklist.innerHTML = op.queLlevar.map((i) => `<li>${i}</li>`).join("");
    } else if (checklistBlock) {
      checklistBlock.style.display = "none";
    }

    // --- Bloque que depende del número de plazas en vivo ---
    // Se pinta ya con el dato que haya disponible, y se vuelve a pintar
    // (sin duplicar nada, solo reemplaza contenido) cuando llega el
    // número real del contador, sin bloquear el resto del dossier.
    function pintarDisponibilidad() {
      document.querySelector("[data-op-badge]").outerHTML = `<span class="badge ${ESTADO_BADGE_CLASS[op.status]}" style="position:static;display:inline-flex;" data-op-badge><span class="dot"></span>${ESTADO_TEXTO[op.status]}</span>`;
      document.querySelector("[data-op-status]").textContent = `MISSION STATUS: ${op.status === "finalizado" ? "CLOSED" : "ACTIVE"}`;
      document.querySelector("[data-op-availability]").innerHTML = availabilityHTML(op);

      const ctaBtn = document.querySelector("[data-op-cta]");
      const inscribible = op.status === "abiertas" || op.status === "ultimas" || admiteListaEspera(op);
      if (inscribible) {
        ctaBtn.href = `inscripcion.html?op=${op.id}`;
        ctaBtn.textContent = admiteListaEspera(op) ? "APUNTARME A LA LISTA DE ESPERA" : "INICIAR INSCRIPCIÓN";
        ctaBtn.classList.add("btn-primary");
        ctaBtn.classList.remove("btn-outline");
        ctaBtn.removeAttribute("aria-disabled");
        ctaBtn.style.pointerEvents = "";
        ctaBtn.style.opacity = "";
      } else {
        ctaBtn.removeAttribute("href");
        ctaBtn.textContent = op.status === "completo" ? "OPERACIÓN COMPLETA" : "OPERACIÓN FINALIZADA";
        ctaBtn.classList.add("btn-outline");
        ctaBtn.classList.remove("btn-primary");
        ctaBtn.setAttribute("aria-disabled", "true");
        ctaBtn.style.pointerEvents = "none";
        ctaBtn.style.opacity = "0.5";
      }
    }
    pintarDisponibilidad();
    (window.PLAZAS_LISTO || Promise.resolve()).then(pintarDisponibilidad);

    // Comentarios
    function escapeHTML(str) {
      return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    }
    function formatearFecha(iso) {
      try {
        return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
      } catch (err) {
        return "";
      }
    }
    const comentariosLista = document.querySelector("[data-comentarios-lista]");
    const comentarioForm = document.querySelector("[data-comentario-form]");

    // Comentarios: solo con cuenta, y el nombre lo pone el servidor a partir
    // del perfil (callsign o nombre de usuario). No se puede escribir otro.
    let usuarioComentario = null;
    let puedeModerar = false;

    function renderComentarios(lista) {
      if (!comentariosLista) return;
      if (!lista.length) {
        comentariosLista.innerHTML = `<p class="empty-state">Todavía no hay comentarios. ¡Sé el primero!</p>`;
        return;
      }
      comentariosLista.innerHTML = lista.map((c) => {
        const borrable = c.id && usuarioComentario && (c.user_id === usuarioComentario.id || puedeModerar);
        return `
        <div class="comment-item">
          <div class="comment-item__meta">
            <span class="comment-item__nombre">${escapeHTML(c.nombre)}</span>
            <span class="comment-item__fecha">${formatearFecha(c.fecha)}</span>
            ${borrable ? `<button type="button" class="comment-item__borrar" data-borrar-comentario="${escapeHTML(c.id)}">BORRAR</button>` : ""}
          </div>
          <p>${escapeHTML(c.texto)}</p>
        </div>`;
      }).join("");
    }

    function recargarComentarios() {
      if (comentariosLista && window.listarComentarios) window.listarComentarios(op.id).then(renderComentarios);
    }

    const sesionComentarios = window.obtenerUsuarioActual ? window.obtenerUsuarioActual() : Promise.resolve(null);

    if (comentarioForm) {
      comentarioForm.hidden = true;
      const avisoComentario = document.createElement("p");
      avisoComentario.className = "form-note";
      avisoComentario.innerHTML = `Para comentar, <a href="login.html" style="color:var(--c-green-bright);">inicia sesión o crea tu cuenta</a>.`;
      comentarioForm.insertAdjacentElement("beforebegin", avisoComentario);
      const autorEl = comentarioForm.querySelector("[data-comentario-autor]");
      const errorEl = comentarioForm.querySelector("[data-comentario-error]");
      const btn = comentarioForm.querySelector('button[type="submit"]');

      sesionComentarios.then((user) => {
        if (!user) return;
        avisoComentario.remove();
        comentarioForm.hidden = false;
        if (window.obtenerPerfil) {
          window.obtenerPerfil(user.id).then((perfil) => {
            const alias = perfil && [perfil.callsign, perfil.username, perfil.nombre].map((v) => (v || "").trim()).find(Boolean);
            if (alias) {
              autorEl.textContent = alias.slice(0, 40);
            } else {
              autorEl.textContent = "(sin nombre)";
              errorEl.innerHTML = `Pon tu callsign en <a href="mi-cuenta.html" style="color:var(--c-green-bright);">Mi cuenta</a> para poder comentar.`;
              btn.disabled = true;
            }
          });
        }
      });

      comentarioForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const texto = comentarioForm.texto.value.trim();
        if (!texto || !window.enviarComentario) return;
        errorEl.textContent = "";
        btn.disabled = true;
        btn.textContent = "PUBLICANDO…";
        window.enviarComentario(op.id, texto).then((res) => {
          btn.disabled = false;
          btn.textContent = "PUBLICAR COMENTARIO";
          if (res && res.ok) {
            comentarioForm.reset();
            recargarComentarios();
          } else {
            errorEl.textContent = (res && res.error) || "No se pudo publicar el comentario.";
          }
        });
      });
    }

    if (comentariosLista) {
      comentariosLista.addEventListener("click", (e) => {
        const b = e.target.closest("[data-borrar-comentario]");
        if (!b || !window.borrarComentario) return;
        if (!b.classList.contains("is-confirmando")) {
          b.classList.add("is-confirmando");
          b.textContent = "¿SEGURO?";
          setTimeout(() => { if (b.isConnected) { b.classList.remove("is-confirmando"); b.textContent = "BORRAR"; } }, 4000);
          return;
        }
        b.disabled = true;
        window.borrarComentario(b.getAttribute("data-borrar-comentario")).then(recargarComentarios);
      });
    }

    sesionComentarios.then((user) => {
      usuarioComentario = user;
      if (!user || !window.supabaseClient) return recargarComentarios();
      window.supabaseClient.rpc("es_organizador").then(({ data }) => {
        puedeModerar = data === true;
        recargarComentarios();
      }, recargarComentarios);
    });
    if (!window.obtenerUsuarioActual) recargarComentarios();

    // --- Compartir, copiar enlace y añadir a calendario ---
    const feedback = document.querySelector("[data-share-feedback]");
    function mostrarFeedback(msg) {
      if (!feedback) return;
      feedback.textContent = msg;
      setTimeout(() => { if (feedback.textContent === msg) feedback.textContent = ""; }, 4000);
    }

    const shareWhatsapp = document.querySelector("[data-share-whatsapp]");
    if (shareWhatsapp) {
      shareWhatsapp.addEventListener("click", () => {
        const texto = `${op.nombre} — ${op.fechaDisplay}, ${op.ubicacion} (${op.localidad}). Más info: ${urlCanonica}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank", "noopener");
      });
    }

    const shareCopy = document.querySelector("[data-share-copy]");
    if (shareCopy) {
      shareCopy.addEventListener("click", () => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(urlCanonica)
            .then(() => mostrarFeedback("Enlace copiado al portapapeles."))
            .catch(() => mostrarFeedback("No se pudo copiar el enlace. Cópialo manualmente: " + urlCanonica));
        } else {
          mostrarFeedback("Copia este enlace manualmente: " + urlCanonica);
        }
      });
    }

    const shareIcs = document.querySelector("[data-share-ics]");
    if (shareIcs) {
      shareIcs.addEventListener("click", () => {
        try {
          const inicio = fechaHoraMadrid(op.fecha, op.horaInicio);
          const fin = op.horaFin ? fechaHoraMadrid(op.fecha, op.horaFin) : new Date(inicio.getTime() + (op.duracionHoras || 4) * 3600000);
          const formatoICS = (d) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
          const lugar = `${op.ubicacion}, ${op.localidad}`;
          const ics = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//Guardianes del Olivar//ES",
            "BEGIN:VEVENT",
            `UID:${op.id}@gdoaragon.es`,
            `DTSTAMP:${formatoICS(new Date())}`,
            `DTSTART:${formatoICS(inicio)}`,
            `DTEND:${formatoICS(fin)}`,
            `SUMMARY:${op.nombre}`,
            `DESCRIPTION:${(op.resumen || "").replace(/\n/g, " ")} Más info: ${urlCanonica}`,
            `LOCATION:${lugar}`,
            "END:VEVENT",
            "END:VCALENDAR",
          ].join("\r\n");
          const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
          const enlace = document.createElement("a");
          enlace.href = URL.createObjectURL(blob);
          enlace.download = `${op.id}.ics`;
          document.body.appendChild(enlace);
          enlace.click();
          document.body.removeChild(enlace);
          mostrarFeedback("Archivo de calendario descargado.");
        } catch (err) {
          console.error("No se pudo generar el archivo de calendario:", err);
          mostrarFeedback("No se pudo generar el archivo de calendario.");
        }
      });
    }
  });
})();
