/**
 * LOGIN-PAGE.JS — lógica de la página login.html: pestañas de
 * iniciar sesión / registro, y formulario de perfil una vez conectado.
 */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    const guestBlock = document.querySelector("[data-auth-guest]");
    const userBlock = document.querySelector("[data-auth-user]");
    const userEmailEl = document.querySelector("[data-user-email]");

    // Si se llega desde una inscripción (login.html?volver=inscripcion.html?op=...),
    // al iniciar sesión se vuelve allí. Se guarda también en el navegador
    // por si la persona confirma el email y vuelve a entrar más tarde.
    // Solo se permite volver a páginas de esta misma web.
    function destinoSeguro(valor) {
      return typeof valor === "string" && /^inscripcion\.html\?op=[a-z0-9-]+$/i.test(valor) ? valor : null;
    }
    const params = new URLSearchParams(location.search);
    let volver = destinoSeguro(params.get("volver"));
    try {
      if (volver) localStorage.setItem("gdo_volver", volver);
      else volver = destinoSeguro(localStorage.getItem("gdo_volver"));
    } catch (err) { /* almacenamiento no disponible: se ignora */ }
    function irADestino() {
      if (!volver) return false;
      try { localStorage.removeItem("gdo_volver"); } catch (err) { /* se ignora */ }
      location.href = volver;
      return true;
    }
    // Página desde la que se llegó a "Mi cuenta" (de esta misma web), para
    // volver allí después de guardar el perfil.
    let paginaAnterior = null;
    try {
      const ref = document.referrer ? new URL(document.referrer) : null;
      if (ref && ref.origin === location.origin && !/login\.html$/.test(ref.pathname)) {
        paginaAnterior = ref.pathname.split("/").pop() + ref.search;
        sessionStorage.setItem("gdo_desde", paginaAnterior);
      } else {
        paginaAnterior = sessionStorage.getItem("gdo_desde");
      }
    } catch (err) { /* se ignora */ }
    function volverTrasGuardar() {
      if (irADestino()) return;
      const destino = paginaAnterior && /^[a-z0-9-]*\.html(\?[a-z0-9=&-]*)?$/i.test(paginaAnterior) ? paginaAnterior : "index.html";
      try { sessionStorage.removeItem("gdo_desde"); } catch (err) { /* se ignora */ }
      location.href = destino;
    }

    if (volver) {
      const aviso = document.querySelector("[data-volver-aviso]");
      if (aviso) aviso.hidden = false;
    }

    const tabLogin = document.querySelector('[data-tab-btn="login"]');
    const tabRegistro = document.querySelector('[data-tab-btn="registro"]');
    const loginForm = document.querySelector("[data-login-form]");
    const registroForm = document.querySelector("[data-registro-form]");
    const loginMsg = document.querySelector("[data-login-msg]");
    const registroMsg = document.querySelector("[data-registro-msg]");

    const perfilForm = document.querySelector("[data-perfil-form]");
    const perfilMsg = document.querySelector("[data-perfil-msg]");
    const logoutBtn = document.querySelector("[data-logout-btn]");
    const avatarInput = document.querySelector("#p-avatar");
    const avatarPreview = document.querySelector("[data-avatar-preview]");
    const avatarTrigger = document.querySelector("[data-avatar-trigger]");

    function mostrarAvatar(url) {
      if (!avatarPreview) return;
      if (url) {
        avatarPreview.src = url;
        avatarPreview.style.display = "block";
        if (avatarTrigger) avatarTrigger.textContent = "EDITAR FOTO";
      } else {
        avatarPreview.style.display = "none";
        if (avatarTrigger) avatarTrigger.textContent = "SUBIR FOTO";
      }
    }

    if (avatarTrigger && avatarInput) {
      avatarTrigger.addEventListener("click", () => avatarInput.click());
    }

    if (avatarInput) {
      avatarInput.addEventListener("change", () => {
        const file = avatarInput.files && avatarInput.files[0];
        if (!file) return;
        if (file.size > 3 * 1024 * 1024) {
          avatarInput.closest(".field").classList.add("has-error");
          avatarInput.value = "";
          return;
        }
        avatarInput.closest(".field").classList.remove("has-error");
        const lector = new FileReader();
        lector.onload = () => mostrarAvatar(lector.result);
        lector.readAsDataURL(file);
      });
    }

    if (tabLogin && tabRegistro) {
      tabLogin.addEventListener("click", () => {
        tabLogin.classList.add("btn-primary"); tabLogin.classList.remove("btn-outline");
        tabRegistro.classList.add("btn-outline"); tabRegistro.classList.remove("btn-primary");
        loginForm.style.display = "block";
        registroForm.style.display = "none";
      });
      tabRegistro.addEventListener("click", () => {
        tabRegistro.classList.add("btn-primary"); tabRegistro.classList.remove("btn-outline");
        tabLogin.classList.add("btn-outline"); tabLogin.classList.remove("btn-primary");
        registroForm.style.display = "block";
        loginForm.style.display = "none";
      });
      if (params.get("modo") === "registro") tabRegistro.click();
    }

    // ---- Mis partidas ----
    const misPartidas = document.querySelector("[data-mis-partidas]");
    function escapar(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
    function cargarMisPartidas(user) {
      if (!misPartidas || !window.supabaseClient) return;
      window.supabaseClient
        .from("inscripciones_registro")
        .select("id, operacion_id, created_at, datos")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .then(({ data, error }) => {
          if (error) { misPartidas.innerHTML = `<p class="form-note">No se han podido cargar tus partidas.</p>`; return; }
          if (!data || !data.length) {
            misPartidas.innerHTML = `<p class="form-note">Todavía no estás apuntado a ninguna partida. <a href="operaciones.html" style="color:var(--c-green-bright);">Ver operaciones</a></p>`;
            return;
          }
          misPartidas.innerHTML = data.map((fila) => {
            const op = typeof obtenerOperacionPorId === "function" ? obtenerOperacionPorId(fila.operacion_id) : null;
            const nombre = op ? op.nombre : (fila.datos && fila.datos.operacion) || fila.operacion_id;
            const fecha = op ? op.fechaDisplay : (fila.datos && fila.datos.fechaDisplay) || "";
            const pasada = op ? op.status === "finalizado" : false;
            return `
              <div class="mi-partida" data-fila="${fila.id}">
                <div>
                  <strong>${escapar(nombre)}</strong>
                  <span>${escapar(fecha)}${fila.datos && fila.datos.duerme ? " · duermes en el campo" : ""}</span>
                </div>
                <div class="mi-partida__acciones">
                  ${op ? `<a class="btn btn-outline" href="operacion.html?op=${encodeURIComponent(op.id)}">DOSSIER</a>` : ""}
                  ${pasada ? `<span class="tag">JUGADA</span>` : `<button type="button" class="btn btn-outline btn-baja" data-baja="${fila.id}">DARME DE BAJA</button>`}
                </div>
              </div>`;
          }).join("");
        });
    }
    if (misPartidas) {
      misPartidas.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-baja]");
        if (!btn) return;
        // Confirmación en dos pasos, dentro de la propia página.
        if (!btn.classList.contains("is-confirmando")) {
          btn.classList.add("is-confirmando");
          btn.textContent = "¿SEGURO? PULSA OTRA VEZ";
          setTimeout(() => { if (btn.isConnected) { btn.classList.remove("is-confirmando"); btn.textContent = "DARME DE BAJA"; } }, 4000);
          return;
        }
        btn.disabled = true;
        btn.textContent = "DANDO DE BAJA…";
        window.supabaseClient
          .from("inscripciones_registro")
          .delete()
          .eq("id", btn.getAttribute("data-baja"))
          .select("id")
          .then(({ data, error }) => {
            if (error || !data || !data.length) {
              btn.disabled = false;
              btn.textContent = "NO SE PUDO. ESCRÍBENOS";
              return;
            }
            window.obtenerUsuarioActual().then((u) => u && cargarMisPartidas(u));
          });
      });
    }

    function mostrarEstado(user) {
      if (user) {
        cargarMisPartidas(user);
        if (window.supabaseClient) {
          window.supabaseClient.rpc("es_organizador").then(({ data }) => {
            const acceso = document.querySelector("[data-organizador-acceso]");
            if (acceso && data === true) acceso.hidden = false;
          });
        }
        if (guestBlock) guestBlock.style.display = "none";
        if (userBlock) userBlock.style.display = "block";
        if (userEmailEl) userEmailEl.textContent = user.email;
        if (window.obtenerPerfil) {
          window.obtenerPerfil(user.id).then((perfil) => {
            if (!perfilForm) return;
            if (!perfil) {
              // Primera vez que entra tras confirmar el email: creamos el
              // perfil con el usuario elegido al registrarse.
              const usernameInicial = (user.user_metadata && user.user_metadata.username) || "";
              const usernameInput = perfilForm.querySelector('[name="username"]');
              if (usernameInput) usernameInput.value = usernameInicial;
              if (usernameInicial && window.guardarPerfil) {
                window.guardarPerfil(user.id, { username: usernameInicial });
              }
              return;
            }
            ["username", "nombre", "apellidos", "dni", "telefono", "callsign", "equipo", "experiencia"].forEach((campo) => {
              const input = perfilForm.querySelector(`[name="${campo}"]`);
              if (input && perfil[campo]) input.value = perfil[campo];
            });
            mostrarAvatar(perfil.avatar_url || null);
          });
        }
      } else {
        if (guestBlock) guestBlock.style.display = "block";
        if (userBlock) userBlock.style.display = "none";
      }
    }

    if (window.obtenerUsuarioActual) {
      window.obtenerUsuarioActual().then(mostrarEstado);
    }

    // --- ¿Has olvidado tu contraseña? ---
    const olvidoForm = document.querySelector("[data-olvido-form]");
    const olvidoMsg = document.querySelector("[data-olvido-msg]");
    const olvidoAbrir = document.querySelector("[data-olvido-abrir]");
    const olvidoVolver = document.querySelector("[data-olvido-volver]");
    if (olvidoForm && olvidoAbrir) {
      [tabLogin, tabRegistro].forEach((tab) => tab && tab.addEventListener("click", () => { olvidoForm.style.display = "none"; }));
      olvidoAbrir.addEventListener("click", (e) => {
        e.preventDefault();
        loginForm.style.display = "none";
        olvidoForm.style.display = "block";
        if (loginForm.email.value) olvidoForm.email.value = loginForm.email.value;
        olvidoForm.email.focus();
      });
      olvidoVolver.addEventListener("click", (e) => {
        e.preventDefault();
        olvidoForm.style.display = "none";
        loginForm.style.display = "block";
      });
      olvidoForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const email = olvidoForm.email.value.trim();
        const campo = olvidoForm.email.closest(".field");
        const valido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        if (campo) campo.classList.toggle("has-error", !valido);
        if (!valido) return;
        const btn = olvidoForm.querySelector('button[type="submit"]');
        btn.disabled = true;
        olvidoMsg.style.color = "";
        olvidoMsg.textContent = "Enviando…";
        window.supabaseClient.auth
          .resetPasswordForEmail(email, { redirectTo: `${location.origin}/restablecer.html` })
          .then(({ error }) => {
            btn.disabled = false;
            if (error && /rate|seconds|too many/i.test(error.message || "")) {
              olvidoMsg.style.color = "var(--c-red-bright)";
              olvidoMsg.textContent = "Has pedido varios enlaces seguidos. Espera unos minutos y vuelve a intentarlo.";
              return;
            }
            // No se dice si la cuenta existe o no (así nadie puede averiguar qué emails están registrados).
            olvidoMsg.style.color = "var(--c-green-bright)";
            olvidoMsg.textContent = "Si hay una cuenta con ese email, te acabamos de enviar un enlace (revisa también spam). Si no te llega en unos minutos, es que con ese email no hay ninguna cuenta: prueba con otro email o créala en «Registrarme».";
          });
      });
    }

    if (loginForm) {
      loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const email = loginForm.email.value.trim();
        const password = loginForm.password.value;
        if (loginMsg) { loginMsg.textContent = "Entrando…"; loginMsg.style.color = ""; }
        window.iniciarSesion(email, password).then((res) => {
          if (res.ok) {
            if (loginMsg) { loginMsg.textContent = ""; }
            if (irADestino()) return;
            window.obtenerUsuarioActual().then(mostrarEstado);
          } else {
            if (loginMsg) { loginMsg.textContent = res.error; loginMsg.style.color = "var(--c-red-bright)"; }
          }
        });
      });
    }

    if (registroForm) {
      registroForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const username = registroForm.username.value.trim();
        const email = registroForm.email.value.trim();
        const password = registroForm.password.value;
        const password2 = registroForm.password2.value;
        if (username.length < 3) {
          if (registroMsg) { registroMsg.textContent = "Elige un nombre de usuario de al menos 3 caracteres."; registroMsg.style.color = "var(--c-red-bright)"; }
          return;
        }
        if (password !== password2) {
          if (registroMsg) { registroMsg.textContent = "Las contraseñas no coinciden."; registroMsg.style.color = "var(--c-red-bright)"; }
          return;
        }
        if (registroMsg) { registroMsg.textContent = "Creando cuenta…"; registroMsg.style.color = ""; }
        window.registrarUsuario(email, password, username).then((res) => {
          if (res.ok) {
            // Si la cuenta queda activa al momento (sin email de confirmación),
            // se entra directamente.
            if (res.data && res.data.session) {
              if (registroMsg) { registroMsg.textContent = "¡Cuenta creada! Entrando…"; registroMsg.style.color = "var(--c-green-bright)"; }
              registroForm.reset();
              if (irADestino()) return;
              window.obtenerUsuarioActual().then(mostrarEstado);
              return;
            }
            if (registroMsg) {
              registroMsg.textContent = volver
                ? "¡Cuenta creada! Revisa tu email para confirmarla, luego inicia sesión aquí y te llevamos directo a la inscripción."
                : "¡Cuenta creada! Revisa tu email para confirmarla y luego inicia sesión.";
              registroMsg.style.color = "var(--c-green-bright)";
            }
            registroForm.reset();
          } else {
            if (registroMsg) { registroMsg.textContent = res.error; registroMsg.style.color = "var(--c-red-bright)"; }
          }
        });
      });
    }

    if (perfilForm) {
      perfilForm.addEventListener("submit", (e) => {
        e.preventDefault();
        window.obtenerUsuarioActual().then((user) => {
          if (!user) return;
          const datos = {
            username: perfilForm.username.value.trim(),
            nombre: perfilForm.nombre.value.trim(),
            apellidos: perfilForm.apellidos.value.trim(),
            dni: perfilForm.dni.value.trim(),
            telefono: perfilForm.telefono.value.trim(),
            callsign: perfilForm.callsign.value.trim(),
            equipo: perfilForm.equipo.value.trim(),
            experiencia: perfilForm.experiencia.value,
          };
          if (perfilMsg) { perfilMsg.textContent = "Guardando…"; perfilMsg.style.color = ""; }

          const archivoAvatar = avatarInput && avatarInput.files && avatarInput.files[0];
          const subida = archivoAvatar && window.subirAvatar
            ? window.subirAvatar(user.id, archivoAvatar)
            : Promise.resolve(null);

          subida.then((avatarUrl) => {
            if (avatarUrl) datos.avatar_url = avatarUrl;
            window.guardarPerfil(user.id, datos).then((ok) => {
              if (perfilMsg) {
                perfilMsg.textContent = ok ? "Perfil guardado. Volviendo…" : "No se pudo guardar el perfil.";
                perfilMsg.style.color = ok ? "var(--c-green-bright)" : "var(--c-red-bright)";
              }
              if (ok && avatarUrl) {
                mostrarAvatar(avatarUrl);
                if (avatarInput) avatarInput.value = "";
              }
              if (ok) setTimeout(volverTrasGuardar, 1200);
            });
          });
        });
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        window.cerrarSesion().then(() => {
          mostrarEstado(null);
        });
      });
    }
  });
})();
