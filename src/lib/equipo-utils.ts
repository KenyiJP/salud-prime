// Lógica pura de la gestión de equipo (Día 29, Etapa 3). Sin red ni React para
// poder probarla con `node src/lib/equipo-utils.test.mjs` (Node >= 22.18).

export type RolEquipo = "recepcion" | "enfermeria" | "facturacion" | "community_manager";

export const ROLES_INVITABLES: ReadonlyArray<{ valor: RolEquipo; etiqueta: string; ayuda: string }> = [
  { valor: "recepcion", etiqueta: "Recepción", ayuda: "Agenda citas y registra pacientes. No ve historias clínicas." },
  { valor: "enfermeria", etiqueta: "Enfermería", ayuda: "Ve la historia clínica y registra signos vitales." },
  { valor: "facturacion", etiqueta: "Facturación", ayuda: "Ve pagos, citas y datos de facturación del paciente." },
  { valor: "community_manager", etiqueta: "Community manager", ayuda: "Gestiona marca, landing y reseñas. Sin datos clínicos." },
];

export function etiquetaRol(rol: string): string {
  const mapa: Record<string, string> = {
    founder: "Titular",
    medico: "Médico",
    recepcion: "Recepción",
    enfermeria: "Enfermería",
    facturacion: "Facturación",
    community_manager: "Community manager",
    asistente: "Asistente (sin acceso)",
  };
  return mapa[rol] ?? rol;
}

/** Mensajes fijos para cada código de rechazo de las RPC `equipo_*`. */
export const MENSAJE_EQUIPO: Record<string, string> = {
  no_autorizado: "No tienes permiso para gestionar el equipo de este consultorio.",
  multiples_consultorios: "Administras más de un consultorio. Elige cuál antes de continuar.",
  rol_no_permitido: "Ese rol no se puede asignar.",
  limite_plan: "Tu plan alcanzó el máximo de usuarios. Cambia de plan o revoca un acceso.",
  demasiadas_invitaciones: "Hay demasiadas invitaciones vigentes. Revoca alguna e inténtalo de nuevo.",
  invitacion_invalida: "El enlace no es válido, venció o ya fue usado. Pide una invitación nueva.",
  ya_miembro: "Esta cuenta ya pertenece al consultorio.",
  ya_pertenece_a_otro_consultorio: "Esta cuenta ya pertenece a otro consultorio. Usa otro correo.",
  miembro_no_encontrado: "No se encontró al miembro.",
  no_puede_modificarse: "El titular no se puede modificar desde aquí.",
  sin_cambios: "El miembro ya tiene ese rol.",
  ya_usada: "La invitación ya fue usada.",
  correo_requerido: "Escribe el correo de la persona a invitar.",
  correo_invalido: "El correo no es válido. Revísalo e inténtalo de nuevo.",
  ya_invitado: "Ya hay una invitación vigente para ese correo. Revócala para crear otra.",
  correo_no_verificado: "Debes confirmar tu correo antes de aceptar la invitación. Revisa tu bandeja de entrada y vuelve a abrir el enlace.",
  correo_no_coincide: "Esta invitación es para otro correo. Cierra sesión e inicia con el correo al que fue enviada.",
  demasiados_intentos: "Demasiados intentos. Espera un rato e inténtalo de nuevo.",
};

export function mensajeEquipo(codigo: string | undefined | null): string {
  return (codigo && MENSAJE_EQUIPO[codigo]) || "No se pudo completar la acción. Inténtalo de nuevo.";
}

/** Token de invitación: 64 hex (32 bytes). Se valida antes de tocar la red. */
export function tokenValido(valor: unknown): valor is string {
  return typeof valor === "string" && /^[0-9a-f]{64}$/.test(valor.trim());
}

/**
 * El token va en el FRAGMENTO (`#token=`), no en la query: el fragmento no se envía
 * al servidor ni en la cabecera Referer, y no queda en logs de red/CDN.
 */
export function enlaceInvitacion(origen: string, token: string): string {
  return `${origen.replace(/\/+$/, "")}/unirse#token=${encodeURIComponent(token)}`;
}

/** Lee el token de `location.hash` (`#token=...`). Devuelve null si no es válido. */
export function tokenDeHash(hash: string): string | null {
  const m = /^#?token=([^&]+)/.exec(hash);
  if (!m) return null;
  try {
    const t = decodeURIComponent(m[1]).trim().toLowerCase();
    return tokenValido(t) ? t : null;
  } catch {
    return null;
  }
}

export function mensajeInvitacion(opts: {
  enlace: string;
  rol: string;
  consultorio?: string | null;
  nombre?: string | null;
}): string {
  const saludo = opts.nombre?.trim() ? `Hola ${opts.nombre.trim()}` : "Hola";
  const donde = opts.consultorio?.trim() ? ` al consultorio ${opts.consultorio.trim()}` : " a mi consultorio";
  return (
    `${saludo}, te invito a unirte${donde} en MediSuite con el rol de ${etiquetaRol(opts.rol)}.\n\n` +
    `Abre este enlace (vale 72 horas y se puede usar una sola vez):\n${opts.enlace}`
  );
}

/**
 * Normaliza a E.164 sin "+". Un celular peruano de 9 dígitos que empieza por 9 recibe
 * el prefijo 51 (evita mandar el token a un número de otro país). Devuelve null si
 * no es un número plausible (10–15 dígitos).
 */
export function normalizarTelefono(telefono: string | null | undefined): string | null {
  let d = (telefono ?? "").replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  else if (d.length === 10 && d.startsWith("0")) d = d.slice(1);
  if (d.length === 9 && d.startsWith("9")) d = `51${d}`;
  return d.length >= 10 && d.length <= 15 ? d : null;
}

export function enlaceWhatsapp(mensaje: string, telefono?: string | null): string {
  const num = normalizarTelefono(telefono);
  const base = num ? `https://wa.me/${num}` : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(mensaje)}`;
}

/** Correo normalizado como lo espera el backend: recortado y en minúsculas. */
export function normalizarCorreo(valor: string): string {
  return valor.trim().toLowerCase();
}

export function esCorreo(valor: string): boolean {
  // Un solo destinatario y forma de dominio válida; sin separadores ni saltos de
  // línea que en un `mailto:` permitirían añadir destinatarios u otras cabeceras.
  return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/.test(valor.trim());
}

/** `mailto:` — el correo sale desde el programa de correo del propio médico. */
export function enlaceMailto(opts: { para: string; asunto: string; cuerpo: string }): string {
  return `mailto:${encodeURIComponent(opts.para.trim()).replace(/%40/g, "@")}?subject=${encodeURIComponent(
    opts.asunto,
  )}&body=${encodeURIComponent(opts.cuerpo)}`;
}

export type EstadoInvitacion = "vigente" | "usada" | "revocada" | "vencida";

export function estadoInvitacion(
  i: { usada_en: string | null; revocada_en: string | null; expira_en: string },
  ahora: Date = new Date(),
): EstadoInvitacion {
  if (i.usada_en) return "usada";
  if (i.revocada_en) return "revocada";
  return new Date(i.expira_en).getTime() > ahora.getTime() ? "vigente" : "vencida";
}
