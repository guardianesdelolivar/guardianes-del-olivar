/**
 * CARDS.JS — utilidades compartidas para pintar tarjetas de operación
 * y textos de estado. Usado por index, operaciones, calendario y dossier.
 */

/* ---------------------------------------------------------------
 * ICONOS — trazo fino, un solo color (el verde de la web).
 * Sustituyen a los emoticonos para un aspecto más sobrio y militar.
 * Uso en operaciones.js: { icono: "bandera", texto: "..." }
 * Disponibles: calendario, reloj, diana, grupo, tienda, bomba,
 * bandera, ubicacion, check, mapa, linterna, escudo.
 * --------------------------------------------------------------- */
const ICONOS = {
  calendario: '<rect x="3.5" y="5" width="17" height="15" rx="1"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/>',
  reloj: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/>',
  diana: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4"/><path d="M12 1.5v4M12 18.5v4M1.5 12h4M18.5 12h4"/>',
  grupo: '<circle cx="9" cy="8.5" r="3"/><path d="M3.5 19c.6-3 2.8-4.8 5.5-4.8s4.9 1.8 5.5 4.8"/><circle cx="16.5" cy="9.5" r="2.5"/><path d="M15.5 14.4c2.3.1 4.2 1.7 4.8 4.6"/>',
  tienda: '<path d="M2.5 20h19M4.5 20 12 5l7.5 15M12 5v15M9.5 20l2.5-5 2.5 5"/>',
  bomba: '<circle cx="10.5" cy="14" r="6.5"/><path d="M15 9.5l2.5-2.5M17.5 7l1.5-1.5M19.5 3.5v1.2M21.5 5.5h-1.2"/>',
  bandera: '<path d="M5 21V3.5M5 4h11.5l-2.5 4 2.5 4H5"/>',
  ubicacion: '<path d="M12 21s-6.5-6.2-6.5-11.2a6.5 6.5 0 0 1 13 0C18.5 14.8 12 21 12 21z"/><circle cx="12" cy="9.8" r="2.3"/>',
  check: '<path d="M4.5 12.5l4.5 4.5 10.5-11"/>',
  mapa: '<path d="M3.5 6.5 9 4l6 2.5 5.5-2.5v13.5L15 20l-6-2.5-5.5 2.5z"/><path d="M9 4v13.5M15 6.5V20"/>',
  linterna: '<path d="M9 3h6l-1 6h-4zM10 9h4v12h-4z"/>',
  escudo: '<path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.2-7.5 9.5-4.3-1.3-7.5-4.9-7.5-9.5V6z"/>',
};

function icono(nombre) {
  const trazo = ICONOS[nombre];
  if (!trazo) return nombre ? `<span class="ico-txt">${nombre}</span>` : "";
  return `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${trazo}</svg>`;
}
window.icono = icono;

const ESTADO_TEXTO = {
  abiertas: "INSCRIPCIONES ABIERTAS",
  ultimas: "ÚLTIMAS PLAZAS",
  completo: "COMPLETO",
  finalizado: "FINALIZADO",
};

const ESTADO_BADGE_CLASS = {
  abiertas: "badge--abiertas",
  ultimas: "badge--ultimas",
  completo: "badge--completo",
  finalizado: "badge--finalizado",
};

function tieneLimitePlazas(op) {
  return typeof op.plazasTotal === "number" && op.plazasTotal > 0;
}

// Partida llena pero con lista de espera abierta.
function admiteListaEspera(op) {
  return op.status === "completo" && tieneLimitePlazas(op);
}

function porcentajeOcupacion(op) {
  if (!tieneLimitePlazas(op)) return 0;
  return Math.round((op.plazasOcupadas / op.plazasTotal) * 100);
}

function claseDisponibilidad(op) {
  const pct = porcentajeOcupacion(op);
  if (op.status === "completo" || op.status === "finalizado" || pct >= 100) return "is-full";
  if (pct >= 80) return "is-high";
  return "";
}

function availabilityHTML(op) {
  if (!tieneLimitePlazas(op)) {
    if (!op.recuentoDisponible) return "";
    return `
    <div class="availability">
      <div class="availability__label">
        <span>${op.plazasOcupadas} ${op.plazasOcupadas === 1 ? "OPERADOR APUNTADO" : "OPERADORES APUNTADOS"}</span>
        <span>SIN LÍMITE</span>
      </div>
    </div>`;
  }
  const pct = Math.min(100, porcentajeOcupacion(op));
  return `
    <div class="availability">
      <div class="availability__label">
        <span>${op.plazasOcupadas}/${op.plazasTotal} OPERADORES</span>
        <span>${admiteListaEspera(op) && op.enEspera ? `${op.enEspera} EN ESPERA` : `${pct}%`}</span>
      </div>
      <div class="availability__bar">
        <div class="availability__fill ${claseDisponibilidad(op)}" style="width:${pct}%"></div>
      </div>
    </div>`;
}

function objectivesHTML(op, limit) {
  const list = limit ? op.objetivos.slice(0, limit) : op.objetivos;
  return list.map((o) => `<li>${icono(o.icono)}<span>${o.texto}</span></li>`).join("");
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
  <article class="op-card reveal"><span class="frame-corners" aria-hidden="true"></span>
    <div class="op-card__media">
      ${op.imagenCartel ? `<img class="op-card__media-img" src="${op.imagenCartel}" alt="Cartel de ${op.nombre}" width="800" height="993" loading="lazy" decoding="async" />` : ""}
      <span class="badge ${ESTADO_BADGE_CLASS[op.status]}"><span class="dot"></span>${ESTADO_TEXTO[op.status]}</span>
      <span class="op-card__code">${op.codigo}</span>
      ${op.status === "finalizado" ? `<span class="stamp">Misión cumplida</span>` : op.status === "completo" ? `<span class="stamp stamp--red">Completo</span>` : ""}
    </div>
    <div class="op-card__body">
      <h3 class="op-card__title">${op.nombre}</h3>
      <ul class="op-card__meta">
        <li>${icono("calendario")}<span>${op.fechaDisplay}</span></li>
        <li>${icono("reloj")}<span>${op.horario}</span></li>
        <li>${icono("ubicacion")}<span>${op.ubicacion}, ${op.localidad}</span></li>
        <li>${icono("grupo")}<span>${tieneLimitePlazas(op) ? `${op.plazasTotal - op.plazasOcupadas} plazas libres` : (op.recuentoDisponible ? `${op.plazasOcupadas} apuntados · sin límite` : "Plazas sin límite")}</span></li>
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
        : admiteListaEspera(op)
          ? `<a class="btn btn-outline" href="inscripcion.html?op=${op.id}">LISTA DE ESPERA</a>`
          : `<button class="btn btn-primary" disabled>${op.status === "completo" ? "COMPLETO" : "FINALIZADO"}</button>`}
    </div>
  </article>`;
}

function renderOpGrid(container, lista, opts) {
  if (!container) return;
  if (!lista.length) {
    const vacio = (opts && opts.vacio) || "NO HAY OPERACIONES QUE COINCIDAN CON LOS FILTROS SELECCIONADOS.";
    container.innerHTML = `<div class="empty-state">${vacio}</div>`;
    return;
  }
  container.innerHTML = lista.map((op) => opCardHTML(op, opts)).join("");
  if (window.reScanReveal) window.reScanReveal();
}
