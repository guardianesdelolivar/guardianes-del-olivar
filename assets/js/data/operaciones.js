/**
 * OPERACIONES.JS
 * Fuente única de datos de operaciones de GUARDIANES DEL OLIVAR.
 * Para añadir una operación nueva, añade un objeto más a este array.
 * Ninguna otra parte de la web necesita modificarse: todas las páginas
 * (inicio, listado, calendario, dossier, inscripción, email de
 * confirmación) leen de aquí.
 *
 * status: "abiertas" | "ultimas" | "completo" | "finalizado"
 *
 * Campos opcionales:
 *   plazasTotal / maxParticipantes: null  -> partida sin límite de plazas
 *                                           (no se muestra barra de plazas).
 *   contadorEnVivo: true  -> esta operación usa el contador de plazas de la
 *                            hoja de Google. El contador es UNO solo para toda
 *                            la hoja, así que solo una operación debe tenerlo.
 *   almuerzo: false       -> oculta la opción de almuerzo (+10 €) al inscribirse.
 *   duracionHoras         -> duración para el archivo de calendario (.ics).
 *   pernocta: true        -> al inscribirse se pregunta si se queda a dormir.
 */

const OPERACIONES = [
  {
    id: "partida-24h-noviembre",
    codigo: "OP-2611-24H-II",
    nombre: "PARTIDA 24 HORAS · 2ª EDICIÓN",
    tipo: "Partida 24 horas · 2ª edición",
    clasificacion: "PUBLIC",
    fecha: "2026-11-14",
    fechaDisplay: "14 NOVIEMBRE 2026",
    horaInicio: "08:00",
    horaFin: null,
    duracionHoras: 24,
    horario: "Empezamos a las 08:00 h en el campo · Partida de 24 horas · También puedes venir solo de día y jugar hasta que te canses",
    ubicacion: "Campo de Airsoft de Estercuel",
    localidad: "Estercuel (Teruel)",
    mapaUbicacion: "https://maps.app.goo.gl/tWSZByowQHgVgcqg8",
    puntoEncuentro: "En el propio campo de Guardianes del Olivar, a las 08:00 h",
    mapaPuntoEncuentro: "https://maps.app.goo.gl/tWSZByowQHgVgcqg8",
    pago: "El pago (15 €) se hace en efectivo, en el campo, una vez rellenes la documentación el mismo día.",
    precio: 15,
    plazasTotal: 30,
    plazasOcupadas: 0,
    maxParticipantes: 30,
    almuerzo: false,
    pernocta: true,
    status: "abiertas",
    dificultad: "Todos los niveles",
    facciones: [],
    objetivos: [
      { icono: "reloj", texto: "24 horas de partida, de día y de noche" },
      { icono: "tienda", texto: "Noche en el campo, en carpa y saco (opcional)" }
    ],
    resumen: "Vuelve la partida de 24 horas: segunda edición en el campo de Guardianes del Olivar. Se hace noche en el campo, y si no quieres dormir allí, juega desde por la mañana hasta que te canses.",
    historia: "Sábado 14 de noviembre de 2026. Llega la segunda edición de la partida de 24 horas de Guardianes del Olivar en el Campo de Airsoft de Estercuel (Teruel). Se juega de día y de noche, con la carpa montada en el campo para quien quiera quedarse a dormir.",
    briefing: "Empezamos a las 08:00 h en el propio campo. La partida dura 24 horas, pero no hace falta aguantarlas todas: puedes venir desde por la mañana y jugar hasta que te canses. Para quien quiera hacer noche, montamos una carpa donde dormir en saco de dormir. No hay servicio de comida: cada uno trae la suya y el agua para toda la jornada. El pago (15 €) se hace en efectivo en el propio campo, al rellenar la documentación. Los modos de juego se explican en el briefing del día.",
    misiones: [
      { numero: "01", titulo: "Llegada al campo", detalle: "08:00 h en el Campo de Guardianes del Olivar. Documentación, pago y revisión de réplicas antes de empezar." },
      { numero: "02", titulo: "Jornada de día", detalle: "Partida desde por la mañana. Si no vas a dormir allí, juega hasta que te canses." },
      { numero: "03", titulo: "Noche en el campo", detalle: "Se sigue jugando de noche. Quien quiera, descansa en la carpa con su saco de dormir." },
      { numero: "04", titulo: "Modos de juego", detalle: "Se anuncian en el briefing del día." }
    ],
    queLlevar: ["Réplica revisada", "Protección ocular homologada (obligatoria)", "Tu comida y agua: no hay servicio de comidas", "Saco de dormir, si vas a hacer noche en la carpa", "Ropa de abrigo para la noche", "Linterna o frontal", "Calzado adecuado para terreno natural"],
    reglasEspeciales: ["Plazas limitadas a 30 jugadores: confirma cuanto antes", "Cada jugador trae su propia comida", "Dormir en el campo es opcional: hay carpa para sacos de dormir", "El pago (15 €) se hace en efectivo, en el campo, al rellenar la documentación", "Inscripción también disponible por WhatsApp: 642 06 42 32 (Javi Cantos)"],
    imagenTema: "nocturna",
    imagenCartel: "assets/cartel-partida-24h.webp",
    imagenCartelCompartir: "assets/cartel-partida-24h.jpg"
  },
  {
    id: "la-guerra-comienza",
    codigo: "OP-2610-LGC",
    nombre: "LA GUERRA COMIENZA",
    tipo: "Partida especial",
    clasificacion: "PUBLIC",
    fecha: "2026-10-17",
    fechaDisplay: "17 OCTUBRE 2026",
    horaInicio: "08:00",
    horaFin: null,
    horario: "Encuentro 08:00 h en Bar La Campana · Cronografiado 08:30–09:00 h · Partida hasta que el cuerpo aguante",
    ubicacion: "Campo de Airsoft de Estercuel",
    localidad: "Estercuel (Teruel)",
    mapaUbicacion: "https://maps.app.goo.gl/tWSZByowQHgVgcqg8",
    puntoEncuentro: "Bar La Campana",
    mapaPuntoEncuentro: "https://maps.app.goo.gl/9dCeZV14z1NXGvyBA",
    puntoEncuentroAlternativo: "Si el bar está cerrado, quedamos en el Hotel Estercuel",
    mapaPuntoEncuentroAlternativo: "https://maps.app.goo.gl/3dSHv7yS652FQxCJA",
    pago: "El pago (10 €) se hace en efectivo, en el campo, una vez rellenes la documentación el mismo día.",
    precio: 10,
    plazasTotal: 40,
    plazasOcupadas: 0,
    status: "abiertas",
    dificultad: "Todos los niveles",
    facciones: ["Escuadrón Cuervo", "Escuadrón Lobo"],
    objetivos: [
      { icono: "bomba", texto: "Desactiva la bomba" },
      { icono: "bandera", texto: "Captura la bandera" }
    ],
    resumen: "Primera operación oficial de Guardianes del Olivar. Avanza. Combate. Sobrevive.",
    historia: "17 de octubre de 2026. La guerra comienza. La primera partida especial de Guardianes del Olivar se juega en el Campo de Airsoft de Estercuel (Teruel), con dos misiones sobre la mesa: desactivar la bomba y capturar la bandera.",
    briefing: "Quedamos a las 08:00 en el Bar La Campana, punto de encuentro antes de bajar al campo (si el bar está cerrado, quedamos en el Hotel Estercuel). El cronografiado de réplicas es de 08:30 a 09:00 h, así que llega con tiempo para que te dé tiempo a pasarlo sin agobios. La partida se juega hasta que el cuerpo aguante, así que trae agua, algo de comer y ganas de guerra. El pago de la partida se hace en efectivo en el propio campo, al rellenar la documentación.",
    misiones: [
      { numero: "01", titulo: "Punto de encuentro", detalle: "Bar La Campana, 08:00 h. De ahí nos organizamos para bajar juntos al campo." },
      { numero: "02", titulo: "Cronografiado", detalle: "De 08:30 a 09:00 h se revisan las réplicas antes de empezar a jugar." },
      { numero: "03", titulo: "Desactiva la bomba", detalle: "Localiza el objetivo y desactívalo antes de que sea tarde." },
      { numero: "04", titulo: "Captura la bandera", detalle: "Llega hasta el punto de bandera y consigue mantenerlo para tu escuadrón." }
    ],
    queLlevar: ["Réplica revisada (pasa el cronógrafo de 08:30 a 09:00 h)", "Protección ocular homologada (obligatoria)", "Ropa de camuflaje o de tonos oscuros", "Agua y comida para toda la jornada: se juega hasta que el cuerpo aguante", "Calzado adecuado para terreno natural"],
    reglasEspeciales: ["Plazas limitadas a 40 jugadores: confirma cuanto antes", "El pago (10 €) se hace en efectivo, en el campo, al rellenar la documentación", "Inscripción también disponible por WhatsApp: 642 06 42 32 (Javi Cantos)"],
    maxParticipantes: 40,
    contadorEnVivo: true,
    imagenTema: "urbano",
    imagenCartel: "assets/cartel-la-guerra-comienza.webp",
    imagenCartelCompartir: "assets/cartel-la-guerra-comienza.jpg"
  }
];

/* ---------------------------------------------------------------
 * HORA DE ESPAÑA (Europe/Madrid)
 * Las fechas y horas de las operaciones son siempre hora peninsular
 * española, aunque quien visite la web tenga el móvil en otra zona
 * horaria. Estas utilidades lo garantizan, con horario de verano
 * incluido.
 * --------------------------------------------------------------- */
const ZONA_HORARIA_OPERACIONES = "Europe/Madrid";

// Diferencia en minutos entre Madrid y UTC en un instante dado (+60 o +120).
function desfaseMadridMinutos(instante) {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: ZONA_HORARIA_OPERACIONES, hourCycle: "h23",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(instante).reduce((acc, p) => { acc[p.type] = p.value; return acc; }, {});
  const comoUTC = Date.UTC(+partes.year, +partes.month - 1, +partes.day, +partes.hour, +partes.minute, +partes.second);
  return Math.round((comoUTC - instante.getTime()) / 60000);
}

// Convierte "2026-10-17" + "08:00" (hora de Madrid) en un Date correcto.
function fechaHoraMadrid(fecha, hora) {
  const [y, m, d] = fecha.split("-").map(Number);
  const [hh, mm] = (hora || "00:00").split(":").map(Number);
  const aproximado = new Date(Date.UTC(y, m - 1, d, hh, mm));
  return new Date(aproximado.getTime() - desfaseMadridMinutos(aproximado) * 60000);
}

// Desfase en formato ISO ("+02:00" en verano, "+01:00" en invierno).
function desfaseMadridISO(fecha, hora) {
  const min = desfaseMadridMinutos(fechaHoraMadrid(fecha, hora));
  const signo = min >= 0 ? "+" : "-";
  const abs = Math.abs(min);
  return `${signo}${String(Math.floor(abs / 60)).padStart(2, "0")}:${String(abs % 60).padStart(2, "0")}`;
}

// Fecha de hoy en Madrid, como "AAAA-MM-DD".
function hoyEnMadrid() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ZONA_HORARIA_OPERACIONES }).format(new Date());
}

/* ---------------------------------------------------------------
 * CIERRE AUTOMÁTICO DE OPERACIONES PASADAS
 * Una operación cuya fecha ya ha pasado se marca como "finalizado"
 * automáticamente, aunque aquí arriba siga poniendo "abiertas".
 * Así nadie puede inscribirse a una partida que ya se jugó, y pasa
 * sola al archivo de "Operaciones finalizadas". El día de la partida
 * sigue apareciendo como activa; se cierra a partir del día siguiente.
 * --------------------------------------------------------------- */
function cerrarOperacionesPasadas() {
  const hoy = hoyEnMadrid();
  OPERACIONES.forEach((op) => {
    if (op.fecha < hoy && op.status !== "finalizado") op.status = "finalizado";
  });
}
cerrarOperacionesPasadas();

/* ---------------------------------------------------------------
 * PARTIDAS DESDE LA BASE DE DATOS
 * Las partidas se crean y editan desde la zona del organizador y se
 * guardan en Supabase. La lista de arriba es solo una copia de respaldo
 * por si la base de datos no responde: la web la usa mientras tanto.
 * Todas las páginas esperan a OPERACIONES_LISTO antes de pintar.
 * --------------------------------------------------------------- */
const SUPABASE_REST = "https://qugmbyqesdbxpbvytimd.supabase.co/rest/v1";
const SUPABASE_PUBLICA = "sb_publishable_i-MGthoW18TsiMlsnPr2NQ_7umDZSac";

window.OPERACIONES_LISTO = (function cargarOperaciones() {
  if (typeof fetch !== "function") return Promise.resolve();
  const control = typeof AbortController === "function" ? new AbortController() : null;
  const espera = setTimeout(() => control && control.abort(), 5000);
  return fetch(`${SUPABASE_REST}/operaciones?select=datos&order=fecha.asc`, {
    headers: { apikey: SUPABASE_PUBLICA },
    signal: control ? control.signal : undefined,
  })
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
    .then((filas) => {
      if (Array.isArray(filas) && filas.length) {
        OPERACIONES.length = 0;
        filas.forEach((f) => OPERACIONES.push(f.datos));
        cerrarOperacionesPasadas();
      }
    })
    .catch((err) => console.warn("Se usan las partidas guardadas en la web:", err.message || err))
    .finally(() => clearTimeout(espera));
})();

// Ejecuta fn cuando la página está lista y las partidas cargadas.
function cuandoOperaciones(fn) {
  const dom = new Promise((ok) => {
    if (document.readyState !== "loading") ok();
    else document.addEventListener("DOMContentLoaded", ok, { once: true });
  });
  Promise.all([dom, window.OPERACIONES_LISTO]).then(() => fn());
}

// Utilidad compartida: devuelve las operaciones ordenadas por fecha.
function ordenarOperacionesPorFecha(lista) {
  return [...lista].sort((a, b) => a.fecha.localeCompare(b.fecha));
}

function obtenerOperacionPorId(id) {
  return OPERACIONES.find((op) => op.id === id);
}
