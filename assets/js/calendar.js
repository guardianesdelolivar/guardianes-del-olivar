/**
 * CALENDAR.JS — calendario mensual interactivo.
 * Pensado para funcionar cómodamente también en móvil (celdas táctiles grandes).
 *
 * RENDIMIENTO: la página se pinta de inmediato con los datos que ya hay
 * (sin esperar a la respuesta del contador de plazas en vivo, que puede
 * tardar un poco). En cuanto llega esa respuesta, se vuelve a pintar solo
 * para refrescar el número de plazas, sin bloquear la carga inicial.
 */

(function () {
  "use strict";

  const MESES = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
  const DIAS_SEMANA = ["L", "M", "X", "J", "V", "S", "D"];

  function getParam(name) {
    return new URLSearchParams(location.search).get(name);
  }

  document.addEventListener("DOMContentLoaded", () => {
    const monthLabel = document.querySelector("[data-cal-month]");
    const grid = document.querySelector("[data-cal-grid]");
    const prevBtn = document.querySelector("[data-cal-prev]");
    const nextBtn = document.querySelector("[data-cal-next]");
    const detail = document.querySelector("[data-cal-detail]");
    const tipoSel = document.querySelector("[data-filter-tipo]");
    const ubicSel = document.querySelector("[data-filter-ubicacion]");
    const estadoSel = document.querySelector("[data-filter-estado]");
    const monthSel = document.querySelector("[data-filter-mes]");

    if (!grid) return;

    const hoy = new Date();
    let state = { year: hoy.getFullYear(), month: hoy.getMonth(), selectedId: null };

    const opParam = getParam("op");
    if (opParam) {
      const opInicial = obtenerOperacionPorId(opParam);
      if (opInicial) {
        const dInicial = new Date(opInicial.fecha + "T00:00:00");
        state = { year: dInicial.getFullYear(), month: dInicial.getMonth(), selectedId: opInicial.id };
      }
    }

    function uniq(arr) { return [...new Set(arr)]; }

    // Poblar filtros
    uniq(OPERACIONES.map((op) => op.tipo)).forEach((t) => {
      const opt = document.createElement("option");
      opt.value = t; opt.textContent = t;
      tipoSel.appendChild(opt);
    });
    uniq(OPERACIONES.map((op) => op.localidad)).forEach((l) => {
      const opt = document.createElement("option");
      opt.value = l; opt.textContent = l;
      ubicSel.appendChild(opt);
    });
    const mesesConOps = uniq(
      ordenarOperacionesPorFecha(OPERACIONES).map((op) => {
        const d = new Date(op.fecha + "T00:00:00");
        return `${d.getFullYear()}-${d.getMonth()}`;
      })
    );
    mesesConOps.forEach((key) => {
      const [y, m] = key.split("-").map(Number);
      const opt = document.createElement("option");
      opt.value = key;
      opt.textContent = `${MESES[m]} ${y}`;
      monthSel.appendChild(opt);
    });

    function operacionesFiltradas() {
      const tipo = tipoSel.value, ubic = ubicSel.value, estado = estadoSel.value;
      return OPERACIONES.filter((op) => {
        if (tipo !== "todos" && op.tipo !== tipo) return false;
        if (ubic !== "todas" && op.localidad !== ubic) return false;
        if (estado !== "todos" && op.status !== estado) return false;
        return true;
      });
    }

    function opsDelDia(lista, year, month, day) {
      return lista.filter((op) => {
        const d = new Date(op.fecha + "T00:00:00");
        return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
      });
    }

    function renderDetail(op) {
      if (!op) {
        detail.innerHTML = `<div class="calendar-detail__empty">SELECCIONA UN DÍA CON OPERACIÓN PARA VER LOS DETALLES DE LA MISIÓN.</div>`;
        return;
      }
      const inscribible = op.status === "abiertas" || op.status === "ultimas";
      detail.innerHTML = `
        <span class="badge ${ESTADO_BADGE_CLASS[op.status]}" style="position:static;display:inline-flex;margin-bottom:14px;"><span class="dot"></span>${ESTADO_TEXTO[op.status]}</span>
        <h3 style="margin-bottom:14px;">${op.nombre}</h3>
        <dl style="display:grid;grid-template-columns:auto 1fr;gap:8px 12px;font-size:13.5px;margin-bottom:18px;">
          <dt class="divider-coords">FECHA</dt><dd>${op.fechaDisplay}</dd>
          <dt class="divider-coords">LUGAR</dt><dd>${op.ubicacion}, ${op.localidad}</dd>
          <dt class="divider-coords">HORARIO</dt><dd>${op.horario}</dd>
          <dt class="divider-coords">PLAZAS</dt><dd>${op.plazasOcupadas}/${op.plazasTotal}</dd>
          <dt class="divider-coords">PRECIO</dt><dd>${op.precio} €</dd>
        </dl>
        ${availabilityHTML(op)}
        <div style="display:flex;gap:10px;margin-top:20px;flex-wrap:wrap;">
          <a class="btn btn-outline btn-outline--green" href="operacion.html?op=${op.id}">VER DOSSIER</a>
          ${inscribible ? `<a class="btn btn-primary" href="inscripcion.html?op=${op.id}">INSCRIBIRME</a>` : `<button class="btn btn-primary" disabled>${op.status === "completo" ? "COMPLETO" : "FINALIZADO"}</button>`}
        </div>`;
    }

    function render() {
      const filtradas = operacionesFiltradas();
      monthLabel.textContent = `${MESES[state.month]} ${state.year}`;

      const firstOfMonth = new Date(state.year, state.month, 1);
      const startOffset = (firstOfMonth.getDay() + 6) % 7; // lunes = 0
      const daysInMonth = new Date(state.year, state.month + 1, 0).getDate();

      let html = "";
      for (let i = 0; i < startOffset; i++) {
        html += `<div class="calendar__day is-empty"></div>`;
      }
      for (let day = 1; day <= daysInMonth; day++) {
        const ops = opsDelDia(filtradas, state.year, state.month, day);
        const isToday = hoy.getFullYear() === state.year && hoy.getMonth() === state.month && hoy.getDate() === day;
        const hasOp = ops.length > 0;
        const isSelected = hasOp && ops.some((o) => o.id === state.selectedId);
        const classes = ["calendar__day"];
        if (hasOp) classes.push("has-op");
        if (isToday) classes.push("is-today");
        if (isSelected) classes.push("is-selected");
        const dots = ops.map((o) => `<span class="indicator indicator--${o.status}"></span>`).join("");
        html += `<button type="button" class="${classes.join(" ")}" ${hasOp ? `data-day-op="${ops[0].id}"` : "disabled tabindex=\"-1\""} aria-label="Día ${day}${hasOp ? `, ${ops[0].nombre}` : ""}">
          <span>${day}</span>${dots ? `<span style="display:flex;gap:3px;">${dots}</span>` : ""}
        </button>`;
      }
      grid.innerHTML = html;

      grid.querySelectorAll("[data-day-op]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-day-op");
          state.selectedId = id;
          renderDetail(obtenerOperacionPorId(id));
          render();
          if (window.matchMedia("(max-width: 899px)").matches) {
            detail.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }
        });
      });

      if (state.selectedId) {
        const sel = obtenerOperacionPorId(state.selectedId);
        const stillVisible = sel && filtradas.some((o) => o.id === sel.id) &&
          new Date(sel.fecha + "T00:00:00").getFullYear() === state.year &&
          new Date(sel.fecha + "T00:00:00").getMonth() === state.month;
        renderDetail(stillVisible ? sel : null);
      } else {
        renderDetail(null);
      }
    }

    prevBtn.addEventListener("click", () => {
      state.month -= 1;
      if (state.month < 0) { state.month = 11; state.year -= 1; }
      state.selectedId = null;
      render();
    });
    nextBtn.addEventListener("click", () => {
      state.month += 1;
      if (state.month > 11) { state.month = 0; state.year += 1; }
      state.selectedId = null;
      render();
    });
    [tipoSel, ubicSel, estadoSel].forEach((el) => el.addEventListener("change", () => { state.selectedId = null; render(); }));
    monthSel.addEventListener("change", () => {
      if (!monthSel.value) return;
      const [y, m] = monthSel.value.split("-").map(Number);
      state.year = y; state.month = m; state.selectedId = null;
      render();
    });

    // Pintado inmediato: no se espera a la respuesta del contador de plazas.
    render();
    if (opParam && window.matchMedia("(max-width: 899px)").matches) {
      detail.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    // Cuando llega el número real de plazas (puede tardar un poco), se
    // repinta solo para refrescarlo, sin bloquear la carga inicial.
    (window.PLAZAS_LISTO || Promise.resolve()).then(() => {
      render();
    });
  });
})();
