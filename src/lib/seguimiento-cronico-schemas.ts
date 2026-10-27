import { z } from "zod";

export const TIPOS_HITO_SEGUIMIENTO = [
  { valor: "control_medico", etiqueta: "Control médico presencial / teleconsulta" },
  { valor: "laboratorio", etiqueta: "Control de laboratorio / imagenología" },
  { valor: "medicacion", etiqueta: "Control de adherencia a tratamiento" },
] as const;

export type TipoHitoSeguimiento = (typeof TIPOS_HITO_SEGUIMIENTO)[number]["valor"];

export type EstadoHitoSeguimiento = "pendiente" | "notificado" | "completado" | "cancelado";

export const seguimientoPlanSchema = z.object({
  paciente_id: z.string().uuid({ message: "Selecciona un paciente válido." }),
  condicion: z
    .string()
    .trim()
    .min(3, { message: "Indica la condición crónica (mínimo 3 caracteres)." })
    .max(200, { message: "Máximo 200 caracteres." }),
  periodicidad_dias: z.coerce
    .number()
    .int()
    .min(1, { message: "Mínimo 1 día." })
    .max(365, { message: "Máximo 365 días." }),
  proxima_fecha: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Selecciona una fecha válida (AAAA-MM-DD)." }),
  tipo_hito: z.enum(["control_medico", "laboratorio", "medicacion"]).default("control_medico"),
  notas_adherencia: z
    .string()
    .trim()
    .max(240, { message: "Máximo 240 caracteres." })
    .optional()
    .nullable(),
  tipo_consulta_id: z.string().uuid().optional().nullable(),
  atencion_origen_id: z.string().uuid().optional().nullable(),
});

export type SeguimientoPlanInput = z.infer<typeof seguimientoPlanSchema>;

export const MENSAJES_ERROR_SEGUIMIENTO: Record<string, string> = {
  NO_AUTENTICADO: "Tu sesión expiró. Vuelve a iniciar sesión.",
  MEDICO_NO_AUTORIZADO: "Solo el médico tratante puede gestionar planes de seguimiento.",
  PACIENTE_NO_ENCONTRADO: "No se encontró el paciente en este consultorio.",
  CONDICION_INVALIDA: "La condición clínica debe tener entre 3 y 200 caracteres.",
  NOTAS_DEMASIADO_LARGAS: "Las indicaciones del control no pueden superar 240 caracteres.",
  PERIODICIDAD_INVALIDA: "La periodicidad debe estar entre 1 y 365 días.",
  FECHA_INVALIDA: "La fecha del próximo control no puede estar en el pasado.",
  TIPO_HITO_INVALIDO: "El tipo de control seleccionado no es válido.",
  TIPO_CONSULTA_INVALIDO: "El tipo de consulta seleccionado no pertenece a este consultorio.",
  ATENCION_ORIGEN_INVALIDA: "La atención de origen no es válida o fue anulada.",
  SIN_FRANJA_HORARIA_DISPONIBLE:
    "No hay franjas libres ese día en la agenda. Elige otra fecha de control.",
  PLAN_NO_ENCONTRADO: "No se encontró el plan de seguimiento.",
  HITO_NO_ENCONTRADO: "No se encontró el hito de control.",
  HITO_YA_CERRADO: "Este hito ya fue completado o cancelado.",
  ESTADO_HITO_INVALIDO: "Estado de hito no válido.",
};

export function mensajeErrorSeguimiento(codigo?: string | null): string {
  if (codigo && MENSAJES_ERROR_SEGUIMIENTO[codigo]) {
    return MENSAJES_ERROR_SEGUIMIENTO[codigo];
  }
  return "No se pudo procesar la operación de seguimiento. Intenta nuevamente.";
}

/**
 * Extrae una sugerencia de periodicidad (días) y fecha ISO (YYYY-MM-DD) a partir
 * del texto libre `proximo_control` de la atención médica (ej. "En 30 días",
 * "Control en 3 meses", "2 semanas", "2026-11-20").
 */
export function inferirControlDesdeTexto(
  textoProximoControl?: string | null,
  ahora: Date = new Date(),
): { periodicidadDias: number; proximaFechaIso: string } {
  const base = new Date(ahora.getTime());
  const sumarDias = (dias: number): string => {
    const d = new Date(base.getTime());
    d.setDate(d.getDate() + dias);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const limpio = (textoProximoControl ?? "").trim();
  if (!limpio) {
    return { periodicidadDias: 30, proximaFechaIso: sumarDias(30) };
  }

  const matchIso = limpio.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (matchIso) {
    const fecha = new Date(`${matchIso[1]}T12:00:00`);
    const diffDias = Math.max(
      1,
      Math.min(365, Math.round((fecha.getTime() - base.getTime()) / 86_400_000)),
    );
    return { periodicidadDias: diffDias || 30, proximaFechaIso: matchIso[1] };
  }

  const matchCantidad = limpio.match(/(\d{1,3})\s*(d[ií]as?|semanas?|mes(?:es)?)/i);
  if (matchCantidad) {
    const n = parseInt(matchCantidad[1], 10);
    const unidad = matchCantidad[2].toLowerCase();
    let dias = n;
    if (unidad.startsWith("semana")) dias = n * 7;
    else if (unidad.startsWith("mes")) dias = n * 30;
    const acotado = Math.max(1, Math.min(365, dias));
    return { periodicidadDias: acotado, proximaFechaIso: sumarDias(acotado) };
  }

  return { periodicidadDias: 30, proximaFechaIso: sumarDias(30) };
}
