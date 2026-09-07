/**
 * Base pública para los enlaces que van dentro del código QR de una orden.
 *
 * En el navegador se usa el origen actual, salvo que el proyecto declare una
 * URL pública (`VITE_PUBLIC_URL` o `VITE_APP_URL`): así el QR impreso desde el
 * entorno de desarrollo apunta igual al sitio publicado y no a `localhost`.
 */
export function baseUrlPublica(): string {
  const env = import.meta.env as Record<string, string | undefined>;
  const configurada = env["VITE_PUBLIC_URL"] ?? env["VITE_APP_URL"];
  if (configurada && /^https?:\/\//.test(configurada)) {
    return configurada.replace(/\/+$/, "");
  }
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

export function urlOrdenPublica(ruta: string, token: string): string {
  const base = baseUrlPublica();
  if (!base) return "";
  return `${base}${ruta}?acceso=${encodeURIComponent(token)}`;
}
