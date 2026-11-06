/**
 * ORGANIZADOR.JS — lista privada de inscritos por operación.
 *
 * Solo funciona con una cuenta de organización (tabla "organizadores" en
 * Supabase). La seguridad no depende de esta página: aunque alguien la
 * abriera, Supabase solo devuelve los datos a las cuentas organizadoras.
 */
(function () {
  "use strict";

  function escapar(t) {
    return String(t == null ? "" : t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  const EXPERIENCIA = { ninguna: "Sin experiencia", iniciado: "< 1 año", intermedio: "1-3 años", avanzado: "> 3 años" };

  document.addEventListener("DOMContentLoaded", () => {
    const estado = document.querySelector("[data-org-estado]");
    const panel = document.querySelector("[data-org-panel]");
    const selector = document.querySelector("[data-org-op]");
    const resumen = document.querySelector("[data-org-resumen]");
    const filasEl = document.querySelector("[data-org-filas]");
    const aviso = document.querySelector("[data-org-aviso]");
    const cliente = window.supabaseClient;
    let filasActuales = [];

    function avisar(msg) {
      if (!aviso) return;
      aviso.textContent = msg;
      setTimeout(() => { if (aviso.textContent === msg) aviso.textContent = ""; }, 4000);
    }

    if (!cliente || !window.obtenerUsuarioActual) {
      estado.textContent = "No se ha podido conectar con el sistema de cuentas.";
      return;
    }

    window.obtenerUsuarioActual().then((user) => {
      if (!user) {
        estado.innerHTML = `Inicia sesión con una cuenta de organización. <a href="login.html" style="color:var(--c-green-bright);">Entrar</a>`;
        return;
      }
      cliente.rpc("es_organizador").then(({ data }) => {
        if (data !== true) {
          estado.textContent = "Esta cuenta no tiene acceso a la zona del organizador.";
          return;
        }
        estado.remove();
        panel.hidden = false;
        prepararSelector();
      });
    });

    function prepararSelector() {
      const ordenadas = ordenarOperacionesPorFecha(OPERACIONES);
      const proximas = ordenadas.filter((o) => o.status !== "finalizado");
      const pasadas = ordenadas.filter((o) => o.status === "finalizado").reverse();
      selector.innerHTML = [...proximas, ...pasadas]
        .map((o) => `<option value="${o.id}">${escapar(o.nombre)} — ${escapar(o.fechaDisplay)}${o.status === "finalizado" ? " (finalizada)" : ""}</option>`)
        .join("");
      selector.addEventListener("change", cargar);
      cargar();
    }

    function cargar() {
      const op = obtenerOperacionPorId(selector.value);
      filasEl.innerHTML = `<tr><td colspan="13" class="num">Cargando…</td></tr>`;
      cliente
        .from("inscripciones_registro")
        .select("id, user_id, created_at, datos")
        .eq("operacion_id", op.id)
        .order("created_at", { ascending: true })
        .then(({ data: inscripciones, error }) => {
          if (error) { filasEl.innerHTML = `<tr><td colspan="13">No se pudo cargar la lista.</td></tr>`; return; }
          const ids = [...new Set((inscripciones || []).map((i) => i.user_id))];
          const perfiles = ids.length
            ? cliente.from("profiles").select("*").in("id", ids).then(({ data }) => data || [])
            : Promise.resolve([]);
          perfiles.then((lista) => {
            const porId = Object.fromEntries(lista.map((p) => [p.id, p]));
            filasActuales = (inscripciones || []).map((i) => {
              const p = porId[i.user_id] || {};
              const d = i.datos || {};
              return {
                id: i.id,
                callsign: d.callsign || p.callsign || p.username || "—",
                nombre: [d.nombre || p.nombre, d.apellidos || p.apellidos].filter(Boolean).join(" ") || "—",
                telefono: d.telefono || p.telefono || "",
                email: d.email || "",
                dni: p.dni || "",
                experiencia: EXPERIENCIA[d.experiencia || p.experiencia] || "—",
                duerme: d.duerme === true ? "Sí" : d.duerme === false ? "No" : "—",
                almuerzo: d.almuerzo || "—",
                fotos: d.fotos === true ? "Sí" : d.fotos === false ? "No" : "—",
                observaciones: d.observaciones || "",
                inscrito: new Date(i.created_at).toLocaleString("es-ES", { timeZone: "Europe/Madrid", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }),
              };
            });
            pintar(op);
          });
        });
    }

    function pintar(op) {
      const total = filasActuales.length;
      const duermen = filasActuales.filter((f) => f.duerme === "Sí").length;
      const sinFotos = filasActuales.filter((f) => f.fotos === "No").length;
      resumen.innerHTML = `
        <div class="org-dato"><small>Inscritos</small><b>${total}${op.plazasTotal ? ` / ${op.plazasTotal}` : ""}</b></div>
        ${op.plazasTotal ? `<div class="org-dato"><small>Plazas libres</small><b>${Math.max(0, op.plazasTotal - total)}</b></div>` : ""}
        ${op.pernocta ? `<div class="org-dato"><small>Duermen en el campo</small><b>${duermen}</b></div>` : ""}
        <div class="org-dato"><small>Sin permiso de fotos</small><b>${sinFotos}</b></div>`;

      if (!total) {
        filasEl.innerHTML = `<tr><td colspan="13" class="num">Todavía no hay nadie inscrito en esta operación.</td></tr>`;
        return;
      }
      filasEl.innerHTML = filasActuales.map((f, n) => `
        <tr>
          <td class="num">${n + 1}</td>
          <td><strong>${escapar(f.callsign)}</strong></td>
          <td>${escapar(f.nombre)}</td>
          <td>${f.telefono ? `<a href="https://wa.me/34${escapar(f.telefono.replace(/\D/g, "").replace(/^34(?=\d{9}$)/, ""))}" target="_blank" rel="noopener">${escapar(f.telefono)}</a>` : "—"}</td>
          <td>${escapar(f.email) || "—"}</td>
          <td>${escapar(f.dni) || "—"}</td>
          <td>${escapar(f.experiencia)}</td>
          <td><span class="pill ${f.duerme === "Sí" ? "pill--si" : "pill--no"}">${f.duerme}</span></td>
          <td><small>${escapar(f.almuerzo)}</small></td>
          <td><span class="pill ${f.fotos === "Sí" ? "pill--si" : "pill--no"}">${f.fotos}</span></td>
          <td><small>${escapar(f.observaciones)}</small></td>
          <td><small>${escapar(f.inscrito)}</small></td>
          <td><button type="button" class="btn btn-outline btn-baja" data-quitar="${f.id}" style="padding:6px 10px;font-size:10px;">QUITAR</button></td>
        </tr>`).join("");
    }

    // Quitar a un inscrito (por ejemplo, una prueba o alguien que avisa por WhatsApp).
    filasEl.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-quitar]");
      if (!btn) return;
      if (!btn.classList.contains("is-confirmando")) {
        btn.classList.add("is-confirmando");
        btn.textContent = "¿SEGURO?";
        setTimeout(() => { if (btn.isConnected) { btn.classList.remove("is-confirmando"); btn.textContent = "QUITAR"; } }, 4000);
        return;
      }
      btn.disabled = true;
      cliente.from("inscripciones_registro").delete().eq("id", btn.getAttribute("data-quitar")).select("id")
        .then(({ data, error }) => {
          if (error || !data || !data.length) { btn.disabled = false; btn.textContent = "ERROR"; return; }
          avisar("Inscripción eliminada.");
          cargar();
        });
    });

    document.querySelector("[data-org-copiar]").addEventListener("click", () => {
      const telefonos = filasActuales.map((f) => f.telefono).filter(Boolean).join(", ");
      if (!telefonos) { avisar("No hay teléfonos que copiar."); return; }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(telefonos).then(() => avisar("Teléfonos copiados.")).catch(() => avisar(telefonos));
      } else {
        avisar(telefonos);
      }
    });

    document.querySelector("[data-org-csv]").addEventListener("click", () => {
      const op = obtenerOperacionPorId(selector.value);
      const cabecera = ["Callsign", "Nombre", "Teléfono", "Email", "DNI", "Experiencia", "Duerme", "Almuerzo", "Fotos", "Observaciones", "Inscrito"];
      const celda = (v) => `"${String(v == null ? "" : v).replace(/"/g, '""')}"`;
      const lineas = [cabecera, ...filasActuales.map((f) => [f.callsign, f.nombre, f.telefono, f.email, f.dni, f.experiencia, f.duerme, f.almuerzo, f.fotos, f.observaciones, f.inscrito])]
        .map((fila) => fila.map(celda).join(";"));
      // BOM para que Excel abra bien las tildes.
      const blob = new Blob(["﻿" + lineas.join("\r\n")], { type: "text/csv;charset=utf-8" });
      const enlace = document.createElement("a");
      enlace.href = URL.createObjectURL(blob);
      enlace.download = `inscritos-${op.id}.csv`;
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
    });

    document.querySelector("[data-org-imprimir]").addEventListener("click", () => window.print());
  });
})();
