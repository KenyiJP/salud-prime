import { z } from "zod";
import type { Tables } from "@/integrations/supabase/types";

export type PacienteRow = Tables<"pacientes">;

export type CitaRow = Tables<"citas"> & {
  pacientes: Pick<Tables<"pacientes">, "id" | "nombre_completo" | "dni"> | null;
};

export const ESTADOS_CITA = ["pendiente", "confirmada", "atendida", "cancelada"] as const;
export type EstadoCita = (typeof ESTADOS_CITA)[number];

const dniField = z
  .string()
  .trim()
  .regex(/^\d{8}$/, "El DNI debe tener exactamente 8 dígitos.")
  .optional()
  .or(z.literal(""));

const telefonoField = z
  .string()
  .trim()
  .regex(/^\d{9}$/, "El teléfono debe tener exactamente 9 dígitos.");

const emailField = z
  .string()
  .trim()
  .email("Correo electrónico inválido.")
  .optional()
  .or(z.literal(""));

export const nuevoPacienteSchema = z.object({
  nombre_completo: z.string().trim().min(3, "Ingresa el nombre completo del paciente."),
  dni: dniField,
  telefono_whatsapp: telefonoField,
  email: emailField,
  antecedentes_alergias: z.string().trim().optional().or(z.literal("")),
});

export type NuevoPacienteInput = z.infer<typeof nuevoPacienteSchema>;

export const actualizarPacienteSchema = nuevoPacienteSchema.extend({
  id: z.string().uuid(),
});

export type ActualizarPacienteInput = z.infer<typeof actualizarPacienteSchema>;

export const nuevaCitaSchema = z.object({
  paciente_id: z.string().uuid("Selecciona un paciente."),
  fecha_hora: z.string().min(1, "Selecciona la fecha y hora de la cita."),
  motivo_consulta: z.string().trim().optional().or(z.literal("")),
  monto_pago: z.coerce
    .number({ invalid_type_error: "Ingresa un monto válido." })
    .min(0, "El monto no puede ser negativo."),
});

export type NuevaCitaInput = z.infer<typeof nuevaCitaSchema>;

export const cambiarEstadoCitaSchema = z.object({
  id: z.string().uuid(),
  estado: z.enum(ESTADOS_CITA),
});

export type CambiarEstadoCitaInput = z.infer<typeof cambiarEstadoCitaSchema>;
