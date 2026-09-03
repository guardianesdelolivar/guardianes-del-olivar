/**
 * OPERACIONES.JS
 * Fuente única de datos de operaciones de GUARDIANES DEL OLIVAR.
 * Para añadir una operación nueva, añade un objeto más a este array.
 * Ninguna otra parte de la web necesita modificarse: todas las páginas
 * (inicio, listado, calendario, dossier, inscripción, email de
 * confirmación) leen de aquí.
 *
 * status: "abiertas" | "ultimas" | "completo" | "finalizado"
 */

const OPERACIONES = [
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
      { icono: "💣", texto: "Desactiva la bomba" },
      { icono: "🚩", texto: "Captura la bandera" }
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
    imagenTema: "urbano",
    imagenCartel: "assets/foto%202.jpeg"
  }
];

// Utilidad compartida: devuelve solo operaciones futuras u ordenadas por fecha.
function ordenarOperacionesPorFecha(lista) {
  return [...lista].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
}

function obtenerOperacionPorId(id) {
  return OPERACIONES.find((op) => op.id === id);
}
