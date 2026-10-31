// F1 (Día 29D, Etapa 7): alcance por cuenta de las claves de TanStack Query.
//
// Las consultas con datos de pacientes, citas, cobranza, etc. llevan el `user.id` como primer
// segmento de su clave. Así, aunque una caché sobreviviera a un cambio de sesión (token vencido,
// otra cuenta en el mismo equipo), nunca se serviría a otra cuenta. Además `auth-context.tsx`
// vacía la caché en cada cambio de identidad.
//
// Único punto de construcción de claves con alcance: no repetir esta lógica en cada consulta.

/** Segmento usado mientras no hay sesión; no puede coincidir con un UUID de usuario. */
export const SIN_SESION = "__sin_sesion__";

/** Clave con alcance: `[userId, ...partes]`. Sin usuario usa `SIN_SESION`. No muta sus argumentos. */
export function claveConAlcance<const P extends readonly unknown[]>(
  userId: string | null | undefined,
  ...partes: P
): [string, ...P] {
  const alcance = typeof userId === "string" && userId.length > 0 ? userId : SIN_SESION;
  return [alcance, ...partes];
}

// Usuario de la sesión vigente. Lo fijan `auth-context.tsx` (cada cambio de sesión) y
// `requireSession` (antes de los loaders de ruta). Solo se escribe en el navegador: las rutas del
// panel son `ssr: false`, así que ningún estado de usuario se comparte entre peticiones del servidor.
let usuarioActivo: string | null = null;

export function fijarUsuarioActivo(userId: string | null | undefined): void {
  usuarioActivo = typeof userId === "string" && userId.length > 0 ? userId : null;
}

export function usuarioActivoId(): string | null {
  return usuarioActivo;
}

/**
 * Clave con alcance del usuario activo. Se usa en las fábricas de consultas y en sus
 * invalidaciones: ambas deben pasar por aquí para que el prefijo siempre coincida.
 */
export function claveActiva<const P extends readonly unknown[]>(...partes: P): [string, ...P] {
  return claveConAlcance(usuarioActivo, ...partes);
}
