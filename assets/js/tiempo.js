/**
 * TIEMPO.JS — parte meteorológico del campo de Estercuel para el día de la
 * partida: temperatura, humedad y probabilidad de lluvia, hora a hora.
 *
 * Datos de Open-Meteo (open-meteo.com, CC BY 4.0), consultados en directo:
 * cada vez que alguien abre la página ve la previsión más reciente, que se
 * actualiza varias veces al día. Solo hay previsión hasta 16 días vista.
 */
(function () {
  "use strict";

  const CAMPO = { lat: 40.8532, lon: -0.6228 };
  const DIAS = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];
  const MAX_DIAS = 15;

  const sumarDias = (fecha, n) => {
    const d = new Date(`${fecha}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  };
  const diasHasta = (fecha) => Math.round((new Date(`${fecha}T12:00:00Z`) - new Date(`${hoyEnMadrid()}T12:00:00Z`)) / 86400000);

  // Pide la previsión de la ventana de juego de una operación.
  function obtenerPrevision(op) {
    const faltan = diasHasta(op.fecha);
    const horas = Math.max(1, Number(op.duracionHoras) || 8);
    const inicioH = Number((op.horaInicio || "08:00").split(":")[0]);
    const diasPartida = Math.ceil((inicioH + horas) / 24);
    if (faltan < 0) return Promise.resolve({ estado: "pasada" });
    if (faltan > MAX_DIAS) return Promise.resolve({ estado: "lejos", faltan });
    const fin = sumarDias(op.fecha, Math.min(diasPartida - 1, MAX_DIAS - faltan));
    const url = "https://api.open-meteo.com/v1/forecast?" + new URLSearchParams({
      latitude: CAMPO.lat, longitude: CAMPO.lon, timezone: "Europe/Madrid",
      start_date: op.fecha, end_date: fin,
      daily: "temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,relative_humidity_2m_mean,wind_speed_10m_max,sunrise,sunset",
      hourly: "temperature_2m,relative_humidity_2m,precipitation_probability,precipitation",
    });
    return fetch(url).then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status)))).then((j) => {
      // Recorta las horas a la ventana de juego.
      const desde = `${op.fecha}T${String(inicioH).padStart(2, "0")}:00`;
      const idx0 = Math.max(0, j.hourly.time.indexOf(desde));
      const idx1 = Math.min(j.hourly.time.length, idx0 + horas + 1);
      const h = {};
      Object.keys(j.hourly).forEach((k) => { h[k] = j.hourly[k].slice(idx0, idx1); });
      return { estado: "ok", altitud: j.elevation, diario: j.daily, horas: h, faltan };
    });
  }

  function icono(prob, mm, tmax) {
    if (prob >= 60 || mm >= 2) return '<path d="M7 15a4 4 0 1 1 .8-7.9A5 5 0 0 1 17.5 9 3.5 3.5 0 0 1 17 16H7"/><path d="M9 18l-1 3M13 18l-1 3M17 18l-1 3"/>';
    if (prob >= 25) return '<path d="M7 17a4 4 0 1 1 .8-7.9A5 5 0 0 1 17.5 11 3 3 0 0 1 17 17H7"/>';
    if (tmax <= 5) return '<path d="M12 3v18M4.5 7.5l15 9M19.5 7.5l-15 9"/>';
    return '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/>';
  }
  const svgIcono = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;

  // Gráfica hora a hora: temperatura (línea) y probabilidad de lluvia (barras), con la noche sombreada.
  function grafica(p) {
    const t = p.horas.temperature_2m, pr = p.horas.precipitation_probability, horas = p.horas.time;
    const n = t.length;
    if (n < 2) return "";
    const W = 640, H = 170, mL = 34, mR = 34, mT = 14, mB = 26;
    const x = (i) => mL + (i / (n - 1)) * (W - mL - mR);
    const tMin = Math.floor(Math.min(...t) - 1), tMax = Math.ceil(Math.max(...t) + 1);
    const y = (v) => mT + (1 - (v - tMin) / (tMax - tMin || 1)) * (H - mT - mB);
    const yP = (v) => H - mB - (v / 100) * (H - mT - mB);
    // noche según salida y puesta de sol
    const sol = {};
    p.diario.time.forEach((d, i) => { sol[d] = [p.diario.sunrise[i].slice(11, 16), p.diario.sunset[i].slice(11, 16)]; });
    const esNoche = (iso) => { const [d, hh] = [iso.slice(0, 10), iso.slice(11, 16)]; const s = sol[d]; return s ? hh < s[0] || hh >= s[1] : false; };
    let noche = "";
    for (let i = 0; i < n - 1; i++) if (esNoche(horas[i])) noche += `<rect x="${x(i)}" y="${mT}" width="${x(i + 1) - x(i) + 0.5}" height="${H - mT - mB}" class="tiempo-noche"/>`;
    const barras = pr.map((v, i) => (v > 0 ? `<rect x="${x(i) - 3}" y="${yP(v)}" width="6" height="${H - mB - yP(v)}" class="tiempo-lluvia"><title>${horas[i].slice(11, 16)} · ${v}% lluvia</title></rect>` : "")).join("");
    const linea = t.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
    const puntos = t.map((v, i) => `<circle cx="${x(i)}" cy="${y(v)}" r="2.2" class="tiempo-punto"><title>${horas[i].slice(11, 16)} · ${v.toFixed(1)} °C · ${p.horas.relative_humidity_2m[i]}% humedad</title></circle>`).join("");
    const paso = n > 18 ? 3 : n > 10 ? 2 : 1;
    let ejes = "";
    for (let i = 0; i < n; i += paso) ejes += `<text x="${x(i)}" y="${H - 8}" class="tiempo-eje" text-anchor="middle">${horas[i].slice(11, 13)}h</text>`;
    ejes += `<text x="${mL - 6}" y="${y(tMax) + 4}" class="tiempo-eje" text-anchor="end">${tMax}°</text><text x="${mL - 6}" y="${y(tMin) + 4}" class="tiempo-eje" text-anchor="end">${tMin}°</text>`;
    ejes += `<text x="${W - mR + 6}" y="${yP(100) + 4}" class="tiempo-eje">100%</text><text x="${W - mR + 6}" y="${yP(0)}" class="tiempo-eje">0%</text>`;
    return `<div class="tiempo-grafica"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Temperatura y probabilidad de lluvia hora a hora durante la partida">${noche}${barras}<path d="${linea}" class="tiempo-linea"/>${puntos}${ejes}</svg>
      <div class="tiempo-leyenda"><span><i class="l-temp"></i>Temperatura</span><span><i class="l-lluvia"></i>Prob. de lluvia</span><span><i class="l-noche"></i>Noche</span></div></div>`;
  }

  function pintar(cont, op) {
    cont.innerHTML = `<p class="form-note">Consultando la previsión…</p>`;
    obtenerPrevision(op).then((p) => {
      if (p.estado === "pasada") { cont.closest("[data-op-tiempo-block]").hidden = true; return; }
      if (p.estado === "lejos") {
        cont.innerHTML = `<p class="form-note">La previsión del tiempo aparecerá aquí ${MAX_DIAS} días antes de la partida (faltan ${p.faltan} días). Se actualiza sola cada día.</p>`;
        return;
      }
      const d = p.diario;
      const dias = d.time.map((fecha, i) => {
        const f = new Date(`${fecha}T12:00:00Z`);
        return `<div class="tiempo-dia">
          <div class="tiempo-dia__fecha">${DIAS[f.getUTCDay()]} ${f.getUTCDate()}</div>
          <div class="tiempo-dia__icono">${svgIcono(icono(d.precipitation_probability_max[i], d.precipitation_sum[i], d.temperature_2m_max[i]))}</div>
          <div class="tiempo-dia__temp"><b>${Math.round(d.temperature_2m_max[i])}°</b><span>${Math.round(d.temperature_2m_min[i])}°</span></div>
          <dl>
            <dt>Lluvia</dt><dd>${d.precipitation_probability_max[i]}%${d.precipitation_sum[i] ? ` · ${d.precipitation_sum[i]} mm` : ""}</dd>
            <dt>Humedad</dt><dd>${d.relative_humidity_2m_mean[i]}%</dd>
            <dt>Viento</dt><dd>${Math.round(d.wind_speed_10m_max[i])} km/h</dd>
          </dl>
        </div>`;
      }).join("");
      const ahora = new Date().toLocaleTimeString("es-ES", { timeZone: "Europe/Madrid", hour: "2-digit", minute: "2-digit" });
      cont.innerHTML = `<div class="tiempo-dias">${dias}</div>${grafica(p)}
        <p class="tiempo-nota">Previsión para el campo (${Math.round(p.altitud)} m de altitud), consultada hoy a las ${ahora}. Cuanto más cerca de la partida, más fiable. Datos: <a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo</a>.</p>`;
    }).catch(() => {
      cont.innerHTML = `<p class="form-note">No se ha podido cargar la previsión ahora mismo. Vuelve a intentarlo más tarde.</p>`;
    });
  }

  // Resumen de una línea (portada).
  function resumen(op) {
    return obtenerPrevision(op).then((p) => {
      if (p.estado !== "ok") return null;
      const d = p.diario;
      return `${Math.round(Math.min(...d.temperature_2m_min))}–${Math.round(Math.max(...d.temperature_2m_max))} °C · lluvia ${Math.max(...d.precipitation_probability_max)}% · humedad ${d.relative_humidity_2m_mean[0]}%`;
    }).catch(() => null);
  }

  window.TiempoCampo = { pintar, resumen };
})();
