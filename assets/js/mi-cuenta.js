/**
 * MI-CUENTA.JS — partes extra de "Mi cuenta": lista de espera,
 * avisos de nuevas partidas y réplicas medidas en el cronógrafo.
 */
(function () {
  "use strict";
  const LIMITES = { pistola: 320, asalto: 350, apoyo: 400, dmr: 450, sniper: 550 };
  const julios = (fps, g) => 0.5 * (g / 1000) * Math.pow(fps * 0.3048, 2);
  const escapar = (t) => String(t == null ? "" : t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  cuandoOperaciones(() => {
    const cliente = window.supabaseClient;
    if (!cliente || !window.obtenerUsuarioActual) return;
    window.obtenerUsuarioActual().then((user) => {
      if (!user) return;
      cargarEspera(cliente, user);
      prepararAvisos(cliente, user);
      cargarReplicas(cliente, user);
    });
  });

  // ---- Lista de espera ----
  function cargarEspera(cliente, user) {
    const bloque = document.querySelector("[data-mi-espera-bloque]");
    const cont = document.querySelector("[data-mi-espera]");
    if (!bloque || !cont) return;
    cliente.from("lista_espera").select("id, operacion_id, datos").eq("user_id", user.id).then(({ data }) => {
      if (!data || !data.length) { bloque.hidden = true; return; }
      bloque.hidden = false;
      Promise.all(data.map((e) => cliente.rpc("mi_posicion_espera", { op: e.operacion_id }).then(({ data: pos }) => ({ e, pos }))))
        .then((filas) => {
          cont.innerHTML = filas.map(({ e, pos }) => {
            const op = obtenerOperacionPorId(e.operacion_id);
            const nombre = op ? op.nombre : (e.datos && e.datos.operacion) || e.operacion_id;
            return `<div class="mi-partida">
              <div><strong>${escapar(nombre)}</strong><span>${pos ? `Puesto ${pos} en la lista · entras solo si se libera plaza` : "En lista de espera"}</span></div>
              <div class="mi-partida__acciones"><button type="button" class="btn btn-outline btn-baja" data-salir-espera="${e.id}">SALIR DE LA LISTA</button></div>
            </div>`;
          }).join("");
        });
    });
    cont.addEventListener("click", (ev) => {
      const b = ev.target.closest("[data-salir-espera]");
      if (!b) return;
      if (!b.classList.contains("is-confirmando")) { b.classList.add("is-confirmando"); b.textContent = "¿SEGURO? PULSA OTRA VEZ"; return; }
      b.disabled = true;
      cliente.from("lista_espera").delete().eq("id", b.getAttribute("data-salir-espera")).then(() => cargarEspera(cliente, user));
    }, { once: false });
  }

  // ---- Avisos ----
  function prepararAvisos(cliente, user) {
    const toggle = document.querySelector("[data-avisos-toggle]");
    const texto = document.querySelector("[data-avisos-texto]");
    if (!toggle) return;
    const pintar = (activo) => {
      toggle.checked = activo;
      texto.textContent = activo ? "Avisos activados: te escribiremos cuando haya partida nueva." : "Avisos desactivados.";
    };
    cliente.from("suscriptores").select("user_id").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      pintar(!!data);
      toggle.disabled = false;
    });
    toggle.addEventListener("change", () => {
      toggle.disabled = true;
      const accion = toggle.checked
        ? cliente.from("suscriptores").insert({ user_id: user.id })
        : cliente.from("suscriptores").delete().eq("user_id", user.id);
      accion.then(({ error }) => {
        toggle.disabled = false;
        if (error && error.code !== "23505") { pintar(!toggle.checked); texto.textContent = "No se pudo cambiar. Inténtalo de nuevo."; return; }
        pintar(toggle.checked);
      });
    });
  }

  // ---- Réplicas ----
  function cargarReplicas(cliente, user) {
    const cont = document.querySelector("[data-mis-replicas]");
    if (!cont) return;
    cliente.from("replicas").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).then(({ data, error }) => {
      if (error) { cont.innerHTML = `<p class="form-note">No se han podido cargar tus réplicas.</p>`; return; }
      if (!data || !data.length) { cont.innerHTML = `<p class="form-note">Todavía no hay mediciones. Se anotan en el cronógrafo el día de la partida.</p>`; return; }
      cont.innerHTML = data.map((r) => {
        const j = julios(Number(r.fps), Number(r.peso_bb));
        const ok = j <= julios(LIMITES[r.tipo], 0.2) + 1e-9;
        return `<div class="mi-partida">
          <div><strong>${escapar(r.nombre)}</strong><span>${r.tipo.toUpperCase()} · ${Number(r.fps).toFixed(0)} FPS con BB de ${Number(r.peso_bb).toFixed(2)} g · ${j.toFixed(2)} J · ${new Date(r.created_at).toLocaleDateString("es-ES", { timeZone: "Europe/Madrid" })}</span></div>
          <div class="mi-partida__acciones"><span class="pill ${ok ? "pill--si" : "pill--mal"}">${ok ? "DENTRO DE NORMAS" : "SUPERA EL LÍMITE"}</span></div>
        </div>`;
      }).join("");
    });
  }
})();
