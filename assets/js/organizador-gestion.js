/**
 * ORGANIZADOR-GESTION.JS — crear y editar partidas, y anotar réplicas
 * del cronógrafo. Solo se activa cuando organizador.js confirma que la
 * cuenta es organizadora (evento "org:acceso"). Aun así, la seguridad
 * real la pone Supabase: solo las cuentas organizadoras pueden escribir.
 */
(function () {
  "use strict";

  const MESES = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
  const CAMPO_MAPS = "https://maps.app.goo.gl/tWSZByowQHgVgcqg8";
  const LIMITES = { pistola: 320, asalto: 350, apoyo: 400, dmr: 450, sniper: 550 };

  const escapar = (t) => String(t == null ? "" : t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const lineas = (t) => String(t || "").split("\n").map((l) => l.trim()).filter(Boolean);
  const julios = (fps, g) => 0.5 * (g / 1000) * Math.pow(fps * 0.3048, 2);

  function slug(texto) {
    return String(texto).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/ª|º/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
  }
  function iconoPara(texto) {
    const t = texto.toLowerCase();
    if (t.includes("bandera")) return "bandera";
    if (t.includes("bomba")) return "bomba";
    if (t.includes("noche") || t.includes("dormir") || t.includes("carpa")) return "tienda";
    if (t.includes("hora")) return "reloj";
    return "diana";
  }

  document.addEventListener("org:acceso", () => {
    const cliente = window.supabaseClient;
    if (!cliente) return;
    iniciarPartidas(cliente);
    iniciarCronografo(cliente);
  });

  // =================== PARTIDAS ===================
  function iniciarPartidas(cliente) {
    const lista = document.querySelector("[data-partidas-lista]");
    const form = document.querySelector("[data-partida-form]");
    const aviso = document.querySelector("[data-partida-aviso]");
    const errorEl = document.querySelector("[data-partida-error]");
    const titulo = document.querySelector("[data-partida-titulo]");
    const botonBorrar = document.querySelector("[data-partida-borrar]");
    const vistaCartel = document.querySelector("[data-cartel-vista]");
    let partidas = [];
    let editando = null;

    const avisar = (m) => { aviso.textContent = m; setTimeout(() => { if (aviso.textContent === m) aviso.textContent = ""; }, 5000); };

    function cargarLista() {
      cliente.from("operaciones").select("id, fecha, publicada, datos").order("fecha", { ascending: false }).then(({ data, error }) => {
        if (error) { lista.innerHTML = `<p class="form-note">No se pudieron cargar las partidas.</p>`; return; }
        partidas = data || [];
        if (!partidas.length) { lista.innerHTML = `<p class="form-note">Todavía no hay partidas.</p>`; return; }
        lista.innerHTML = partidas.map((p) => `
          <div class="mi-partida">
            <div>
              <strong>${escapar(p.datos.nombre)}</strong>
              <span>${escapar(p.datos.fechaDisplay || p.fecha)} · ${p.publicada ? "Publicada" : "Borrador (no visible)"}${p.datos.cronica ? " · con crónica" : ""}</span>
            </div>
            <div class="mi-partida__acciones">
              <a class="btn btn-outline" href="operacion.html?op=${encodeURIComponent(p.id)}">VER</a>
              <button type="button" class="btn btn-outline" data-editar="${escapar(p.id)}">EDITAR</button>
            </div>
          </div>`).join("");
      });
    }

    function abrir(partida) {
      editando = partida || null;
      form.reset();
      form.hidden = false;
      errorEl.textContent = "";
      vistaCartel.style.display = "none";
      botonBorrar.hidden = !partida;
      botonBorrar.classList.remove("is-confirmando");
      botonBorrar.textContent = "BORRAR PARTIDA";
      titulo.textContent = partida ? `Editar: ${partida.datos.nombre}` : "Nueva partida";
      if (partida) {
        const d = partida.datos;
        const f = form.elements;
        f.id.value = partida.id;
        f.nombre.value = d.nombre || "";
        f.tipo.value = d.tipo || "";
        f.fecha.value = d.fecha || "";
        f.horaInicio.value = d.horaInicio || "08:00";
        f.duracionHoras.value = d.duracionHoras || "";
        f.precio.value = d.precio != null ? d.precio : "";
        f.plazasTotal.value = d.plazasTotal || "";
        f.status.value = d.status || "abiertas";
        f.horario.value = d.horario || "";
        f.puntoEncuentro.value = d.puntoEncuentro || "";
        f.mapaPuntoEncuentro.value = d.mapaPuntoEncuentro || "";
        f.dificultad.value = d.dificultad || "";
        f.facciones.value = (d.facciones || []).join(", ");
        f.resumen.value = d.resumen || "";
        f.historia.value = d.historia || "";
        f.briefing.value = d.briefing || "";
        f.objetivos.value = (d.objetivos || []).map((o) => o.texto).join("\n");
        f.misiones.value = (d.misiones || []).map((m) => `${m.titulo}: ${m.detalle}`).join("\n");
        f.queLlevar.value = (d.queLlevar || []).join("\n");
        f.reglasEspeciales.value = (d.reglasEspeciales || []).join("\n");
        f.almuerzo.checked = d.almuerzo !== false;
        f.pernocta.checked = !!d.pernocta;
        f.publicada.checked = partida.publicada;
        f.cronica.value = d.cronica || "";
        f.resultados.value = (d.resultados || []).map((r) => `${r.mision}: ${r.ganador}`).join("\n");
        if (d.imagenCartel) { vistaCartel.src = d.imagenCartel; vistaCartel.style.display = "block"; }
      }
      form.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    // Reduce el cartel a 1000 px de alto como máximo y lo pasa a WebP.
    function prepararCartel(archivo) {
      return new Promise((ok, ko) => {
        const img = new Image();
        img.onload = () => {
          const escala = Math.min(1, 1000 / Math.max(img.naturalWidth, img.naturalHeight));
          const c = document.createElement("canvas");
          c.width = Math.round(img.naturalWidth * escala);
          c.height = Math.round(img.naturalHeight * escala);
          c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
          c.toBlob((b) => (b ? ok(b) : ko(new Error("No se pudo procesar la imagen"))), "image/webp", 0.82);
          URL.revokeObjectURL(img.src);
        };
        img.onerror = () => ko(new Error("La imagen no se puede leer"));
        img.src = URL.createObjectURL(archivo);
      });
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      errorEl.textContent = "";
      const f = form.elements;
      if (!f.nombre.value.trim() || !f.fecha.value || !f.resumen.value.trim() || f.precio.value === "") {
        errorEl.textContent = "Rellena al menos nombre, fecha, precio y resumen.";
        return;
      }
      const boton = form.querySelector('button[type="submit"]');
      boton.disabled = true;
      boton.textContent = "GUARDANDO…";
      try {
        const previo = editando ? editando.datos : {};
        const fecha = f.fecha.value;
        const [y, m, d] = fecha.split("-").map(Number);
        const id = editando ? editando.id : `${slug(f.nombre.value)}-${fecha.slice(0, 7)}`;
        const precio = Number(f.precio.value);
        const plazas = f.plazasTotal.value ? Number(f.plazasTotal.value) : null;

        let imagenCartel = previo.imagenCartel || null;
        const archivo = f.cartel.files && f.cartel.files[0];
        if (archivo) {
          const blob = await prepararCartel(archivo);
          const ruta = `${id}-${Date.now()}.webp`;
          const { error: errSubida } = await cliente.storage.from("carteles").upload(ruta, blob, { contentType: "image/webp", cacheControl: "31536000" });
          if (errSubida) throw new Error("No se pudo subir el cartel: " + errSubida.message);
          imagenCartel = cliente.storage.from("carteles").getPublicUrl(ruta).data.publicUrl;
        }

        const iniciales = f.nombre.value.replace(/[^A-Za-zÁÉÍÓÚÑ0-9 ]/g, " ").split(/\s+/).filter((p) => p.length > 2).map((p) => p[0]).join("").slice(0, 4).toUpperCase() || "OP";
        const datos = Object.assign({}, previo, {
          id,
          codigo: previo.codigo || `OP-${String(y).slice(2)}${String(m).padStart(2, "0")}-${iniciales}`,
          nombre: f.nombre.value.trim().toUpperCase(),
          tipo: f.tipo.value.trim() || "Partida",
          clasificacion: previo.clasificacion || "PUBLIC",
          fecha,
          fechaDisplay: `${d} ${MESES[m - 1]} ${y}`,
          horaInicio: f.horaInicio.value || "08:00",
          horaFin: null,
          duracionHoras: f.duracionHoras.value ? Number(f.duracionHoras.value) : null,
          horario: f.horario.value.trim() || `Empezamos a las ${f.horaInicio.value || "08:00"} h`,
          ubicacion: previo.ubicacion || "Campo de Airsoft de Estercuel",
          localidad: previo.localidad || "Estercuel (Teruel)",
          mapaUbicacion: previo.mapaUbicacion || CAMPO_MAPS,
          puntoEncuentro: f.puntoEncuentro.value.trim() || "En el propio campo",
          mapaPuntoEncuentro: f.mapaPuntoEncuentro.value.trim() || CAMPO_MAPS,
          pago: `El pago (${precio} €) se hace en efectivo, en el campo, una vez rellenes la documentación el mismo día.`,
          precio,
          plazasTotal: plazas,
          maxParticipantes: plazas,
          plazasOcupadas: 0,
          almuerzo: f.almuerzo.checked,
          pernocta: f.pernocta.checked,
          status: f.status.value,
          dificultad: f.dificultad.value.trim() || "Todos los niveles",
          facciones: f.facciones.value.split(",").map((s) => s.trim()).filter(Boolean),
          objetivos: lineas(f.objetivos.value).map((texto) => ({ icono: iconoPara(texto), texto })),
          resumen: f.resumen.value.trim(),
          historia: f.historia.value.trim() || f.resumen.value.trim(),
          briefing: f.briefing.value.trim() || f.resumen.value.trim(),
          misiones: lineas(f.misiones.value).map((l, i) => {
            const [tit, ...resto] = l.split(":");
            return { numero: String(i + 1).padStart(2, "0"), titulo: tit.trim(), detalle: resto.join(":").trim() };
          }),
          queLlevar: lineas(f.queLlevar.value),
          reglasEspeciales: lineas(f.reglasEspeciales.value),
          imagenCartel,
          imagenCartelCompartir: imagenCartel,
          cronica: f.cronica.value.trim() || null,
          resultados: lineas(f.resultados.value).map((l) => {
            const [mision, ...resto] = l.split(":");
            return { mision: mision.trim(), ganador: resto.join(":").trim() };
          }),
        });

        const fila = { id, publicada: f.publicada.checked, datos };
        const { error } = editando
          ? await cliente.from("operaciones").update(fila).eq("id", id)
          : await cliente.from("operaciones").insert(fila);
        if (error) throw new Error(error.code === "23505" ? "Ya existe una partida con ese nombre en ese mes." : error.message);
        form.hidden = true;
        avisar(editando ? "Partida actualizada." : "Partida creada.");
        cargarLista();
      } catch (err) {
        errorEl.textContent = err.message || "No se pudo guardar la partida.";
      } finally {
        boton.disabled = false;
        boton.textContent = "GUARDAR PARTIDA";
      }
    });

    lista.addEventListener("click", (e) => {
      const b = e.target.closest("[data-editar]");
      if (b) abrir(partidas.find((p) => p.id === b.getAttribute("data-editar")));
    });
    document.querySelector("[data-partida-nueva]").addEventListener("click", () => abrir(null));
    document.querySelector("[data-partida-cancelar]").addEventListener("click", () => { form.hidden = true; });
    form.elements.cartel.addEventListener("change", () => {
      const a = form.elements.cartel.files[0];
      if (a) { vistaCartel.src = URL.createObjectURL(a); vistaCartel.style.display = "block"; }
    });
    botonBorrar.addEventListener("click", () => {
      if (!editando) return;
      if (!botonBorrar.classList.contains("is-confirmando")) {
        botonBorrar.classList.add("is-confirmando");
        botonBorrar.textContent = "¿SEGURO? SE BORRAN SUS INSCRIPCIONES";
        return;
      }
      cliente.from("operaciones").delete().eq("id", editando.id).then(({ error }) => {
        if (error) { errorEl.textContent = "No se pudo borrar."; return; }
        form.hidden = true;
        avisar("Partida borrada.");
        cargarLista();
      });
    });

    cargarLista();
  }

  // =================== CRONÓGRAFO ===================
  function iniciarCronografo(cliente) {
    const form = document.querySelector("[data-replica-form]");
    const selJugador = form.elements.user_id;
    const filas = document.querySelector("[data-replicas-filas]");
    const calculo = document.querySelector("[data-replica-calculo]");
    const errorEl = document.querySelector("[data-replica-error]");
    let perfiles = {};

    function nombreDe(p) {
      if (!p) return "—";
      const nombre = [p.nombre, p.apellidos].filter(Boolean).join(" ");
      const alias = p.callsign || p.username;
      return alias && nombre ? `${alias} (${nombre})` : alias || nombre || "Sin nombre";
    }

    cliente.from("profiles").select("id, username, callsign, nombre, apellidos").then(({ data }) => {
      (data || []).forEach((p) => { perfiles[p.id] = p; });
      const ordenados = Object.values(perfiles).sort((a, b) => nombreDe(a).localeCompare(nombreDe(b), "es"));
      selJugador.innerHTML = `<option value="">Elige jugador…</option>` + ordenados.map((p) => `<option value="${p.id}">${escapar(nombreDe(p))}</option>`).join("");
      cargar();
    });

    function estado(r) {
      const limite = LIMITES[r.tipo];
      const j = julios(Number(r.fps), Number(r.peso_bb));
      const jLimite = julios(limite, 0.2);
      return { j, ok: j <= jLimite + 1e-9, jLimite };
    }

    function actualizarCalculo() {
      const fps = Number(form.elements.fps.value), g = Number(form.elements.peso_bb.value || 0.2);
      if (!fps) { calculo.textContent = ""; return; }
      const { j, ok, jLimite } = estado({ tipo: form.elements.tipo.value, fps, peso_bb: g });
      calculo.innerHTML = `${j.toFixed(2)} J con BB de ${g.toFixed(2)} g · límite ${jLimite.toFixed(2)} J → <strong style="color:${ok ? "var(--c-green-bright)" : "var(--c-red-bright)"};">${ok ? "DENTRO DE NORMAS" : "SUPERA EL LÍMITE"}</strong>`;
    }
    ["fps", "peso_bb", "tipo"].forEach((n) => form.elements[n].addEventListener("input", actualizarCalculo));

    function cargar() {
      cliente.from("replicas").select("*").order("created_at", { ascending: false }).then(({ data, error }) => {
        if (error) { filas.innerHTML = `<tr><td colspan="9">No se pudo cargar.</td></tr>`; return; }
        if (!data || !data.length) { filas.innerHTML = `<tr><td colspan="9" class="num">Todavía no hay réplicas anotadas.</td></tr>`; return; }
        filas.innerHTML = data.map((r) => {
          const { j, ok } = estado(r);
          return `<tr>
            <td>${escapar(nombreDe(perfiles[r.user_id]))}</td>
            <td><strong>${escapar(r.nombre)}</strong>${r.notas ? `<br><small>${escapar(r.notas)}</small>` : ""}</td>
            <td>${escapar(r.tipo.toUpperCase())}</td>
            <td class="num">${Number(r.fps).toFixed(0)}</td>
            <td class="num">${Number(r.peso_bb).toFixed(2)} g</td>
            <td class="num">${j.toFixed(2)} J</td>
            <td><span class="pill ${ok ? "pill--si" : "pill--mal"}">${ok ? "OK" : "SUPERA"}</span></td>
            <td><small>${new Date(r.created_at).toLocaleDateString("es-ES", { timeZone: "Europe/Madrid" })}</small></td>
            <td><button type="button" class="btn btn-outline btn-baja" data-borrar-replica="${r.id}" style="padding:6px 10px;font-size:10px;">BORRAR</button></td>
          </tr>`;
        }).join("");
      });
    }

    filas.addEventListener("click", (e) => {
      const b = e.target.closest("[data-borrar-replica]");
      if (!b) return;
      if (!b.classList.contains("is-confirmando")) { b.classList.add("is-confirmando"); b.textContent = "¿SEGURO?"; return; }
      cliente.from("replicas").delete().eq("id", b.getAttribute("data-borrar-replica")).then(cargar);
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      errorEl.textContent = "";
      const f = form.elements;
      if (!f.user_id.value || !f.nombre.value.trim() || !Number(f.fps.value)) { errorEl.textContent = "Elige jugador y escribe réplica y FPS."; return; }
      window.obtenerUsuarioActual().then((yo) => cliente.from("replicas").insert({
        user_id: f.user_id.value,
        nombre: f.nombre.value.trim(),
        tipo: f.tipo.value,
        fps: Number(f.fps.value),
        peso_bb: Number(f.peso_bb.value || 0.2),
        notas: f.notas.value.trim() || null,
        medido_por: yo ? yo.id : null,
      })).then(({ error }) => {
        if (error) { errorEl.textContent = "No se pudo guardar: " + error.message; return; }
        const jugador = f.user_id.value, tipo = f.tipo.value;
        form.reset();
        f.user_id.value = jugador; f.tipo.value = tipo; f.peso_bb.value = "0.20";
        calculo.textContent = "";
        cargar();
      });
    });
  }
})();
