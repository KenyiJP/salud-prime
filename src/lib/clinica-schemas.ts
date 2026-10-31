import { z } from "zod";
import type { Tables } from "@/integrations/supabase/types";
import { MONTO_PAGO_MAX, MONTO_PAGO_MIN, montoPagoValido } from "./pago-presencial.ts";

export type PacienteRow = Tables<"pacientes">;
export type CitaResumenPagoRow = Tables<"citas_resumen_pago">;
export type PagoCitaRow = Tables<"pagos_cita">;

export type CitaRow = Tables<"citas"> & {
  pacientes: Pick<
    Tables<"pacientes">,
    "id" | "nombres" | "apellidos" | "documento_identidad"
  > | null;
  tipos_consulta: Pick<Tables<"tipos_consulta">, "id" | "nombre" | "duracion_minutos"> | null;
};

// `citas.estado` is a free-text column in the database (no enum), and its
// column default is "programada" — which is NOT one of the four states the
// app works with, so inserts always set `estado` explicitly.
export const ESTADOS_CITA = ["pendiente", "confirmada", "atendida", "cancelada"] as const;
export type EstadoCita = (typeof ESTADOS_CITA)[number];

// Espejo del CHECK `citas_estado_pago_reserva_check` (Día 22A). No confundir
// con `ESTADOS_CITA`: son dos máquinas de estado independientes (la cita en
// sí, y el cobro de la reserva).
export const ESTADOS_PAGO_RESERVA = [
  "sin_pago",
  "reportado",
  "parcial",
  "verificado",
  "rechazado",
] as const;
export type EstadoPagoReserva = (typeof ESTADOS_PAGO_RESERVA)[number];

// Espejo del CHECK `pagos_cita.metodo` — 'culqi_link' queda fuera porque solo
// lo asienta el webhook de Culqi, nunca un cobro presencial manual.
export const METODOS_PAGO_PRESENCIAL = ["efectivo", "pos", "transferencia", "yape_plin"] as const;
export type MetodoPagoPresencial = (typeof METODOS_PAGO_PRESENCIAL)[number];

export const CONCEPTOS_PAGO = ["adelanto", "saldo", "pago_completo", "reembolso"] as const;
export type ConceptoPago = (typeof CONCEPTOS_PAGO)[number];

export function etiquetaMetodoPago(metodo: string): string {
  const etiquetas: Record<string, string> = {
    efectivo: "Efectivo",
    pos: "POS",
    transferencia: "Transferencia",
    yape_plin: "Yape / Plin",
    culqi_link: "Link de pago",
  };
  return etiquetas[metodo] ?? metodo;
}

export function etiquetaConceptoPago(concepto: string): string {
  const etiquetas: Record<string, string> = {
    adelanto: "Adelanto",
    saldo: "Saldo",
    pago_completo: "Pago completo",
    reembolso: "Reembolso",
  };
  return etiquetas[concepto] ?? concepto;
}

export function etiquetaEstadoPagoReserva(estado: string | null): string {
  const etiquetas: Record<string, string> = {
    sin_pago: "Sin pago",
    reportado: "Reportado",
    parcial: "Adelanto parcial",
    verificado: "Pagado",
    rechazado: "Rechazado",
  };
  return estado ? (etiquetas[estado] ?? estado) : "Sin pago";
}

/** Formatea un monto en Soles peruanos, ej. 100 -> "S/ 100.00". */
export function formatearSoles(monto: number) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(monto);
}

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

// Espejo de los CHECK que valida `registrar_pago_presencial_cita` server-side
// (metodo_invalido / concepto_invalido / monto_invalido): esta validación de
// cliente es solo feedback inmediato, la fuente de verdad sigue siendo el RPC.
export const registrarPagoPresencialSchema = z.object({
  cita_id: z.string().uuid(),
  monto: z.coerce
    .number({ invalid_type_error: "Ingresa un importe válido." })
    .finite("Ingresa un importe válido.")
    .gte(MONTO_PAGO_MIN, "El importe mínimo es S/ 0,01.")
    .lte(MONTO_PAGO_MAX, "El importe máximo es S/ 99 999 999,99.")
    .refine(montoPagoValido, "Usa como máximo 2 decimales."),
  metodo: z.enum(METODOS_PAGO_PRESENCIAL, {
    errorMap: () => ({ message: "Selecciona un método de cobro." }),
  }),
  concepto: z.enum(CONCEPTOS_PAGO, {
    errorMap: () => ({ message: "Selecciona un concepto." }),
  }),
  nota: z.string().trim().max(500, "Máximo 500 caracteres.").optional().or(z.literal("")),
});
export type RegistrarPagoPresencialInput = z.infer<typeof registrarPagoPresencialSchema>;

export function nombrePaciente(p?: { nombres: string; apellidos: string } | null): string {
  return p ? `${p.nombres} ${p.apellidos}`.trim() : "—";
}
