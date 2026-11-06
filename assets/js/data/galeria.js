/**
 * GALERIA.JS (datos) — archivo fotográfico por año y operación.
 *
 * CÓMO AÑADIR FOTOS REALES (pasos a seguir):
 * 1. Guarda las imágenes dentro de la carpeta assets/galeria/ (créala si no
 *    existe). Nómbralas de forma clara, por ejemplo:
 *      assets/galeria/2026-operacion-amanecer-01.jpg
 *      assets/galeria/2026-operacion-amanecer-02.jpg
 *    (año + nombre de la operación + número, todo en minúsculas y sin espacios)
 * 2. Añade aquí abajo un bloque como el del ejemplo comentado, con una
 *    entrada por cada foto, usando la ruta real del archivo y una
 *    descripción corta y honesta de lo que se ve en la imagen (eso es el
 *    "alt", lo que lee un lector de pantalla si la persona no puede ver la foto).
 * 3. No hace falta tocar galeria.html ni el código: la página se actualiza
 *    sola a partir de este archivo.
 *
 * Mientras no haya fotos reales, este archivo se queda vacío (GALERIA = [])
 * y la página muestra un aviso en vez de fotos inventadas o de relleno.
 *
 * Ejemplo (bórralo o complétalo con datos reales cuando tengáis fotos):
 *
 * const GALERIA = [
 *   {
 *     anio: 2026,
 *     albumes: [
 *       {
 *         operacion: "Operación Amanecer",
 *         fotos: [
 *           { src: "assets/galeria/2026-operacion-amanecer-01.jpg", alt: "Grupo de operadores en el punto de encuentro antes de empezar" },
 *           { src: "assets/galeria/2026-operacion-amanecer-02.jpg", alt: "Vista del campo desde la colina norte" }
 *         ]
 *       }
 *     ]
 *   }
 * ];
 */

const GALERIA = [];
