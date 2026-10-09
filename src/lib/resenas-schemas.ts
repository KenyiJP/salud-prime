// Tipos y utilidades PURAS del panel de reputación (Día 26C).
// La tabla `resenas`, la vista `resenas_reputacion_resumen` y la RPC `resena_moderar` aún no
// están en types.ts generado por Lovable: se definen aquí a mano (contrato docs/dia26c §2.2–2.4).

export const ESTADOS_RESENA = [
  "solicitada",
  "calificada",
  "esperando_consentimiento",
  "pendiente_aprobacion",
  "aprobada",
  "rechazada",
  "privada",
  "expirada",
] as const;
export type EstadoResena = (typeof ESTADOS_RESENA)[number];

/** Columnas que lee el panel. A propósito NO se pide `telefono` (dato personal innecesario en la UI). */
export const COLUMNAS_RESENA =
  "id, cita_id, estado, calificacion, comentario, consentimiento_publicar, leida_por_medico, respondida_en, moderada_en, solicitada_en";

export type ResenaFila = {
  id: string;
  cita_id: string;
  estado: EstadoResena;
  calificacion: number | null;
  comentario: string | null;
  consentimiento_publicar: boolean | null;
  leida_por_medico: boolean;
  respondida_en: string | null;
  moderada_en: string | null;
  solicitada_en: string | null;
};

export type ResumenReputacion = {
  medico_id: string;
  total_solicitadas: number;
  total_respondidas: number;
  tasa_respuesta: number | null;
  promedio_calificacion: number | null;
  pendientes_aprobacion: number;
  privadas_sin_leer: number;
  ultimos_30d_promedio: number | null;
};

export type PestanaResena = "por_aprobar" | "privadas" | "aprobadas";

export const ESTADO_POR_PESTANA: Record<PestanaResena, EstadoResena> = {
  por_aprobar: "pendiente_aprobacion",
  privadas: "privada",
  aprobadas: "aprobada",
};

/** Respuesta de `resena_moderar` (contrato §2.3: rechazos como dato, nunca RAISE). */
export type RespuestaModerar = {
  ok: boolean;
  codigo?: string;
  estado?: string;
  /** Solo al aprobar con éxito: si la web del médico ya está publicada. */
  landing_publicada?: boolean;
};

/** Convierte lo que devuelva PostgREST (number | string numérico | null) en number | null. */
export function aNumeroONull(valor: unknown): number | null {
  if (valor === null || valor === undefined || valor === "") return null;
  const n = typeof valor === "number" ? valor : Number(valor);
  return Number.isFinite(n) ? n : null;
}

/** Tasa de respuesta en % calculada en cliente (evita ambigüedad fracción/porcentaje de la vista). */
export function calcularTasaRespuesta(solicitadas: number, respondidas: number): number | null {
  if (!Number.isFinite(solicitadas) || solicitadas <= 0) return null;
  const pct = (Math.max(0, respondidas) / solicitadas) * 100;
  return Math.min(100, Math.round(pct * 10) / 10);
}

export function normalizarResumen(
  fila: Record<string, unknown> | null | undefined,
): ResumenReputacion | null {
  if (!fila) return null;
  return {
    medico_id: String(fila.medico_id ?? ""),
    total_solicitadas: aNumeroONull(fila.total_solicitadas) ?? 0,
    total_respondidas: aNumeroONull(fila.total_respondidas) ?? 0,
    tasa_respuesta: aNumeroONull(fila.tasa_respuesta),
    promedio_calificacion: aNumeroONull(fila.promedio_calificacion),
    pendientes_aprobacion: aNumeroONull(fila.pendientes_aprobacion) ?? 0,
    privadas_sin_leer: aNumeroONull(fila.privadas_sin_leer) ?? 0,
    ultimos_30d_promedio: aNumeroONull(fila.ultimos_30d_promedio),
  };
}

/**
 * Error cuyo mensaje YA es apto para mostrarse al usuario (español, sin detalles técnicos).
 * Cualquier otro error (PostgREST, red, etc.) se registra con console.error y se muestra genérico.
 */
export class ErrorUsuario extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = "ErrorUsuario";
  }
}

export const MENSAJE_GENERICO = "Ocurrió un error inesperado. Inténtalo de nuevo.";

/** Texto seguro para toasts/alertas: nunca devuelve `error.message` crudo de terceros. */
export function mensajeParaUsuario(e: unknown, respaldo: string = MENSAJE_GENERICO): string {
  return e instanceof ErrorUsuario ? e.message : respaldo;
}

export const MENSAJE_SIN_LANDING =
  "Primero configura tu página web pública para publicar testimonios";

/** Mensaje en español para un `codigo` de rechazo de `resena_moderar` (contrato §7.2). */
export function mensajeRechazoModerar(codigo: string | undefined): string {
  switch (codigo) {
    case "sin_autenticacion":
      return "Tu sesión expiró. Vuelve a iniciar sesión.";
    case "resena_no_encontrada":
      return "No encontramos esa reseña. Recarga la página.";
    case "sin_estado_esperado":
      return "Esa reseña ya no está pendiente de aprobación. Recarga la página.";
    case "sin_permiso":
      return "No tienes permiso para moderar esta reseña.";
    case "sin_landing":
      return `${MENSAJE_SIN_LANDING}.`;
    case "sin_consentimiento":
      return "El paciente no dio su consentimiento para publicar.";
    default:
      return "No se pudo moderar la reseña. Inténtalo de nuevo.";
  }
}

/** Mensaje en español para un `codigo` de rechazo de `resena_marcar_leida` (contrato §7.1). */
export function mensajeRechazoMarcarLeida(codigo: string | undefined): string {
  switch (codigo) {
    case "sin_autenticacion":
      return "Tu sesión expiró. Vuelve a iniciar sesión.";
    case "resena_no_encontrada":
      return "No encontramos esa reseña. Recarga la página.";
    case "sin_permiso":
      return "No tienes permiso para modificar esta reseña.";
    default:
      return "No se pudo actualizar la reseña. Inténtalo de nuevo.";
  }
}

/** Respuesta de `resena_marcar_leida` (contrato §7.1). */
export type RespuestaMarcarLeida = {
  ok: boolean;
  codigo?: string;
  resena_id?: string;
  leida?: boolean;
};
