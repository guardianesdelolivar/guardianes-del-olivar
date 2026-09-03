/**
 * OPERACION.JS — renderiza el dossier de una operación concreta
 * a partir del parámetro ?op=slug, leyendo assets/js/data/operaciones.js.
 */

(function () {
  "use strict";

  function getParam(name) {
    return new URLSearchParams(location.search).get(name);
  }

  document.addEventListener("DOMContentLoaded", () => {
    (window.PLAZAS_LISTO || Promise.resolve()).finally(() => {
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

    document.querySelector("[data-op-clasificacion]").textContent = `CLASSIFICATION: ${op.clasificacion}`;
    const clasifTag = document.querySelector("[data-op-clasificacion]");
    if (op.clasificacion === "RESTRICTED") clasifTag.classList.add("tag--restricted");
    if (op.clasificacion === "ARCHIVED") clasifTag.classList.add("tag--archived");

    document.querySelector("[data-op-tipo]").textContent = op.tipo;
    document.querySelector("[data-op-dificultad-tag]").textContent = `NIVEL: ${op.dificultad.toUpperCase()}`;
    document.querySelector("[data-op-status]").textContent = `MISSION STATUS: ${op.status === "finalizado" ? "CLOSED" : "ACTIVE"}`;

    document.querySelector("[data-op-nombre]").textContent = op.nombre;
    document.querySelector("[data-op-codigo]").textContent = `${op.codigo} · ${op.fechaDisplay} · ${op.ubicacion}, ${op.localidad}`;

    document.querySelector("[data-op-badge]").outerHTML = `<span class="badge ${ESTADO_BADGE_CLASS[op.status]}" style="position:static;display:inline-flex;" data-op-badge><span class="dot"></span>${ESTADO_TEXTO[op.status]}</span>`;

    document.querySelector("[data-op-resumen]").textContent = op.resumen;
    document.querySelector("[data-op-historia]").textContent = op.historia;
    document.querySelector("[data-op-briefing]").textContent = op.briefing;

    document.querySelector("[data-op-objetivos]").innerHTML = op.objetivos.map((o) => `<li>${o.icono} ${o.texto}</li>`).join("");

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
    document.querySelector("[data-op-facciones]").textContent = op.facciones.join(" vs ");
    document.querySelector("[data-op-max]").textContent = `${op.maxParticipantes} operadores`;

    document.querySelector("[data-op-availability]").innerHTML = availabilityHTML(op);

    const checklist = document.querySelector("[data-op-checklist]");
    const checklistBlock = document.querySelector("[data-op-checklist-block]");
    if (op.queLlevar.length) {
      checklist.innerHTML = op.queLlevar.map((i) => `<li>${i}</li>`).join("");
    } else if (checklistBlock) {
      checklistBlock.style.display = "none";
    }

    const ctaBtn = document.querySelector("[data-op-cta]");
    const inscribible = op.status === "abiertas" || op.status === "ultimas";
    if (inscribible) {
      ctaBtn.href = `inscripcion.html?op=${op.id}`;
      ctaBtn.textContent = "INICIAR INSCRIPCIÓN";
    } else {
      ctaBtn.removeAttribute("href");
      ctaBtn.textContent = op.status === "completo" ? "OPERACIÓN COMPLETA" : "OPERACIÓN FINALIZADA";
      ctaBtn.classList.add("btn-outline");
      ctaBtn.classList.remove("btn-primary");
      ctaBtn.setAttribute("aria-disabled", "true");
      ctaBtn.style.pointerEvents = "none";
      ctaBtn.style.opacity = "0.5";
    }
    });
  });
})();
