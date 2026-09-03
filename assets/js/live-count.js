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
const CONTADOR_URL = "TU_URL_DE_APPS_SCRIPT";

function contadorConfigurado() {
  return CONTADOR_URL && CONTADOR_URL !== "TU_URL_DE_APPS_SCRIPT";
}

// Promesa global: todas las páginas esperan a que esto termine antes de
// pintar las plazas, para no mostrar un número viejo un instante y luego
// cambiarlo (parpadeo).
window.PLAZAS_LISTO = contadorConfigurado()
  ? fetch(`${CONTADOR_URL}?action=get`)
      .then((r) => r.json())
      .then((data) => {
        if (typeof OPERACIONES !== "undefined" && OPERACIONES[0] && typeof data.count === "number") {
          OPERACIONES[0].plazasOcupadas = data.count;
          // Si con el número real ya está completo, lo marcamos como tal
          // para que nadie pueda seguir inscribiéndose por encima del máximo.
          if (data.count >= OPERACIONES[0].plazasTotal && OPERACIONES[0].status !== "finalizado") {
            OPERACIONES[0].status = "completo";
          }
        }
      })
      .catch((err) => console.error("No se pudo leer el contador de plazas en vivo:", err))
  : Promise.resolve();

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
