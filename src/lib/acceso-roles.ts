// Acceso por rol (Día 29, Etapa 3). Fuente única para guards, sidebar y ruta
// inicial. Es una ayuda de interfaz: la barrera real es la RLS (lista blanca,
// Día 29B). Sin React ni red para poder probarlo con
// `node src/lib/acceso-roles.test.mjs` (Node >= 22.18).

export type Rol =
  | "founder"
  | "medico"
  | "community_manager"
  | "recepcion"
  | "enfermeria"
  | "facturacion"
  | "asistente";

const TITULAR: readonly Rol[] = ["founder", "medico"];

/** Qué roles pueden abrir cada ruta del panel. Una ruta ausente solo la ve el titular. */
export const ACCESO_RUTAS: Record<string, readonly Rol[]> = {
  // `/`, `/calendario` y `/fichas` leen `pacientes`/`citas` con escritura:
  // enfermería y facturación tienen su propia pantalla (ver abajo).
  "/": [...TITULAR],
  "/calendario": [...TITULAR, "recepcion"],
  "/fichas": [...TITULAR, "recepcion"],
  "/horarios": [...TITULAR, "recepcion"],
  "/enfermeria": [...TITULAR, "enfermeria"],
  "/cobranza": [...TITULAR, "facturacion"],
  "/configuracion/equipo": [...TITULAR],
  "/marca": [...TITULAR, "community_manager"],
  "/reputacion": [...TITULAR, "community_manager"],
  "/perfil-consultorio": [...TITULAR, "community_manager"],
};

export function puedeVerRuta(rol: Rol | null, ruta: string): boolean {
  if (!rol) return false;
  const lista = ACCESO_RUTAS[ruta];
  return lista ? lista.includes(rol) : TITULAR.includes(rol);
}

/** Pantalla a la que aterriza cada rol tras iniciar sesión. */
export function rutaInicialPorRol(rol: Rol | null): string {
  switch (rol) {
    case "community_manager":
      return "/perfil-consultorio";
    case "recepcion":
      return "/calendario";
    case "enfermeria":
      return "/enfermeria";
    case "facturacion":
      return "/cobranza";
    default:
      return "/";
  }
}

/** Dónde mandar a quien abrió una ruta que su rol no puede ver. */
export function rutaAlternativa(rol: Rol | null): string {
  return rutaInicialPorRol(rol);
}
