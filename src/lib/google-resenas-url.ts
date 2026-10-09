// Validación PURA (sin dependencias) del enlace de reseñas de Google Maps del médico
// (`medicos.google_resenas_url`, Día 26C). Espeja el CHECK de la base de datos
// (contrato §2.1): `null` o URL `https://` con host en allowlist y <= 500 caracteres.
// El campo es OPCIONAL: vacío => `null`, nunca es error.
// Archivo escrito solo con sintaxis que Node puede ejecutar quitando tipos, para poder
// probarlo con `node src/lib/google-resenas-url.test.mjs` sin dependencias nuevas.

export const GOOGLE_RESENAS_URL_MAX = 500;

// Regla ÚNICA (contrato Día 26C §7.6, espejada en el CHECK de la BD).
// host => prefijo de ruta obligatorio (null = cualquier ruta). `google.com/url?...` queda bloqueado.
const HOSTS_PERMITIDOS: Record<string, string | null> = {
  "www.google.com": "/maps",
  "google.com": "/maps",
  "goo.gl": "/maps",
  "maps.google.com": null,
  "maps.app.goo.gl": null,
  "g.page": null,
  "search.google.com": "/local",
};

export type ResultadoEnlaceGoogle =
  { ok: true; valor: string | null } | { ok: false; error: string };

const MENSAJE_FORMATO =
  "El enlace no es válido. Usa el que te da Google Maps con «Compartir → Copiar enlace» " +
  "(empieza con https://maps.app.goo.gl/ o https://www.google.com/maps/…).";

function tieneBlancoOControl(texto: string): boolean {
  for (let i = 0; i < texto.length; i++) {
    const c = texto.charCodeAt(i);
    if (c <= 0x20 || c === 0x7f || c === 0xa0 || c === 0x2028 || c === 0x2029 || c === 0xfeff)
      return true;
  }
  return false;
}

export function validarEnlaceGoogleResenas(
  entrada: string | null | undefined,
): ResultadoEnlaceGoogle {
  const texto = (entrada ?? "").trim();
  if (texto === "") return { ok: true, valor: null }; // opcional: vaciar = null

  if (texto.length > GOOGLE_RESENAS_URL_MAX) {
    return {
      ok: false,
      error: `El enlace es demasiado largo (máximo ${GOOGLE_RESENAS_URL_MAX} caracteres).`,
    };
  }
  // Sin espacios ni caracteres de control dentro del enlace.
  if (tieneBlancoOControl(texto) || texto.includes("\\")) {
    return {
      ok: false,
      error: "El enlace no puede contener espacios. Cópialo de nuevo desde Google Maps.",
    };
  }
  // Solo https (rechaza http:, javascript:, data:, etc.). Se exige en minúsculas, igual que el CHECK.
  if (!texto.startsWith("https://")) {
    return { ok: false, error: "El enlace debe empezar con https://" };
  }

  let url: URL;
  try {
    url = new URL(texto);
  } catch {
    return { ok: false, error: MENSAJE_FORMATO };
  }
  if (url.protocol !== "https:" || url.username !== "" || url.password !== "" || url.port !== "") {
    return { ok: false, error: MENSAJE_FORMATO };
  }
  // La autoridad del texto original (hasta / ? #) no puede traer `@` (userinfo) ni puerto, y debe
  // coincidir con el host normalizado por URL (rechaza puntos finales, dígitos raros, etc.).
  // El host se compara sin distinguir mayúsculas (igual que el CHECK `~*` de la BD).
  const autoridad = texto.slice("https://".length).split(/[/?#]/)[0];
  if (autoridad.includes("@") || autoridad.toLowerCase() !== url.host) {
    return { ok: false, error: MENSAJE_FORMATO };
  }
  if (!Object.prototype.hasOwnProperty.call(HOSTS_PERMITIDOS, url.hostname)) {
    return {
      ok: false,
      error: "Solo se aceptan enlaces de Google Maps (maps.app.goo.gl, google.com/maps, g.page…).",
    };
  }
  const prefijo = HOSTS_PERMITIDOS[url.hostname];
  if (prefijo !== null) {
    // Se exige el prefijo tanto en la ruta tal como se escribió como en la normalizada por URL
    // (evita `/maps/../url?...`). Frontera de segmento: `/maps` o `/maps/...`, no `/mapsevil`.
    const rutaCruda = texto.slice("https://".length + autoridad.length).split(/[?#]/)[0];
    for (const ruta of [rutaCruda, url.pathname]) {
      const r = ruta.toLowerCase();
      if (r !== prefijo && !r.startsWith(`${prefijo}/`)) {
        return {
          ok: false,
          error:
            "Solo se aceptan enlaces de Google Maps (maps.app.goo.gl, google.com/maps, g.page…).",
        };
      }
    }
  }
  return { ok: true, valor: texto };
}
