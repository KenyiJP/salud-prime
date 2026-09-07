import { z } from "zod";

/**
 * The generated `src/integrations/supabase/types.ts` does not include the
 * laboratory tables yet, so the module declares its own row shapes. These
 * mirror the real columns exactly — no schema change is ever made here.
 */
export type ExamenLaboratorio = {
  id: string;
  loinc_num: string;
  nombre_display: string;
  rank_loinc: number | null;
};

export const ESTADOS_ORDEN = ["pendiente", "entregada", "anulada"] as const;
export type EstadoOrden = (typeof ESTADOS_ORDEN)[number];

export const ETIQUETA_ESTADO_ORDEN: Record<EstadoOrden, string> = {
  pendiente: "Pendiente",
  entregada: "Entregada",
  anulada: "Anulada",
};

export type OrdenLaboratorio = {
  id: string;
  paciente_id: string;
  medico_id: string;
  fecha_orden: string;
  estado: EstadoOrden;
  diagnostico_presuntivo: string | null;
  observaciones: string | null;
  examenes: { orden: number; nombre_display: string; examen_id: string }[];
};

export type MedicoActual = {
  id: string;
  nombres: string;
  apellidos: string;
  cmp: string | null;
  rne: string | null;
  especialidad: string | null;
};

const opcional = z.string().trim().optional().or(z.literal(""));

export const nuevaOrdenSchema = z.object({
  paciente_id: z.string().uuid("Selecciona un paciente."),
  diagnostico_presuntivo: opcional,
  observaciones: opcional,
  examen_ids: z
    .array(z.string().uuid())
    .min(1, "Agrega al menos un examen a la orden."),
});
export type NuevaOrdenInput = z.infer<typeof nuevaOrdenSchema>;

export const cambiarEstadoOrdenSchema = z.object({
  id: z.string().uuid(),
  estado: z.enum(ESTADOS_ORDEN),
});
export type CambiarEstadoOrdenInput = z.infer<typeof cambiarEstadoOrdenSchema>;

export const ordenesPacienteSchema = z.object({
  paciente_id: z.string().uuid(),
});

export const ordenPorIdSchema = z.object({ id: z.string().uuid() });

export const ordenLabPublicaSchema = z.object({
  id: z.string().uuid(),
  token: z.string().min(16),
});

export function edadDesde(fechaNacimiento: string | null): string {
  if (!fechaNacimiento) return "—";
  const nac = new Date(fechaNacimiento);
  if (Number.isNaN(nac.getTime())) return "—";
  const hoy = new Date();
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad -= 1;
  return `${edad} años`;
}

export function fechaLarga(iso: string): string {
  return new Date(iso).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
