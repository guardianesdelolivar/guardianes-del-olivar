/**
 * AUTH.JS — login / registro de operadores con Supabase.
 *
 * Usa Supabase (https://supabase.com) como backend de autenticación y
 * base de datos de perfiles, igual que Google Sheets se usa para el
 * contador de plazas, comentarios e inscripciones. Email de confirmación
 * ACTIVADO: tras registrarse, cada persona debe confirmar su correo antes
 * de poder iniciar sesión (evita cuentas duplicadas o falsas).
 */
const SUPABASE_URL = "https://qugmbyqesdbxpbvytimd.supabase.co";
const SUPABASE_KEY = "sb_publishable_i-MGthoW18TsiMlsnPr2NQ_7umDZSac";

const supabaseClient = window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;
window.supabaseClient = supabaseClient;

// Enlace de "he olvidado mi contraseña": aterrice donde aterrice, se lleva a
// la persona a la página para escribir la contraseña nueva.
if (supabaseClient) {
  supabaseClient.auth.onAuthStateChange((evento) => {
    if (evento === "PASSWORD_RECOVERY" && !/restablecer\.html$/.test(location.pathname)) {
      location.replace("restablecer.html");
    }
  });
}

function registrarUsuario(email, password, username) {
  if (!supabaseClient) return Promise.resolve({ ok: false, error: "Supabase no disponible." });
  return supabaseClient.auth
    .signUp({ email, password, options: { data: { username: username || "" } } })
    .then(({ data, error }) => {
      if (error) return { ok: false, error: traducirError(error.message) };
      return { ok: true, data };
    });
}

function iniciarSesion(email, password) {
  if (!supabaseClient) return Promise.resolve({ ok: false, error: "Supabase no disponible." });
  return supabaseClient.auth.signInWithPassword({ email, password }).then(({ data, error }) => {
    if (error) return { ok: false, error: traducirError(error.message) };
    return { ok: true, data };
  });
}

function cerrarSesion() {
  if (!supabaseClient) return Promise.resolve();
  return supabaseClient.auth.signOut();
}

function obtenerUsuarioActual() {
  if (!supabaseClient) return Promise.resolve(null);
  return supabaseClient.auth.getUser().then(({ data }) => (data ? data.user : null));
}

function obtenerPerfil(userId) {
  if (!supabaseClient) return Promise.resolve(null);
  return supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle()
    .then(({ data, error }) => {
      if (error) { console.error("No se pudo leer el perfil:", error); return null; }
      return data;
    });
}

function guardarPerfil(userId, perfil) {
  if (!supabaseClient) return Promise.resolve(false);
  const fila = Object.assign({ id: userId, updated_at: new Date().toISOString() }, perfil);
  return supabaseClient
    .from("profiles")
    .upsert(fila)
    .then(({ error }) => {
      if (error) { console.error("No se pudo guardar el perfil:", error); return false; }
      return true;
    });
}

function subirAvatar(userId, file) {
  if (!supabaseClient || !file) return Promise.resolve(null);
  const extension = (file.name.split(".").pop() || "jpg").toLowerCase();
  const ruta = `${userId}/avatar.${extension}`;
  return supabaseClient.storage
    .from("avatars")
    .upload(ruta, file, { upsert: true, cacheControl: "3600" })
    .then(({ error }) => {
      if (error) { console.error("No se pudo subir la foto:", error); return null; }
      const { data } = supabaseClient.storage.from("avatars").getPublicUrl(ruta);
      // Le añadimos la fecha para evitar que el navegador muestre una foto antigua en caché.
      return data.publicUrl ? `${data.publicUrl}?t=${Date.now()}` : null;
    });
}

function traducirError(msg) {
  const m = (msg || "").toLowerCase();
  if (m.includes("already registered") || m.includes("already exists")) return "Ya existe una cuenta con ese email.";
  if (m.includes("invalid login credentials")) return "Email o contraseña incorrectos.";
  if (m.includes("email not confirmed")) return "Todavía no has confirmado tu email. Revisa tu bandeja de entrada (y spam).";
  if (m.includes("password") && m.includes("6")) return "La contraseña debe tener al menos 6 caracteres.";
  if (m.includes("invalid email")) return "Introduce un email válido.";
  return msg || "Ha ocurrido un error. Inténtalo de nuevo.";
}

window.registrarUsuario = registrarUsuario;
window.iniciarSesion = iniciarSesion;
window.cerrarSesion = cerrarSesion;
window.obtenerUsuarioActual = obtenerUsuarioActual;
window.obtenerPerfil = obtenerPerfil;
window.guardarPerfil = guardarPerfil;
window.subirAvatar = subirAvatar;

// --- Estado de sesión en la barra de navegación (todas las páginas) ---
// Con sesión iniciada: "Mi cuenta" pequeño + botón INSCRÍBETE normal.
// Sin sesión: no se muestra INSCRÍBETE, solo un botón para crear cuenta.
function pintarEstadoSesion() {
  const navActions = document.querySelector(".nav-actions");
  if (!navActions || !supabaseClient) return;
  const inscribeteBtn = navActions.querySelector(".btn-primary");
  obtenerUsuarioActual().then((user) => {
    let link = navActions.querySelector("[data-auth-link]");
    if (!link) {
      link = document.createElement("a");
      link.setAttribute("data-auth-link", "");
      navActions.insertBefore(link, navActions.firstChild);
    }
    // En el móvil el enlace de cuenta va dentro del menú, para que la
    // barra superior no se salga de la pantalla.
    const menu = document.querySelector("[data-nav-links]");
    if (menu && !menu.querySelector("[data-menu-cuenta]")) {
      const li = document.createElement("li");
      li.className = "nav-links__cuenta";
      li.innerHTML = '<a href="login.html" data-menu-cuenta></a>';
      menu.appendChild(li);
    }
    const menuCuenta = menu ? menu.querySelector("[data-menu-cuenta]") : null;
    if (menuCuenta) menuCuenta.textContent = user ? "Mi cuenta" : "Crear cuenta / Entrar";

    // Solo los organizadores ven el acceso a la lista de inscritos.
    if (user && menu && !menu.querySelector("[data-menu-organizador]")) {
      supabaseClient.rpc("es_organizador").then(({ data }) => {
        if (data !== true || menu.querySelector("[data-menu-organizador]")) return;
        const li = document.createElement("li");
        li.innerHTML = '<a href="organizador.html" data-menu-organizador>Organizador</a>';
        menu.appendChild(li);
      });
    }

    if (user) {
      link.textContent = "MI CUENTA";
      link.href = "login.html";
      link.className = "nav-account-link";
      if (inscribeteBtn) inscribeteBtn.style.display = "";
    } else {
      link.textContent = "CREAR CUENTA";
      link.href = "login.html";
      link.className = "btn btn-primary";
      if (inscribeteBtn) inscribeteBtn.style.display = "none";
    }
  });
}

document.addEventListener("DOMContentLoaded", pintarEstadoSesion);
