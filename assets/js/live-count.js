/**
 * LIVE-COUNT.JS — contador de plazas en vivo, compartido por todas las visitas.
 *
 * Usa una Hoja de Google + Apps Script como "base de datos" gratuita, ya que
 * esta web no tiene servidor propio. Al cargar cualquier página, se lee el
 * número real de operadores inscritos y se sobrescribe en los datos de la
 * operación ANTES de pintar nada, así toda la web (tarjetas, calendario,
 * dossier, inscripción) muestra siempre el número correcto.
 *
 * PARA ACTIVARLO: sustituye CONTADOR_URL por la URL de tu Apps Script
 * desplegado como aplicación web. Mientras diga "TU_URL_DE_APPS_SCRIPT",
 * la web sigue funcionando normal, solo que con el número fijo de siempre.
 */
const CONTADOR_URL = "https://script.google.com/macros/s/AKfycbwAbu-1H-ZfxcTDApGND_qR9ucSbZqvHyiblrKXtxQONWxx5PZD747FRK0laOOa1rER/exec";

function contadorConfigurado() {
  return CONTADOR_URL && CONTADOR_URL !== "TU_URL_DE_APPS_SCRIPT";
}

/**
 * RECUENTO DE INSCRITOS POR OPERACIÓN (Supabase)
 * Cada inscripción se guarda en la tabla inscripciones_registro con el id
 * de la operación. La función contar_inscritos(op) de Supabase devuelve
 * cuántas hay, sin exponer quién se ha apuntado. Así cada operación tiene
 * su propio contador, que sube solo con cada inscripción.
 * Se usa en todas las operaciones salvo la marcada con contadorEnVivo
 * (la antigua, que sigue con el contador de la hoja de Google).
 */
function contarInscritos(op) {
  const cliente = window.supabaseClient;
  if (!cliente || op.contadorEnVivo) return Promise.resolve(null);
  return cliente
    .rpc("contar_inscritos", { op: op.id })
    .then(({ data, error }) => {
      if (error || typeof data !== "number") return null;
      op.plazasOcupadas = data;
      op.recuentoDisponible = true;
      if (op.plazasTotal && data >= op.plazasTotal && (op.status === "abiertas" || op.status === "ultimas")) {
        op.status = "completo";
      }
      return data;
    })
    .catch(() => null);
}
window.actualizarRecuentoInscritos = contarInscritos;

function contarEspera(op) {
  const cliente = window.supabaseClient;
  if (!cliente || !op.plazasTotal) return Promise.resolve(0);
  return cliente.rpc("contar_espera", { op: op.id })
    .then(({ data }) => { op.enEspera = typeof data === "number" ? data : 0; return op.enEspera; })
    .catch(() => 0);
}
window.contarEspera = contarEspera;

const RECUENTO_SUPABASE_LISTO = new Promise((resolve) => {
  cuandoOperaciones(() => {
    if (typeof OPERACIONES === "undefined") { resolve(); return; }
    const pendientes = OPERACIONES.filter((op) => op.status !== "finalizado" && !op.contadorEnVivo);
    Promise.all(pendientes.map((op) => Promise.all([contarInscritos(op), contarEspera(op)]))).then(() => resolve());
  });
});

// Promesa global: todas las páginas esperan a que esto termine antes de
// pintar las plazas, para no mostrar un número viejo un instante y luego
// cambiarlo (parpadeo).
const CONTADOR_HOJA_LISTO = contadorConfigurado()
  ? fetch(`${CONTADOR_URL}?action=get`)
      .then((r) => r.json())
      .then((data) => {
        // El contador de la hoja es uno solo, así que se aplica únicamente a
        // la operación marcada con contadorEnVivo: true en operaciones.js.
        const op = typeof OPERACIONES !== "undefined" ? OPERACIONES.find((o) => o.contadorEnVivo) : null;
        if (op && typeof data.count === "number") {
          op.plazasOcupadas = data.count;
          // Si con el número real ya está completo, lo marcamos como tal
          // para que nadie pueda seguir inscribiéndose por encima del máximo.
          if (op.plazasTotal && data.count >= op.plazasTotal && op.status !== "finalizado") {
            op.status = "completo";
          }
        }
      })
      .catch((err) => console.error("No se pudo leer el contador de plazas en vivo:", err))
  : Promise.resolve();

window.PLAZAS_LISTO = Promise.all([CONTADOR_HOJA_LISTO, RECUENTO_SUPABASE_LISTO]);

// Se llama justo después de confirmar una inscripción, para sumar 1 al
// contador compartido.
function incrementarPlazasEnVivo() {
  if (!contadorConfigurado()) return Promise.resolve(null);
  return fetch(`${CONTADOR_URL}?action=increment`)
    .then((r) => r.json())
    .then((data) => (typeof data.count === "number" ? data.count : null))
    .catch((err) => {
      console.error("No se pudo actualizar el contador de plazas:", err);
      return null;
    });
}

/**
 * COMENTARIOS — usan el mismo Apps Script que el contador de plazas
 * (misma hoja de cálculo, pestaña "Comentarios" aparte). Requiere que
 * el script de Apps Script tenga las acciones comentarios_listar y
 * comentarios_nuevo añadidas.
 */
function listarComentarios(opId) {
  if (!contadorConfigurado()) return Promise.resolve([]);
  return fetch(`${CONTADOR_URL}?action=comentarios_listar&op=${encodeURIComponent(opId)}`)
    .then((r) => r.json())
    .then((data) => (Array.isArray(data.comentarios) ? data.comentarios : []))
    .catch((err) => {
      console.error("No se pudieron cargar los comentarios:", err);
      return [];
    });
}

function enviarComentario(opId, nombre, texto) {
  if (!contadorConfigurado()) return Promise.resolve(null);
  const params = new URLSearchParams({ action: "comentarios_nuevo", op: opId, nombre, texto });
  return fetch(`${CONTADOR_URL}?${params.toString()}`)
    .then((r) => r.json())
    .then((data) => (data && data.ok ? data.comentario : null))
    .catch((err) => {
      console.error("No se pudo enviar el comentario:", err);
      return null;
    });
}
window.listarComentarios = listarComentarios;
window.enviarComentario = enviarComentario;

/**
 * REGISTRO DE INSCRIPCIONES EN HOJA DE CÁLCULO — usa el mismo Apps Script
 * (pestaña "Inscripciones" aparte). Cada inscripción confirmada añade una
 * fila con los datos del operador, para tener siempre a mano quién viene.
 * Requiere que el script tenga la acción inscripcion_nueva añadida.
 */
function registrarInscripcion(datos) {
  if (!contadorConfigurado()) return Promise.resolve(null);
  // SEGURIDAD: estos datos incluyen DNI, teléfono y email, así que se envían
  // por POST con el cuerpo como formulario (no como parámetros en la URL),
  // para que no queden en el historial del navegador ni en logs de acceso
  // que registren la URL completa. El Apps Script debe tener doPost(e)
  // (alias de doGet) para poder leerlos igual que antes.
  const params = new URLSearchParams({
    action: "inscripcion_nueva",
    referencia: datos.referencia || "",
    operacion: datos.operacion || "",
    nombre: datos.nombre || "",
    apellidos: datos.apellidos || "",
    dni: datos.dni || "",
    telefono: datos.telefono || "",
    email: datos.email || "",
    callsign: datos.callsign || "",
    equipo: datos.equipo || "",
    experiencia: datos.experiencia || "",
    almuerzo: datos.almuerzo || "",
    precio_total: datos.precio_total || "",
    fotos: datos.fotos || "",
    observaciones: datos.observaciones || "",
  });
  return fetch(CONTADOR_URL, { method: "POST", body: params })
    .then((r) => r.json())
    .catch((err) => {
      console.error("No se pudo registrar la inscripción en la hoja de cálculo:", err);
      return null;
    });
}
window.registrarInscripcion = registrarInscripcion;
