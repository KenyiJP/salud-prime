import { z } from "zod";
import type { Tables } from "@/integrations/supabase/types";

export type TipoConsultaRow = Tables<"tipos_consulta">;
export type HorarioAtencionRow = Tables<"horarios_atencion">;
export type BloqueoHorarioRow = Tables<"bloqueos_horario">;

// 0 = Lunes … 6 = Domingo (convención del backend).
export const DIAS_SEMANA = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
] as const;

export function nombreDiaSemana(dia: number) {
  return DIAS_SEMANA[dia] ?? "—";
}

/** "08:30:00" -> "08:30" */
export function horaCortaTexto(hora: string) {
  return hora.slice(0, 5);
}

const horaField = z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Formato de hora inválido (HH:MM).");

export const nuevoHorarioSchema = z
  .object({
    dia_semana: z.coerce.number().int().min(0).max(6),
    hora_inicio: horaField,
    hora_fin: horaField,
    duracion_slot_minutos: z.coerce
      .number()
      .int()
      .min(5, "La duración mínima del slot es 5 minutos.")
      .max(480, "La duración máxima del slot es 480 minutos."),
  })
  .refine((v) => v.hora_fin > v.hora_inicio, {
    message: "La hora de fin debe ser posterior a la hora de inicio.",
    path: ["hora_fin"],
  });

export type NuevoHorarioInput = z.infer<typeof nuevoHorarioSchema>;

export const toggleHorarioSchema = z.object({
  id: z.string().uuid(),
  activo: z.boolean(),
});
export type ToggleHorarioInput = z.infer<typeof toggleHorarioSchema>;

export const nuevoBloqueoSchema = z
  .object({
    fecha_inicio: z.string().min(1, "Indica la fecha y hora de inicio."),
    fecha_fin: z.string().min(1, "Indica la fecha y hora de fin."),
    motivo: z.string().trim().optional().or(z.literal("")),
  })
  .refine((v) => new Date(v.fecha_fin) > new Date(v.fecha_inicio), {
    message: "El fin del bloqueo debe ser posterior al inicio.",
    path: ["fecha_fin"],
  });

export type NuevoBloqueoInput = z.infer<typeof nuevoBloqueoSchema>;

export const eliminarBloqueoSchema = z.object({ id: z.string().uuid() });
export type EliminarBloqueoInput = z.infer<typeof eliminarBloqueoSchema>;

export const nuevoTipoConsultaSchema = z.object({
  nombre: z.string().trim().min(1, "Ponle un nombre, ej. Consulta general."),
  duracion_minutos: z.coerce
    .number()
    .int()
    .min(5, "La duración mínima es 5 minutos.")
    .max(480, "La duración máxima es 480 minutos."),
});
export type NuevoTipoConsultaInput = z.infer<typeof nuevoTipoConsultaSchema>;

export const actualizarTipoConsultaSchema = nuevoTipoConsultaSchema.extend({
  id: z.string().uuid(),
});
export type ActualizarTipoConsultaInput = z.infer<typeof actualizarTipoConsultaSchema>;

export const toggleTipoConsultaSchema = z.object({
  id: z.string().uuid(),
  activo: z.boolean(),
});
export type ToggleTipoConsultaInput = z.infer<typeof toggleTipoConsultaSchema>;
