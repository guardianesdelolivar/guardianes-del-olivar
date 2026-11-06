# Auditoría y mejoras — Guardianes del Olivar

Fecha: octubre 2026
Alcance: revisión completa del proyecto en `Operacion-Airsoft-Web` (sitio estático HTML/CSS/JS, sin backend propio, con Google Sheets + Apps Script como "base de datos" para plazas/comentarios/inscripciones, y Supabase para login/perfil de usuario).

## Aviso honesto sobre herramientas

Este trabajo se ha hecho inspeccionando y editando el código directamente. **No** he tenido disponible en esta sesión: un servidor local para arrancar el proyecto, Playwright/Chrome DevTools automatizado, ni Lighthouse. Por tanto:
- No hay capturas de pantalla "antes/después" ni puntuaciones de Lighthouse en este informe, porque no las he podido generar de verdad y no quiero inventarlas.
- Las correcciones están verificadas leyendo el código (consistencia de datos, HTML válido, selectores coincidentes entre HTML/JS/CSS), no ejecutando la web en un navegador real.
- Te recomiendo, antes de publicar, abrir el sitio en tu navegador (o pedírmelo con el navegador en vivo disponible) y revisar visualmente los cambios, especialmente el lightbox de galería y los nuevos botones de compartir.

## Resumen de los cambios implementados

### 1. Datos ficticios eliminados (hallazgo crítico)
- El contador **"Operadores online"** de la portada generaba un número aleatorio decorativo (entre 190 y 260, variando solo) y lo mostraba como si fuera un dato real. Esto incumplía directamente la norma de no presentar estadísticas ficticias como reales. **Lo he eliminado** y sustituido por **"Operaciones activas"**, que es un recuento real de operaciones no finalizadas (el código ya lo calculaba pero no se mostraba en ningún sitio).

### 2. Estados vacíos cuando no hay próxima operación
- Antes, si no había ninguna operación próxima, "Próxima operación" y "Plazas libres totales" en la portada se quedaban con un guion (—) para siempre, sin explicación.
- Ahora muestran textos claros ("Sin operaciones programadas", "Consulta el calendario") y el botón principal del hero cambia a "CONTACTA CON LA ORGANIZACIÓN" apuntando a la página de contacto en vez de a un calendario vacío.
- La cuenta atrás (`countdown.js`) ya gestionaba bien este caso (lo comprobé, no hacía falta tocarlo): si no hay operación, oculta la cuenta atrás y muestra un aviso.

### 3. Galería: preparada para fotos reales, sin inventar nada
- **Hallazgo importante**: el código de la galería generaba "tiles" decorativos con un degradado de fondo y una etiqueta tipo "2026 · TOMA 01", pero **sin ninguna imagen real** detrás — si alguna vez se añadía un álbum con fotos, se habrían mostrado como fotos reales unos simples rectángulos de color. Lo he rediseñado:
  - Nuevo esquema de datos en `assets/js/data/galeria.js`, con instrucciones dentro del propio archivo de cómo añadir fotos reales (carpeta `assets/galeria/`, convención de nombres, formato exacto del bloque de datos).
  - El renderizado (`galeria-page.js`) ahora pinta `<img>` reales con `loading="lazy"`, gestiona el error si una imagen no carga (muestra "📷 Foto no disponible" en vez de un icono roto del navegador), y añade una **vista ampliada (lightbox)** navegable con ratón, dedo, teclado (flechas y Escape) y con foco accesible.
  - Mientras no haya fotos reales, `GALERIA` sigue vacío y se muestra el aviso "El archivo de operaciones está vacío por ahora", tal y como pediste: ni fotos de internet, ni inventadas.

### 4. SEO técnico
- Añadidos `robots.txt` y `sitemap.xml` (con las URLs reales del sitio).
- Favicon (reutilizando el logo existente) en las 14 páginas.
- Metadatos Open Graph (título, descripción, imagen, URL) en todas las páginas de contenido, reutilizando los textos ya existentes en cada `<meta name="description">` — no he inventado ningún texto nuevo.
- URLs canónicas en todas las páginas. En el dossier de operación (`operacion.html`), la URL canónica y los Open Graph se generan dinámicamente por JS según la operación mostrada (`?op=...`), porque cada operación es contenido distinto.
- `inscripcion.html` y `login.html` marcadas como `noindex` (son páginas de acción/cuenta, no contenido que interese posicionar en buscadores).

### 5. Accesibilidad
- **Contraste**: el color `--c-grey-dim` (usado en etiquetas pequeñas, pie de página, estados vacíos) tenía un contraste real de ~2.85:1 sobre el fondo oscuro, por debajo del mínimo AA (4.5:1 para texto normal). Lo he aclarado a un tono que da ~5.3:1, conservando la estética "apagada" pero legible.
- **Foco visible**: añadido un estilo `:focus-visible` global consistente (contorno verde) para que la navegación por teclado se vea siempre con claridad, también en los días del calendario y los enlaces del menú.
- **`prefers-reduced-motion`**: añadida una regla global que reduce prácticamente a cero la duración de animaciones y transiciones para quien lo tenga activado en su sistema, y oculta el barrido decorativo del hero.
- **Contenido sin JavaScript**: las tarjetas, pasos y demás elementos con la clase `.reveal` dependen de JavaScript para hacerse visibles (animación de aparición al hacer scroll). Si JS está desactivado, antes se quedaban invisibles para siempre. He añadido una salvaguarda `<noscript>` en las 14 páginas que fuerza su visibilidad si no hay JavaScript.
  - **Limitación documentada, no resuelta**: el contenido que se genera dinámicamente por JS (tarjetas de operaciones, calendario, galería, dossier) no tiene un equivalente estático en el HTML. Si alguien navega sin JavaScript, esas secciones seguirán sin aparecer (se quedan en "Cargando…"). Arreglarlo del todo implicaría duplicar ese contenido en HTML estático, lo que iría en contra de la arquitectura actual (una sola fuente de datos en `operaciones.js`). Lo documento como limitación conocida en vez de improvisar una solución a medias.

### 6. Rendimiento
- `loading="lazy"` y `decoding="async"` en imágenes fuera de la primera pantalla (cartel de operación en las tarjetas, foto de "Nosotros", fotos de galería).
- La foto circular del logo en la portada (la primera imagen visible, candidata a ser el elemento más grande de la carga inicial) lleva ahora `fetchpriority="high"` y `width`/`height` explícitos para no generar salto de layout.
- **Pendiente/bloqueado**: no he podido leer las dimensiones reales de los archivos de imagen (`foto 1.png`, `foto 2.jpeg`, `foto 3.png`) porque no tengo acceso a un entorno con Python/herramientas de imagen en esta sesión, así que no he podido añadir `width`/`height` exactos a todas las imágenes para evitar completamente los saltos de layout, ni comprimir/convertir a WebP. Si me subes las fotos a mi carpeta de trabajo en una próxima sesión con herramientas de imagen disponibles, puedo optimizarlas.

### 7. Coherencia legal (pago/confirmación)
- **Hallazgo real**: `aviso-legal.html` decía que el pago se gestionaba "mediante los canales que se indiquen en cada operación" (vago, sugiere varios métodos posibles), mientras que `privacidad.html` e `inscripcion.html` dicen con claridad que el pago es en efectivo, en el campo, el mismo día de la partida, y que la web no procesa pagos.
- Lo he corregido alineando `aviso-legal.html` con lo que ya estaba confirmado y verificado en el resto del sitio (no he inventado ninguna política nueva, solo igualado el texto al procedimiento que ya describíais en otras páginas).
- **Pregunta para confirmar**: ¿el pago en efectivo el mismo día es el procedimiento real para *todas* las operaciones, siempre, sin excepción? Si alguna vez cambia (por ejemplo, una operación especial con pago anticipado), habría que actualizar estos tres textos a la vez.

### 8. Conversión y recorrido del usuario
- En el dossier de cada operación, nuevos botones: **compartir por WhatsApp** (con texto real: nombre, fecha, lugar y enlace), **copiar enlace** (al portapapeles), y **añadir a mi calendario** (descarga un archivo `.ics` estándar con fecha, hora y ubicación reales de esa operación, compatible con Google Calendar, Apple Calendar, Outlook, etc.).
- Nueva sección de **Preguntas frecuentes** en "Cómo funciona", construida *solo* con hechos que ya estaban verificados en otras partes del sitio (cómo se paga, qué llevar, consentimiento de fotos, opción de almuerzo, sección de comentarios) — no he inventado edades mínimas, requisitos ni políticas que no existieran ya.

### 9. Animaciones y microinteracciones
- Entrada progresiva y escalonada del contenido del hero de portada (aparece de arriba abajo con un pequeño desfase, usando `opacity` y `transform` para no afectar al rendimiento).
- Feedback táctil añadido a tarjetas de operación, días del calendario con partida y elementos de galería (pequeño "hundimiento" al pulsar, útil sobre todo en móvil donde no hay hover).
- Todo lo anterior respeta `prefers-reduced-motion` (ver punto 5).
- No he tocado el sistema de aparición al hacer scroll (`reveal` + `IntersectionObserver`), que ya funcionaba bien, más allá de la salvaguarda sin JS.

### 10. Segunda pasada: enlaces, seguridad, táctil, formularios y datos estructurados
- **Enlaces internos**: revisados todos los `href` a páginas propias en las 14 páginas (menú, pie de página, botones). No hay ningún enlace roto apuntando a un archivo que no exista.
- **Seguridad/secretos**: revisado el código en busca de claves privadas, `service_role`, contraseñas o tokens expuestos en el frontend. Solo aparecen las claves que son públicas por diseño (la clave `sb_publishable_...` de Supabase, pensada para usarse en el navegador). No hay ninguna clave secreta filtrada.
- **Objetivos táctiles en móvil**: varios elementos interactivos eran más pequeños del mínimo recomendado de ~44×44px para que un dedo los pulse con comodidad. Ajustados: flechas del calendario (eran 36×36px), botón de menú hamburguesa, botón de cerrar y flechas del lightbox de galería, botones de compartir/copiar/calendario del dossier, y las filas de las preguntas frecuentes.
- **Formularios**: añadidos atributos `autocomplete` e `inputmode` correctos en los formularios de inscripción, contacto y cuenta (nombre, apellidos, email, teléfono, usuario, contraseña nueva/actual, etc.), para que el teclado del móvil y el autorrelleno del navegador funcionen mejor. El campo DNI lleva `autocomplete="off"` porque no es un dato que el navegador deba recordar como autorrelleno genérico.
- **Datos estructurados (JSON-LD)**: añadido un bloque `application/ld+json` de tipo `Event` en el dossier de cada operación (`operacion.html`), generado dinámicamente por JS a partir de los datos reales de `operaciones.js` (nombre, fecha, lugar, precio, estado de disponibilidad, organizador). No incluye valoraciones, asistentes ni ninguna dato que no esté ya verificado en el propio sitio.
- **Consistencia visual**: revisados tamaños de `<h1>` y clases de botones en las 14 páginas. Las páginas de contenido usan el mismo tamaño de título; las tres páginas legales (aviso legal, privacidad, cookies) usan, de forma consistente entre ellas, un tamaño algo menor pensado para texto denso. No se ha encontrado ninguna inconsistencia real que corregir.

### 11. Tercera pasada (prioridad P0): fiabilidad, privacidad y una discrepancia de datos sin resolver por mí

Esta pasada se centró en los puntos que tu mega-prompt marca como P0: inscripciones fiables, contacto que realmente envíe, integridad de datos y privacidad. Son los cambios más importantes de toda la sesión porque afectan a la confianza, no solo al aspecto visual.

- **Discrepancia crítica sin resolver — necesita tu decisión**: el cartel de "LA GUERRA COMIENZA" (`assets/foto 2.jpeg`) dice literalmente **"INSCRIPCIÓN (MAX 20 JUGADORES)"**, pero `assets/js/data/operaciones.js` tiene `plazasTotal: 40` y `maxParticipantes: 40`. Es decir, la web deja inscribirse hasta 40 personas mientras el cartel que compartís dice 20. **No he cambiado ningún valor**, tal y como me pediste: no me corresponde decidir cuál es el correcto. Dime cuál es el aforo real de esa operación y lo dejo coherente en el único sitio que hace falta (`operaciones.js`), que alimenta automáticamente tarjetas, calendario, dossier e inscripción.
- **`contacto.js` no enviaba nada (hallazgo confirmado)**: el formulario de contacto ocultaba la caja y mostraba "MENSAJE RECIBIDO" solo con pulsar el botón, sin enviar el mensaje a ningún sitio. Lo he reescrito para que use EmailJS de verdad (la misma cuenta que ya usáis para los emails de inscripción) y, si no está configurada la plantilla, **muestre honestamente que no se ha podido enviar** en vez de fingir éxito, con alternativa directa de WhatsApp/email. **Pendiente de tu parte**: crear una plantilla nueva en tu cuenta de EmailJS (la misma que ya tienes) con las variables `from_name`, `from_email`, `asunto`, `mensaje`, y pegarme o pegar tú mismo el ID de plantilla en la constante `CONTACTO_TEMPLATE_ID` de `assets/js/contacto.js`. Hasta entonces, el formulario sigue validando datos y no miente sobre el resultado, pero no reenvía el mensaje automáticamente.
- **Datos personales viajando por GET (hallazgo confirmado y corregido)**: `registrarInscripcion()` en `assets/js/live-count.js` enviaba DNI, teléfono, email, nombre y apellidos como parámetros en la URL (`?action=inscripcion_nueva&dni=...`), lo que los deja expuestos en el historial del navegador y en cualquier log de acceso que registre URLs completas. Lo he cambiado a una petición **POST** con los datos en el cuerpo (formato `application/x-www-form-urlencoded`, que no requiere preflight CORS, así que sigue funcionando igual de simple).
  - **Acción pendiente de tu parte**: tu Apps Script actual solo tiene `doGet(e)`. Para que esta petición POST funcione, necesita también una función `doPost(e)` que haga exactamente lo mismo. Te dejo el cambio exacto a pegar en tu Apps Script (no afecta a nada de lo que ya tienes, solo añade un alias):
    ```javascript
    function doGet(e) { return manejarPeticion(e); }
    function doPost(e) { return manejarPeticion(e); }

    function manejarPeticion(e) {
      // Pega aquí dentro exactamente el cuerpo que ya tenías en tu doGet(e) actual.
      // (la lógica de acciones, el bloqueo con LockService, etc. no cambia nada)
    }
    ```
    Es decir: renombra tu `doGet(e)` actual a `manejarPeticion(e)`, y añade esas dos líneas de `doGet`/`doPost` como alias que llaman a la misma función. Vuelve a desplegar como "Nueva versión" igual que hiciste las veces anteriores. Mientras no hagas este cambio, el registro de inscripciones en la hoja de cálculo fallará silenciosamente (seguirá funcionando el resto: email, contador de plazas, que siguen usando GET porque no llevan datos sensibles).
- **Datos personales en la consola del navegador (hallazgo confirmado y corregido)**: al confirmar una inscripción, `inscripcion.js` volcaba el objeto completo del inscrito (nombre, apellidos, DNI, teléfono, email, observaciones) a `console.info`/`console.log` en varios puntos, visible para cualquiera que abra las herramientas de desarrollador del navegador. Lo he corregido en los tres sitios donde ocurría: ahora solo se registra información no personal (por ejemplo, el identificador de la operación), nunca los datos del operador.
- **Consentimiento de fotos obligatorio para inscribirse (hallazgo confirmado y corregido)**: la casilla de consentimiento para publicar fotos/vídeos tenía el atributo `required` y bloqueaba el envío del formulario si no se marcaba, es decir, convertía la autorización de imagen en una condición para participar. La he separado: ahora es opcional, está marcada como "(Opcional)" en el texto, y el envío del formulario solo exige las casillas de normas y riesgos (que sí son condiciones reales de participación).
- **Inscripción: honestidad sobre qué significa "confirmado" (revisado, limitación real documentada, no resuelta del todo)**: `procesarInscripcion()` sigue generando la referencia y mostrando la pantalla de éxito en el cliente, sin esperar confirmación de ningún servidor, porque el Apps Script que hace de "base de datos" no devuelve un resultado fiable que se pueda usar como condición de éxito/fracaso (es una hoja de cálculo, no una base de datos con validación transaccional). Esto ya estaba documentado como limitación de arquitectura en el propio código (ver comentario al inicio del archivo) y sigue siendo así: la inscripción es una *preinscripción*, tal y como el propio formulario ya le dice al usuario ("por ahora esta inscripción queda registrada como preinscripción"). No he fingido una verificación de servidor que el proyecto actual no tiene forma de hacer sin añadir una base de datos real (lo cual sería un cambio de arquitectura que no me corresponde decidir por iniciativa propia).

## Problemas pendientes y por qué no los he resuelto

- **Pruebas en navegador real**: no he podido abrir la web en Chrome/Playwright durante esta sesión (el navegador en vivo pedía un permiso que no llegó a concederse). Todo lo anterior está verificado por lectura de código, no por ejecución visual. Recomiendo una pasada de comprobación visual en escritorio y Android antes de publicar.
- **Lighthouse / Core Web Vitals reales**: no disponibles en este entorno. No puedo darte cifras de LCP/INP/CLS reales ni de laboratorio.
- **Compresión/optimización de imágenes**: bloqueado por no tener acceso a herramientas de imagen en esta sesión (ver punto 6).
- **Contenido sin JavaScript**: limitación arquitectónica documentada en el punto 5, no resuelta por completo.
- **Dossier de operación sin imagen de cartel**: el dato `imagenCartel` de cada operación se usa en las tarjetas (portada, listado, calendario) pero no se muestra dentro del propio dossier (`operacion.html`). No lo he tocado por prudencia (cambio de maquetación con riesgo de regresión visual), pero es una mejora razonable para una próxima pasada.
- **Zona horaria explícita**: la cuenta atrás y las fechas usan la hora local del navegador de quien visita la web, sin forzar explícitamente `Europe/Madrid`. Para una web dirigida a un grupo de Aragón esto no debería causar problemas reales (la inmensa mayoría de visitantes estará en esa zona horaria), pero lo señalo porque el encargo pedía revisarlo explícitamente.

## Preguntas que necesita confirmar la organización

1. **Urgente**: ¿cuál es el aforo real de "LA GUERRA COMIENZA"? El cartel dice 20 jugadores, los datos de la web dicen 40. Dímelo y lo corrijo en el único sitio que hace falta (ver punto 11).
2. ¿El pago en efectivo el mismo día en el campo es el procedimiento real y único para todas las operaciones? (ver punto 7)
3. Los textos decorativos tipo "THREAT LEVEL: HIGH" o "STATUS: OPERATIONAL" en la franja HUD de la portada son estética táctica, no datos reales — ¿los mantenemos tal cual, o prefieres textos menos "gamer" y más sobrios?
4. Cuando tengas las fotos reales de operaciones, ¿me las puedes subir a una carpeta accesible (o dejarlas en `assets/galeria/` siguiendo la guía que dejé en `assets/js/data/galeria.js`) para incorporarlas?

## Próximos pasos recomendados (por impacto)

1. **Revisión visual real** en escritorio y Android de todo lo tocado hoy, especialmente el lightbox de galería y los nuevos botones de compartir en el dossier.
2. Subir fotos reales a la galería siguiendo la guía dejada en el código.
3. Confirmar las preguntas del apartado anterior.
4. Si en algún momento tienes acceso a herramientas de imagen (o me permites usarlas en otra sesión), optimizar y dimensionar correctamente `foto 1.png`, `foto 2.jpeg` y `foto 3.png`.
5. Considerar mostrar el cartel de la operación también dentro de su propio dossier, no solo en las tarjetas.
6. Subir todos los archivos modificados a GitHub (lista completa más abajo).

## Archivos modificados o creados en esta pasada

Nuevos: `robots.txt`, `sitemap.xml`, `AUDITORIA_Y_MEJORAS.md`.
Modificados: `index.html`, `como-funciona.html`, `operacion.html`, `operaciones.html`, `galeria.html`, `normas.html`, `nosotros.html`, `contacto.html`, `calendario.html`, `aviso-legal.html`, `privacidad.html`, `cookies.html`, `inscripcion.html`, `login.html`, `assets/js/main.js`, `assets/js/home.js`, `assets/js/operacion.js`, `assets/js/cards.js`, `assets/js/galeria-page.js`, `assets/js/data/galeria.js`, `assets/css/styles.css`.

Sube la carpeta completa a GitHub cuando puedas revisarlo todo.

## Cuarta pasada (noviembre 2026): pendientes resueltos

- **Operaciones pasadas se cierran solas**: "LA GUERRA COMIENZA" (17 de octubre) seguía marcada como `abiertas`, así que la web la anunciaba como próxima y dejaba inscribirse. Ahora `operaciones.js` marca como `finalizado` cualquier operación cuya fecha ya haya pasado (según la hora de Madrid). Pasa sola al archivo de "Operaciones finalizadas" y el botón de inscripción se desactiva. El día de la partida sigue apareciendo como activa.
- **Zona horaria explícita**: cuenta atrás, archivo de calendario (.ics) y datos estructurados usan ahora la hora de Madrid (con horario de verano/invierno correcto), no la del navegador de quien visita.
- **Imágenes optimizadas**: versiones web nuevas en `assets/` (`logo.webp` 27 KB, `logo-180.png` para el icono, `cartel-la-guerra-comienza.webp` 138 KB + `.jpg` para compartir, `nosotros-los-javis.webp` 56 KB), todas con `width`/`height`. Antes la web cargaba 2,9 MB en fotos. Los originales `foto 1/2/3` se mantienen en la carpeta (siguen usándose como imagen al compartir en redes).
- **Cartel dentro del dossier**: `operacion.html` muestra el cartel de la operación, ampliable con un toque.
- **Estados vacíos**: si no hay operaciones próximas, la portada y el listado lo dicen claramente (en vez del mensaje de "filtros"), y el botón de la cuenta atrás pasa a "VER OPERACIONES ANTERIORES".

Archivos modificados: las 14 páginas `.html` (rutas de imágenes), `assets/css/styles.css`, `assets/js/cards.js`, `home.js`, `operaciones-page.js`, `countdown.js`, `operacion.js`, `data/operaciones.js`. Nuevos: las 5 imágenes optimizadas.

### Nueva operación: Partida de 24 horas (14 de noviembre)
- Añadida a `operaciones.js` con su cartel (`assets/cartel-partida-24h.webp` / `.jpg`): 08:00 h en el campo, 15 € en efectivo, cada uno trae su comida (se oculta la opción de almuerzo al inscribirse), carpa para dormir en saco (opcional), con un máximo de 30 plazas.
- La web admite ahora operaciones **sin límite de plazas** (`plazasTotal: null`): no se muestra barra de plazas y se indica "Sin límite".
- **Contador de plazas en vivo**: la hoja de Google tiene un único contador, que antes se aplicaba siempre a la primera operación de la lista. Ahora solo se aplica a la operación marcada con `contadorEnVivo: true` (la del 17 de octubre), para que la partida nueva no herede sus inscritos. Si una futura partida necesita límite de plazas, hay que poner el contador de la hoja a cero y mover `contadorEnVivo: true` a esa operación.
- La FAQ de comida ahora explica que depende de cada operación.
