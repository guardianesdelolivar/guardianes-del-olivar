/**
 * CARDS.JS — utilidades compartidas para pintar tarjetas de operación
 * y textos de estado. Usado por index, operaciones, calendario y dossier.
 */

const ESTADO_TEXTO = {
  abiertas: "🟢 INSCRIPCIONES ABIERTAS",
  ultimas: "🟡 ÚLTIMAS PLAZAS",
  completo: "🔴 COMPLETO",
  finalizado: "⚫ FINALIZADO",
};

const ESTADO_BADGE_CLASS = {
  abiertas: "badge--abiertas",
  ultimas: "badge--ultimas",
  completo: "badge--completo",
  finalizado: "badge--finalizado",
};

function porcentajeOcupacion(op) {
  return Math.round((op.plazasOcupadas / op.plazasTotal) * 100);
}

function claseDisponibilidad(op) {
  const pct = porcentajeOcupacion(op);
  if (op.status === "completo" || op.status === "finalizado" || pct >= 100) return "is-full";
  if (pct >= 80) return "is-high";
  return "";
}

function availabilityHTML(op) {
  const pct = Math.min(100, porcentajeOcupacion(op));
  return `
    <div class="availability">
      <div class="availability__label">
        <span>${op.plazasOcupadas}/${op.plazasTotal} OPERADORES</span>
        <span>${pct}%</span>
      </div>
      <div class="availability__bar">
        <div class="availability__fill ${claseDisponibilidad(op)}" style="width:${pct}%"></div>
      </div>
    </div>`;
}

function objectivesHTML(op, limit) {
  const list = limit ? op.objetivos.slice(0, limit) : op.objetivos;
  return list.map((o) => `<li>${o.icono} ${o.texto}</li>`).join("");
}

function expandDetailHTML(op) {
  const ubicacion = op.mapaUbicacion
    ? `<p><strong>Campo:</strong> ${op.ubicacion}, ${op.localidad} <a href="${op.mapaUbicacion}" target="_blank" rel="noopener">(ver en Maps)</a></p>`
    : "";
  const encuentro = op.puntoEncuentro
    ? `<p><strong>Punto de encuentro:</strong> ${op.puntoEncuentro}${op.mapaPuntoEncuentro ? ` <a href="${op.mapaPuntoEncuentro}" target="_blank" rel="noopener">(ver en Maps)</a>` : ""}${op.puntoEncuentroAlternativo ? `<br><small>${op.puntoEncuentroAlternativo}${op.mapaPuntoEncuentroAlternativo ? ` <a href="${op.mapaPuntoEncuentroAlternativo}" target="_blank" rel="noopener">(Maps)</a>` : ""}</small>` : ""}</p>`
    : "";
  const pago = op.pago ? `<p><strong>Pago:</strong> ${op.pago}</p>` : "";
  const misiones = op.misiones && op.misiones.length
    ? `<p><strong>Misiones:</strong></p><ul>${op.misiones.map((m) => `<li>${m.numero}. ${m.titulo} — ${m.detalle}</li>`).join("")}</ul>`
    : "";
  const queLlevar = op.queLlevar && op.queLlevar.length
    ? `<p><strong>Qué llevar:</strong></p><ul>${op.queLlevar.map((i) => `<li>${i}</li>`).join("")}</ul>`
    : "";
  const reglas = op.reglasEspeciales && op.reglasEspeciales.length
    ? `<p><strong>Reglas especiales:</strong></p><ul>${op.reglasEspeciales.map((r) => `<li>${r}</li>`).join("")}</ul>`
    : "";
  return `${ubicacion}${encuentro}${pago}${misiones}${queLlevar}${reglas}`;
}

function opCardHTML(op, opts) {
  const options = opts || {};
  const inscribible = op.status === "abiertas" || op.status === "ultimas";
  return `
  <article class="op-card reveal">
    <div class="op-card__media">
      ${op.imagenCartel ? `<img class="op-card__media-img" src="${op.imagenCartel}" alt="Cartel de ${op.nombre}" />` : ""}
      <span class="badge ${ESTADO_BADGE_CLASS[op.status]}"><span class="dot"></span>${ESTADO_TEXTO[op.status]}</span>
      <span class="op-card__code">${op.codigo} · ${op.tipo.toUpperCase()}</span>
    </div>
    <div class="op-card__body">
      <h3 class="op-card__title">${op.nombre}</h3>
      <ul class="op-card__meta">
        <li>📅 ${op.fechaDisplay}</li>
        <li>⏱️ ${op.horario}</li>
        <li>🎯 ${op.ubicacion}, ${op.localidad}</li>
        <li>👥 ${op.plazasTotal - op.plazasOcupadas} plazas libres</li>
      </ul>
      <p class="op-card__desc">${op.resumen}</p>
      <div class="op-card__objectives"><ul>${objectivesHTML(op, 2)}</ul></div>
      ${availabilityHTML(op)}
      <div class="op-card__footer">
        <span class="op-card__price">${op.precio}&nbsp;€</span>
        <span class="tag">${op.dificultad}</span>
      </div>
      <details class="op-card__expand"${options.expanded ? " open" : ""}>
        <summary>TODOS LOS DATOS DE LA OPERACIÓN</summary>
        <div class="op-card__expand-body">${expandDetailHTML(op)}</div>
      </details>
    </div>
    <div class="op-card__actions">
      <a class="btn btn-outline btn-outline--green" href="operacion.html?op=${op.id}">VER DOSSIER</a>
      ${inscribible
        ? `<a class="btn btn-primary" href="inscripcion.html?op=${op.id}">INSCRIBIRME</a>`
        : `<button class="btn btn-primary" disabled>${op.status === "completo" ? "COMPLETO" : "FINALIZADO"}</button>`}
    </div>
  </article>`;
}

function renderOpGrid(container, lista, opts) {
  if (!container) return;
  if (!lista.length) {
    container.innerHTML = `<div class="empty-state">NO HAY OPERACIONES QUE COINCIDAN CON LOS FILTROS SELECCIONADOS.</div>`;
    return;
  }
  container.innerHTML = lista.map((op) => opCardHTML(op, opts)).join("");
  if (window.reScanReveal) window.reScanReveal();
}
