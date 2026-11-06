/**
 * CAMPO3D.JS — maqueta 3D del campo de Estercuel.
 *
 * Datos reales del Instituto Geográfico Nacional:
 *   - Relieve: MDT05 (un punto cada 5 m), en assets/campo/relieve.json
 *     (alturas en decímetros sobre la cota mínima, uint16, fila norte primero).
 *   - Foto aérea: PNOA máxima actualidad, en assets/campo/ortofoto-*.jpg
 * Perímetro y puntos del campo en assets/campo/campo.json (metros, origen en
 * el centro de la zona, x hacia el este, y hacia el norte).
 */
import * as THREE from "../vendor/three-0.160.0.module.min.js";
import { OrbitControls } from "../vendor/OrbitControls-0.160.0.js";

const raiz = document.querySelector("[data-campo3d]");
const lienzo = raiz && raiz.querySelector("[data-campo3d-lienzo]");
const capaEtiquetas = raiz && raiz.querySelector("[data-campo3d-etiquetas]");
const cargando = raiz && raiz.querySelector("[data-campo3d-cargando]");
const lectura = raiz && raiz.querySelector("[data-campo3d-lectura]");
const brujula = raiz && raiz.querySelector("[data-campo3d-brujula]");
const reducirMovimiento = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const TIPOS = {
  bandera: { color: "#d9432f", icono: '<path d="M5 21V3.5M5 4h11.5l-2.5 4 2.5 4H5"/>' },
  caseta: { color: "#b3a576", icono: '<path d="M3.5 11 12 4l8.5 7M5.5 9.5V20h13V9.5M10 20v-5h4v5"/>' },
  aparcamiento: { color: "#6f9a5a", icono: '<rect x="4" y="3.5" width="16" height="17" rx="2"/><path d="M9.5 17V7.5h3.2a2.6 2.6 0 0 1 0 5.2H9.5"/>' },
};
function tipoDe(nombre) {
  const n = nombre.toLowerCase();
  if (n.includes("caseta")) return "caseta";
  if (n.includes("aparcamiento")) return "aparcamiento";
  return "bandera";
}

if (raiz && lienzo) iniciar().catch((err) => {
  console.error("No se pudo cargar la maqueta 3D:", err);
  if (cargando) cargando.textContent = "No se ha podido cargar la maqueta 3D en este dispositivo.";
});

async function iniciar() {
  // WebGL disponible?
  const prueba = document.createElement("canvas");
  if (!(prueba.getContext("webgl2") || prueba.getContext("webgl"))) {
    cargando.textContent = "Tu navegador no permite ver gráficos 3D. Prueba desde otro dispositivo.";
    return;
  }

  const movil = window.matchMedia("(max-width: 760px)").matches;
  const [info, buffer] = await Promise.all([
    fetch("assets/campo/campo.json").then((r) => r.json()),
    fetch("assets/campo/relieve.json").then((r) => r.json()).then((j) => Uint8Array.from(atob(j.datos), (c) => c.charCodeAt(0)).buffer),
  ]);
  const imagen = await cargarImagen(movil ? "assets/campo/ortofoto-1024.jpg" : "assets/campo/ortofoto-2048.jpg");

  const W = info.ancho_m, H = info.alto_m, nc = info.ncols, nr = info.nrows;
  const alturas = new Uint16Array(buffer);
  const altura = (x, y) => {
    // x este, y norte (metros desde el centro) -> metros sobre la cota mínima
    const c = Math.min(Math.max(((x + W / 2) / W) * (nc - 1), 0), nc - 1.0001);
    const r = Math.min(Math.max(((H / 2 - y) / H) * (nr - 1), 0), nr - 1.0001);
    const c0 = Math.floor(c), r0 = Math.floor(r), fc = c - c0, fr = r - r0;
    const v = (rr, cc) => alturas[rr * nc + cc] / 10;
    return v(r0, c0) * (1 - fc) * (1 - fr) + v(r0, c0 + 1) * fc * (1 - fr) + v(r0 + 1, c0) * (1 - fc) * fr + v(r0 + 1, c0 + 1) * fc * fr;
  };

  // ---------- Escena ----------
  const renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const escena = new THREE.Scene();
  const fondo = new THREE.Color("#0a0c0a");
  escena.background = fondo;
  escena.fog = new THREE.Fog(fondo, 900, 1900);

  const camara = new THREE.PerspectiveCamera(42, 1, 1, 5000);
  const mundo = new THREE.Group(); // se escala en vertical para exagerar el relieve
  escena.add(mundo);

  escena.add(new THREE.HemisphereLight("#e9efe2", "#2a2418", 1.05));
  const sol = new THREE.DirectionalLight("#fff4dc", 1.6);
  sol.position.set(-400, 600, 300);
  escena.add(sol);

  // ---------- Terreno ----------
  const geo = new THREE.PlaneGeometry(W, H, nc - 1, nr - 1);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setZ(i, alturas[i] / 10);
  geo.rotateX(-Math.PI / 2);
  geo.computeVertexNormals();

  const textura = new THREE.CanvasTexture(texturaResaltada(imagen, info.perimetro, W, H));
  textura.colorSpace = THREE.SRGBColorSpace;
  textura.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const terreno = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: textura, roughness: 1, metalness: 0 }));
  mundo.add(terreno);

  // Laterales tipo maqueta
  mundo.add(laterales(W, H, nc, nr, alturas));

  // ---------- Perímetro: valla luminosa ----------
  const puntos = densificar(info.perimetro, 4).map(([x, y]) => new THREE.Vector3(x, altura(x, y), -y));
  const valla = muro(puntos, 2.6);
  mundo.add(valla);
  const linea = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(puntos.map((p) => p.clone().setY(p.y + 2.6)), true), puntos.length * 2, 0.55, 6, true),
    new THREE.MeshBasicMaterial({ color: "#e8d27a" })
  );
  mundo.add(linea);

  // ---------- Puntos del campo ----------
  const marcadores = [];
  let nCaseta = 0;
  Object.entries(info.puntos).forEach(([nombre, [x, y]]) => {
    const tipo = tipoDe(nombre);
    const suelo = altura(x, y);
    const alto = tipo === "bandera" ? 18 : tipo === "caseta" ? 10 + 9 * nCaseta++ : 12;
    const color = new THREE.Color(TIPOS[tipo].color);
    const poste = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, alto, 8), new THREE.MeshBasicMaterial({ color }));
    poste.position.set(x, suelo + alto / 2, -y);
    mundo.add(poste);
    const anillo = new THREE.Mesh(new THREE.RingGeometry(3, 4.2, 32), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false }));
    anillo.rotation.x = -Math.PI / 2;
    anillo.position.set(x, suelo + 0.6, -y);
    mundo.add(anillo);
    const cima = new THREE.Object3D();
    cima.position.set(x, suelo + alto, -y);
    mundo.add(cima);

    const etiqueta = document.createElement("div");
    etiqueta.className = `campo3d__etiqueta campo3d__etiqueta--${tipo}`;
    etiqueta.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${TIPOS[tipo].icono}</svg><span>${nombre}</span>`;
    capaEtiquetas.appendChild(etiqueta);
    marcadores.push({ cima, anillo, etiqueta });
  });

  // ---------- Cámara y controles ----------
  const centro = centroide(info.perimetro);
  const objetivo = new THREE.Vector3(centro[0], altura(centro[0], centro[1]), -centro[1]);
  const controles = new OrbitControls(camara, renderer.domElement);
  controles.target.copy(objetivo);
  controles.enableDamping = true;
  controles.dampingFactor = 0.08;
  controles.minDistance = 60;
  controles.maxDistance = 1100;
  controles.maxPolarAngle = Math.PI * 0.47;
  controles.autoRotate = !reducirMovimiento;
  controles.autoRotateSpeed = 0.6;
  const parar = () => { controles.autoRotate = false; actualizarBoton(); };
  renderer.domElement.addEventListener("pointerdown", parar);
  renderer.domElement.addEventListener("wheel", parar, { passive: true });

  const VISTAS = {
    "3d": { dist: 420, polar: 0.95, azim: -0.6 },
    aerea: { dist: 520, polar: 0.02, azim: 0 },
    baja: { dist: 230, polar: 1.32, azim: 0.4 },
  };
  let animVista = null;
  function irAVista(nombre, inmediato) {
    const v = VISTAS[nombre];
    const aspecto = (lienzo.clientWidth || 1) / (lienzo.clientHeight || 1);
    const factor = aspecto < 1.2 ? Math.min(1.5, 0.9 / aspecto) : 1;
    const destino = new THREE.Vector3().setFromSphericalCoords(v.dist * factor, v.polar, v.azim).add(objetivo);
    if (inmediato || reducirMovimiento) {
      camara.position.copy(destino);
      controles.target.copy(objetivo);
      return;
    }
    animVista = { desde: camara.position.clone(), hasta: destino, objDesde: controles.target.clone(), t0: performance.now() };
  }
  redimensionar();
  irAVista("3d", true);
  if (!reducirMovimiento) {
    // Entrada: aproximación desde lejos
    camara.position.copy(new THREE.Vector3().setFromSphericalCoords(950, 1.1, -1.4).add(objetivo));
    irAVista("3d");
  }

  // ---------- Botones ----------
  const exag = { valor: 1.5 };
  mundo.scale.y = exag.valor;
  raiz.querySelectorAll("[data-vista]").forEach((b) => b.addEventListener("click", () => { parar(); irAVista(b.dataset.vista); }));
  const botonGiro = raiz.querySelector("[data-girar]");
  function actualizarBoton() {
    if (botonGiro) { botonGiro.setAttribute("aria-pressed", String(controles.autoRotate)); botonGiro.textContent = controles.autoRotate ? "PARAR GIRO" : "GIRAR"; }
  }
  if (botonGiro) botonGiro.addEventListener("click", () => { controles.autoRotate = !controles.autoRotate; actualizarBoton(); });
  actualizarBoton();
  const botonRelieve = raiz.querySelector("[data-relieve]");
  if (botonRelieve) botonRelieve.addEventListener("click", () => {
    exag.valor = exag.valor === 1 ? 1.5 : exag.valor === 1.5 ? 2.5 : 1;
    botonRelieve.textContent = `RELIEVE ×${String(exag.valor).replace(".", ",")}`;
    exag.objetivo = exag.valor;
  });
  const botonPantalla = raiz.querySelector("[data-pantalla]");
  if (botonPantalla) {
    if (!raiz.requestFullscreen) botonPantalla.hidden = true;
    botonPantalla.addEventListener("click", () => {
      if (document.fullscreenElement) document.exitFullscreen();
      else raiz.requestFullscreen().catch(() => {});
    });
  }

  // ---------- Lectura de coordenadas al pasar el ratón ----------
  const raycaster = new THREE.Raycaster();
  const puntero = new THREE.Vector2();
  let pendienteLectura = false;
  renderer.domElement.addEventListener("pointermove", (e) => {
    const r = renderer.domElement.getBoundingClientRect();
    puntero.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    pendienteLectura = true;
  });
  const M_LAT = 110574, M_LON = 111320 * Math.cos((info.centro.lat * Math.PI) / 180);
  function actualizarLectura() {
    if (!pendienteLectura || !lectura) return;
    pendienteLectura = false;
    raycaster.setFromCamera(puntero, camara);
    const hit = raycaster.intersectObject(terreno)[0];
    if (!hit) return;
    const x = hit.point.x, y = -hit.point.z;
    const lat = info.centro.lat + y / M_LAT, lon = info.centro.lon + x / M_LON;
    const alt = Math.round(info.zmin + altura(x, y));
    lectura.textContent = `ALT ${alt} m · ${Math.abs(lat).toFixed(5)}°N ${Math.abs(lon).toFixed(5)}°W`;
  }

  // ---------- Bucle ----------
  const v = new THREE.Vector3();
  function redimensionar() {
    const w = lienzo.clientWidth, h = lienzo.clientHeight;
    if (lienzo.width !== Math.floor(w * renderer.getPixelRatio()) || lienzo.height !== Math.floor(h * renderer.getPixelRatio())) {
      renderer.setSize(w, h, false);
      camara.aspect = w / h;
      camara.updateProjectionMatrix();
    }
  }
  let visible = true;
  if ("IntersectionObserver" in window) new IntersectionObserver((e) => { visible = e[0].isIntersecting; }).observe(raiz);

  function bucle(ahora) {
    requestAnimationFrame(bucle);
    if (!visible) return;
    redimensionar();
    if (animVista) {
      const t = Math.min(1, (ahora - animVista.t0) / 1600);
      const s = 1 - Math.pow(1 - t, 3);
      camara.position.lerpVectors(animVista.desde, animVista.hasta, s);
      controles.target.lerpVectors(animVista.objDesde, objetivo, s);
      if (t >= 1) animVista = null;
    }
    if (exag.objetivo && Math.abs(mundo.scale.y - exag.objetivo) > 0.005) mundo.scale.y += (exag.objetivo - mundo.scale.y) * 0.12;
    controles.update();
    const pulso = 1 + Math.sin(ahora / 400) * 0.18;
    const ancho = lienzo.clientWidth, alto = lienzo.clientHeight;
    marcadores.forEach(({ cima, anillo, etiqueta }) => {
      if (!reducirMovimiento) anillo.scale.setScalar(pulso);
      cima.getWorldPosition(v);
      v.project(camara);
      const fuera = v.z > 1 || v.x < -1.2 || v.x > 1.2 || v.y < -1.2 || v.y > 1.2;
      etiqueta.style.opacity = fuera ? "0" : "1";
      // Se mantiene la etiqueta dentro del recuadro aunque el punto esté cerca del borde.
      const mitad = (etiqueta.offsetWidth || 0) / 2 + 6;
      const px = Math.min(Math.max(((v.x + 1) / 2) * ancho, mitad), ancho - mitad);
      etiqueta.style.transform = `translate(-50%, -100%) translate(${px}px, ${((1 - v.y) / 2) * alto}px)`;
    });
    if (brujula) {
      const az = Math.atan2(camara.position.x - controles.target.x, camara.position.z - controles.target.z);
      brujula.style.transform = `rotate(${az}rad)`;
    }
    actualizarLectura();
    renderer.render(escena, camara);
  }
  requestAnimationFrame(bucle);
  if (cargando) cargando.hidden = true;
}

// ---------- Utilidades ----------
function cargarImagen(src) {
  return new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = ko; i.src = src; });
}

// Oscurece lo que queda fuera del campo para que la zona de juego destaque.
function texturaResaltada(imagen, perimetro, W, H) {
  const lado = imagen.naturalWidth;
  const c = document.createElement("canvas");
  c.width = c.height = lado;
  const g = c.getContext("2d");
  g.drawImage(imagen, 0, 0);
  const aPx = ([x, y]) => [((x + W / 2) / W) * lado, ((H / 2 - y) / H) * lado];
  g.save();
  g.beginPath();
  g.rect(0, 0, lado, lado);
  perimetro.forEach((p, i) => { const [px, py] = aPx(p); i ? g.lineTo(px, py) : g.moveTo(px, py); });
  g.closePath();
  g.fillStyle = "rgba(6, 9, 6, 0.48)";
  g.fill("evenodd");
  g.restore();
  return c;
}

function densificar(lista, paso) {
  const out = [];
  for (let i = 0; i < lista.length; i++) {
    const a = lista[i], b = lista[(i + 1) % lista.length];
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const n = Math.max(1, Math.ceil(d / paso));
    for (let k = 0; k < n; k++) out.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]);
  }
  return out;
}

function centroide(lista) {
  let a = 0, cx = 0, cy = 0;
  for (let i = 0; i < lista.length; i++) {
    const [x0, y0] = lista[i], [x1, y1] = lista[(i + 1) % lista.length];
    const f = x0 * y1 - x1 * y0;
    a += f; cx += (x0 + x1) * f; cy += (y0 + y1) * f;
  }
  a *= 0.5;
  return [cx / (6 * a), cy / (6 * a)];
}

// Valla translúcida que sigue el perímetro.
function muro(puntos, alto) {
  const pos = [], uv = [];
  const n = puntos.length;
  for (let i = 0; i <= n; i++) {
    const p = puntos[i % n];
    pos.push(p.x, p.y, p.z, p.x, p.y + alto, p.z);
    uv.push(i / n, 0, i / n, 1);
  }
  const idx = [];
  for (let i = 0; i < n; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { color: { value: new THREE.Color("#e8d27a") } },
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
    fragmentShader: "uniform vec3 color; varying vec2 vUv; void main(){ gl_FragColor = vec4(color, 0.45 * (1.0 - vUv.y)); }",
  });
  return new THREE.Mesh(g, mat);
}

// Paredes laterales para que el terreno parezca una maqueta recortada.
function laterales(W, H, nc, nr, alturas) {
  const base = -18;
  const pos = [];
  const idx = [];
  const lado = (puntos) => {
    const inicio = pos.length / 3;
    puntos.forEach(([x, z, y]) => pos.push(x, y, z, x, base, z));
    for (let i = 0; i < puntos.length - 1; i++) {
      const a = inicio + i * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  };
  const h = (r, c) => alturas[r * nc + c] / 10;
  const X = (c) => -W / 2 + (c / (nc - 1)) * W;
  const Z = (r) => -H / 2 + (r / (nr - 1)) * H;
  lado([...Array(nc).keys()].map((c) => [X(c), Z(0), h(0, c)]));
  lado([...Array(nc).keys()].map((c) => [X(c), Z(nr - 1), h(nr - 1, c)]));
  lado([...Array(nr).keys()].map((r) => [X(0), Z(r), h(r, 0)]));
  lado([...Array(nr).keys()].map((r) => [X(nc - 1), Z(r), h(r, nc - 1)]));
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: "#3a3122", roughness: 1, side: THREE.DoubleSide }));
}
