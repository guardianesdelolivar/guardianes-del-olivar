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

    function mostrarAvatar(url) {
      if (!avatarPreview) return;
      if (url) {
        avatarPreview.src = url;
        avatarPreview.style.display = "block";
      } else {
        avatarPreview.style.display = "none";
      }
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
    }

    function mostrarEstado(user) {
      if (user) {
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

    if (loginForm) {
      loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const email = loginForm.email.value.trim();
        const password = loginForm.password.value;
        if (loginMsg) { loginMsg.textContent = "Entrando…"; loginMsg.style.color = ""; }
        window.iniciarSesion(email, password).then((res) => {
          if (res.ok) {
            if (loginMsg) { loginMsg.textContent = ""; }
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
            if (registroMsg) {
              registroMsg.textContent = "¡Cuenta creada! Revisa tu email para confirmarla y luego inicia sesión.";
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
                perfilMsg.textContent = ok ? "Perfil guardado correctamente." : "No se pudo guardar el perfil.";
                perfilMsg.style.color = ok ? "var(--c-green-bright)" : "var(--c-red-bright)";
              }
              if (ok && avatarUrl) {
                mostrarAvatar(avatarUrl);
                if (avatarInput) avatarInput.value = "";
              }
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
