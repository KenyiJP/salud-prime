/**
 * Token de invitación pendiente de canjear (Día 29, Etapa 3).
 *
 * Vive en `localStorage` con caducidad de 72 h (la misma vida del token en la base):
 * la confirmación del correo suele abrir una pestaña NUEVA, y `sessionStorage` no se
 * comparte entre pestañas. No se envía a ningún servidor ni se registra en consola. Se
 * borra al canjear, al descartarlo o al caducar.
 */
import { tokenValido } from "./equipo-utils";

const CLAVE = "medisuite.invitacion_pendiente";
const VIGENCIA_MS = 72 * 60 * 60 * 1000;

type Guardado = { token: string; hasta: number };

export function guardarInvitacionPendiente(token: string): void {
  const t = token.trim().toLowerCase();
  if (!tokenValido(t)) return;
  try {
    const valor: Guardado = { token: t, hasta: Date.now() + VIGENCIA_MS };
    window.localStorage.setItem(CLAVE, JSON.stringify(valor));
  } catch {
    /* almacenamiento bloqueado: el usuario deberá reabrir el enlace */
  }
}

export function leerInvitacionPendiente(): string | null {
  try {
    const crudo = window.localStorage.getItem(CLAVE);
    if (!crudo) return null;
    const v = JSON.parse(crudo) as Partial<Guardado>;
    if (typeof v.token !== "string" || typeof v.hasta !== "number" || v.hasta < Date.now() || !tokenValido(v.token)) {
      window.localStorage.removeItem(CLAVE);
      return null;
    }
    return v.token;
  } catch {
    return null;
  }
}

export function borrarInvitacionPendiente(): void {
  try {
    window.localStorage.removeItem(CLAVE);
  } catch {
    /* nada que borrar */
  }
}
