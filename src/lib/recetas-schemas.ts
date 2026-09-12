import { z } from "zod";
import type { Tables } from "@/integrations/supabase/types";

export type RecetaRow = Tables<"recetas">;
export type RecetaMedicamentoRow = Tables<"receta_medicamentos">;

/** Catálogo fijo de vías de administración (Día 8, tabla vias_administracion). */
export const VIAS_ADMINISTRACION: { id: number; nombre: string }[] = [
  { id: 1, nombre: "Oral" },
  { id: 2, nombre: "Sublingual" },
  { id: 3, nombre: "Tópica" },
  { id: 4, nombre: "Oftálmica" },
  { id: 5, nombre: "Ótica" },
  { id: 6, nombre: "Nasal" },
  { id: 7, nombre: "Inhalatoria" },
  { id: 8, nombre: "Rectal" },
  { id: 9, nombre: "Vaginal" },
  { id: 10, nombre: "Parenteral" },
  { id: 11, nombre: "Transdérmica" },
  { id: 12, nombre: "Otra" },
];

export const ESTADOS_RECETA = ["emitida", "anulada"] as const;
export type EstadoReceta = (typeof ESTADOS_RECETA)[number];

export const ETIQUETA_ESTADO_RECETA: Record<EstadoReceta, string> = {
  emitida: "Emitida",
  anulada: "Anulada",
};

/** Item del Vademécum (Día 8) devuelto por el buscador de DCI. */
export type MedicamentoVademecum = {
  id: string;
  nombre: string;
  presentacion: string | null;
  forma_farmaceutica: string | null;
  via_administracion_id: number | null;
  via_administracion: string | null;
};

/** Renglón de medicamento en construcción dentro del formulario de receta. */
export type MedicamentoSeleccionado = {
  medicamento_id: string | null;
  descripcion_libre: string;
  nombre_display: string;
  dosis: string;
  via_administracion_id: number | null;
  frecuencia: string;
  duracion: string;
  cantidad: string;
  indicaciones: string;
};

export function medicamentoVacio(): MedicamentoSeleccionado {
  return {
    medicamento_id: null,
    descripcion_libre: "",
    nombre_display: "",
    dosis: "",
    via_administracion_id: null,
    frecuencia: "",
    duracion: "",
    cantidad: "",
    indicaciones: "",
  };
}

export type RecetaConDetalle = {
  id: string;
  paciente_id: string;
  medico_id: string;
  cita_id: string | null;
  atencion_id: string | null;
  fecha_emision: string;
  vigencia_dias: number;
  diagnostico_presuntivo: string | null;
  observaciones: string | null;
  estado: EstadoReceta;
  motivo_anulacion: string | null;
  medicamentos: {
    id: string;
    medicamento_id: string | null;
    descripcion_libre: string | null;
    nombre_display: string;
    dosis: string | null;
    via_administracion: string | null;
    frecuencia: string | null;
    duracion: string | null;
    cantidad: string | null;
    indicaciones: string | null;
    orden: number;
  }[];
};

export type MedicoActualReceta = {
  id: string;
  nombres: string;
  apellidos: string;
  cmp: string | null;
  rne: string | null;
  especialidad: string | null;
  firma_url: string | null;
};

const opcional = z.string().trim().optional().or(z.literal(""));

export const medicamentoRecetaSchema = z
  .object({
    medicamento_id: z.string().uuid().nullable().optional(),
    descripcion_libre: opcional,
    dosis: opcional,
    via_administracion_id: z.number().int().nullable().optional(),
    frecuencia: opcional,
    duracion: opcional,
    cantidad: opcional,
    indicaciones: opcional,
  })
  .refine(
    (m) => !!(m.medicamento_id || (m.descripcion_libre && m.descripcion_libre.trim())),
    { message: "Cada medicamento necesita venir del Vademécum o tener una descripción libre." },
  );

export const nuevaRecetaSchema = z.object({
  paciente_id: z.string().uuid("Selecciona un paciente."),
  atencion_id: z.string().uuid().nullable().optional(),
  cita_id: z.string().uuid().nullable().optional(),
  diagnostico_presuntivo: opcional,
  observaciones: opcional,
  vigencia_dias: z.coerce.number().int().min(1).max(365).default(30),
  medicamentos: z
    .array(medicamentoRecetaSchema)
    .min(1, "Agrega al menos un medicamento a la receta."),
});
export type NuevaRecetaInput = z.infer<typeof nuevaRecetaSchema>;

export const cambiarEstadoRecetaSchema = z.object({
  id: z.string().uuid(),
  estado: z.enum(ESTADOS_RECETA),
  motivo_anulacion: opcional,
});
export type CambiarEstadoRecetaInput = z.infer<typeof cambiarEstadoRecetaSchema>;

export const recetasPacienteSchema = z.object({ paciente_id: z.string().uuid() });
export const recetaPorIdSchema = z.object({ id: z.string().uuid() });
export const recetaPublicaSchema = z.object({
  id: z.string().uuid(),
  token: z.string().min(16),
});

export function fechaVencimiento(fechaEmision: string, vigenciaDias: number): Date {
  const emision = new Date(fechaEmision);
  const vence = new Date(emision);
  vence.setDate(vence.getDate() + vigenciaDias);
  return vence;
}

export function fechaLargaReceta(iso: string): string {
  return new Date(iso).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
