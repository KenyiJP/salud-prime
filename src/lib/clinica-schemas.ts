import { z } from "zod";
import type { Tables } from "@/integrations/supabase/types";

export type PacienteRow = Tables<"pacientes">;

export type CitaRow = Tables<"citas"> & {
  pacientes: Pick<Tables<"pacientes">, "id" | "nombres" | "apellidos" | "documento_identidad"> | null;
};

// `citas.estado` is a free-text column in the database (no enum), and its
// column default is "programada" — which is NOT one of the four states the
// app works with, so inserts always set `estado` explicitly.
export const ESTADOS_CITA = ["pendiente", "confirmada", "atendida", "cancelada"] as const;
export type EstadoCita = (typeof ESTADOS_CITA)[number];

const opcional = z.string().trim().optional().or(z.literal(""));

const emailField = z
  .string()
  .trim()
  .email("Correo electrónico inválido.")
  .optional()
  .or(z.literal(""));

export const nuevoPacienteSchema = z.object({
  nombres: z.string().trim().min(2, "Ingresa los nombres del paciente."),
  apellidos: z.string().trim().min(2, "Ingresa los apellidos del paciente."),
  // Not every patient in Perú has a DNI (minors, foreigners), so this is a
  // free-form identity document, not an 8-digit-only field.
  documento_identidad: opcional,
  telefono: opcional,
  email: emailField,
  fecha_nacimiento: opcional,
});

export type NuevoPacienteInput = z.infer<typeof nuevoPacienteSchema>;

export const actualizarPacienteSchema = nuevoPacienteSchema.extend({
  id: z.string().uuid(),
});

export type ActualizarPacienteInput = z.infer<typeof actualizarPacienteSchema>;

export const eliminarPacienteSchema = z.object({ id: z.string().uuid() });
export type EliminarPacienteInput = z.infer<typeof eliminarPacienteSchema>;

export const nuevaCitaSchema = z.object({
  paciente_id: z.string().uuid("Selecciona un paciente."),
  fecha_hora: z.string().min(1, "Selecciona la fecha y hora de la cita."),
  motivo: opcional,
  // Optional: only set when the tenant has consultation types configured.
  tipo_consulta_id: z.string().uuid().optional().or(z.literal("")),
  // Free duration in minutes, used to render the appointment length on the
  // calendar. `citas` has no duration column, so it is not persisted.
  duracion_minutos: z.coerce.number().int().min(5).max(480).optional(),
});

export type NuevaCitaInput = z.infer<typeof nuevaCitaSchema>;

export const actualizarCitaSchema = nuevaCitaSchema.extend({
  id: z.string().uuid(),
  estado: z.enum(ESTADOS_CITA).optional(),
});

export type ActualizarCitaInput = z.infer<typeof actualizarCitaSchema>;

export const cambiarEstadoCitaSchema = z.object({
  id: z.string().uuid(),
  estado: z.enum(ESTADOS_CITA),
});

export type CambiarEstadoCitaInput = z.infer<typeof cambiarEstadoCitaSchema>;

export const eliminarCitaSchema = z.object({ id: z.string().uuid() });
export type EliminarCitaInput = z.infer<typeof eliminarCitaSchema>;

export function nombrePaciente(
  p?: { nombres: string; apellidos: string } | null,
): string {
  return p ? `${p.nombres} ${p.apellidos}`.trim() : "—";
}
