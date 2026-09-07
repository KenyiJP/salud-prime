import { z } from "zod";
import type { Tables } from "@/integrations/supabase/types";

export type AtencionRow = Tables<"atenciones_medicas">;
export type PlantillaRow = Tables<"plantillas_especialidad">;
export type AdendaRow = Tables<"atencion_adendas">;

// ---------------------------------------------------------------- plantillas

export type CampoPlantilla = {
  id: string;
  label: string;
  tipo: "text" | "textarea" | "number" | "select" | "multiselect" | "date";
  opciones?: string[];
  required?: boolean;
  placeholder?: string;
  unit?: string;
  filas?: number;
};

export type SeccionPlantilla = {
  id: string;
  titulo: string;
  icono?: string;
  campos: CampoPlantilla[];
};

export function seccionesDe(plantilla?: PlantillaRow | null): SeccionPlantilla[] {
  const esquema = plantilla?.esquema as { secciones?: SeccionPlantilla[] } | null;
  return Array.isArray(esquema?.secciones) ? esquema!.secciones! : [];
}

// ------------------------------------------------------------------- catálogo

// Los valores viajan en minúscula porque la base los valida con un CHECK;
// la interfaz muestra la etiqueta capitalizada.
export const TIPOS_ATENCION = [
  "ambulatoria",
  "control",
  "urgencia",
  "teleconsulta",
  "interconsulta",
  "procedimiento",
] as const;

export const FORMAS_INICIO = ["brusco", "insidioso", "desconocido"] as const;
export const CURSOS = ["progresivo", "estacionario", "intermitente"] as const;

export function etiqueta(valor?: string | null): string {
  if (!valor) return "";
  return valor.charAt(0).toUpperCase() + valor.slice(1);
}

export const ESTADOS_ATENCION = ["borrador", "firmada", "anulada"] as const;
export type EstadoAtencion = (typeof ESTADOS_ATENCION)[number];

export const ETIQUETA_ESTADO_ATENCION: Record<EstadoAtencion, string> = {
  borrador: "Borrador",
  firmada: "Firmada",
  anulada: "Anulada",
};

export const UNIDADES_TIEMPO = ["horas", "días", "semanas", "meses", "años"] as const;

export const FUNCIONES_BIOLOGICAS = [
  { id: "apetito", label: "Apetito" },
  { id: "sed", label: "Sed" },
  { id: "sueno", label: "Sueño" },
  { id: "orina", label: "Orina" },
  { id: "deposiciones", label: "Deposiciones" },
  { id: "animo", label: "Ánimo" },
] as const;

export const REGIONES_EXAMEN = [
  { id: "piel", label: "Piel y anexos" },
  { id: "cabeza_cuello", label: "Cabeza y cuello" },
  { id: "torax_pulmones", label: "Tórax y pulmones" },
  { id: "cardiovascular", label: "Cardiovascular" },
  { id: "abdomen", label: "Abdomen" },
  { id: "genitourinario", label: "Genitourinario" },
  { id: "extremidades", label: "Extremidades" },
  { id: "neurologico", label: "Neurológico" },
] as const;

export const ESTADOS_GENERALES = [
  "ABEG, ABEH, ABEN",
  "REG, ABEH, ABEN",
  "MEG",
  "ABEG, deshidratado",
  "Lúcido, orientado en tiempo, espacio y persona",
] as const;

export const TIPOS_DIAGNOSTICO = [
  { valor: "P", label: "Presuntivo" },
  { valor: "D", label: "Definitivo" },
  { valor: "R", label: "Repetido" },
] as const;

export const TIPOS_ADENDA = [
  "Nota aclaratoria",
  "Evolución",
  "Resultado de exámenes",
  "Corrección de transcripción",
] as const;

export type Diagnostico = {
  codigo_cie10: string;
  descripcion: string;
  tipo: "P" | "D" | "R";
  es_principal: boolean;
};

// ------------------------------------------------------------------- IMC

export type ClasificacionImc = {
  imc: number;
  estado: string;
  clase: string;
};

/** Mismo cálculo y cortes que el trigger `calcular_imc_atencion` en la base. */
export function clasificarImc(
  peso: number | null,
  talla: number | null,
): ClasificacionImc | null {
  if (!peso || !talla || peso <= 0 || talla <= 0) return null;
  const metros = talla > 3 ? talla / 100 : talla;
  const imc = Math.round((peso / (metros * metros)) * 10) / 10;
  if (!Number.isFinite(imc)) return null;
  if (imc < 18.5)
    return { imc, estado: "Bajo peso", clase: "bg-sky-500/15 text-sky-300 ring-sky-500/40" };
  if (imc < 25)
    return {
      imc,
      estado: "Normal",
      clase: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/40",
    };
  if (imc < 30)
    return {
      imc,
      estado: "Sobrepeso",
      clase: "bg-amber-500/15 text-amber-300 ring-amber-500/40",
    };
  const estado =
    imc < 35 ? "Obesidad Grado I" : imc < 40 ? "Obesidad Grado II" : "Obesidad Grado III";
  return { imc, estado, clase: "bg-red-500/15 text-red-300 ring-red-500/40" };
}

// ------------------------------------------------------------------- zod

const texto = z.string().trim().optional().or(z.literal(""));
const entero = z.number().int().nullable().optional();
const decimal = z.number().nullable().optional();

export const diagnosticoSchema = z.object({
  codigo_cie10: z.string().trim().min(1),
  descripcion: z.string().trim().min(1),
  tipo: z.enum(["P", "D", "R"]),
  es_principal: z.boolean(),
});

export const atencionSchema = z.object({
  id: z.string().uuid().optional(),
  paciente_id: z.string().uuid("Selecciona un paciente."),
  cita_id: z.string().uuid().nullable().optional(),
  tipo_atencion: z.string().trim().min(1),
  plantilla_id: z.string().uuid().nullable().optional(),
  plantilla_version: z.number().int().nullable().optional(),

  presion_arterial_sistolica: entero,
  presion_arterial_diastolica: entero,
  frecuencia_cardiaca: entero,
  frecuencia_respiratoria: entero,
  saturacion_oxigeno: entero,
  temperatura: decimal,
  peso: decimal,
  talla: decimal,
  perimetro_abdominal: decimal,
  funciones_biologicas: z.record(z.string(), z.string()).default({}),

  motivo_consulta: texto,
  tiempo_enfermedad: texto,
  forma_inicio: texto,
  curso_enfermedad: texto,
  relato_cronologico: texto,
  antecedentes_personales: texto,
  antecedentes_patologicos: texto,
  antecedentes_quirurgicos: texto,
  antecedentes_familiares: texto,
  antecedentes_alergicos: texto,
  medicacion_habitual: texto,

  estado_general: texto,
  examen_general: texto,
  examen_regional: z.record(z.string(), z.string()).default({}),

  diagnosticos: z.array(diagnosticoSchema).default([]),
  plan_trabajo: texto,
  tratamiento: texto,
  indicaciones_generales: texto,
  proximo_control: texto,
  campos_especialidad: z.record(z.string(), z.unknown()).default({}),
});
export type AtencionInput = z.infer<typeof atencionSchema>;

export const atencionPorIdSchema = z.object({ id: z.string().uuid() });
export const atencionesPacienteSchema = z.object({ paciente_id: z.string().uuid() });

export const nuevaAdendaSchema = z.object({
  atencion_id: z.string().uuid(),
  tipo_adenda: z.string().trim().min(1),
  contenido: z.string().trim().min(5, "Escribe el contenido de la adenda."),
});
export type NuevaAdendaInput = z.infer<typeof nuevaAdendaSchema>;

export function atencionVacia(pacienteId = ""): AtencionInput {
  return {
    paciente_id: pacienteId,
    tipo_atencion: "ambulatoria",
    funciones_biologicas: {},
    examen_regional: {},
    diagnosticos: [],
    campos_especialidad: {},
  } as AtencionInput;
}

/** Convierte una fila de la base al shape del formulario. */
export function atencionAFormulario(row: AtencionRow): AtencionInput {
  return {
    id: row.id,
    paciente_id: row.paciente_id,
    cita_id: row.cita_id,
    tipo_atencion: row.tipo_atencion ?? "ambulatoria",
    plantilla_id: row.plantilla_id,
    plantilla_version: row.plantilla_version,
    presion_arterial_sistolica: row.presion_arterial_sistolica,
    presion_arterial_diastolica: row.presion_arterial_diastolica,
    frecuencia_cardiaca: row.frecuencia_cardiaca,
    frecuencia_respiratoria: row.frecuencia_respiratoria,
    saturacion_oxigeno: row.saturacion_oxigeno,
    temperatura: row.temperatura,
    peso: row.peso,
    talla: row.talla,
    perimetro_abdominal: row.perimetro_abdominal,
    funciones_biologicas: (row.funciones_biologicas as Record<string, string>) ?? {},
    motivo_consulta: row.motivo_consulta ?? "",
    tiempo_enfermedad: row.tiempo_enfermedad ?? "",
    forma_inicio: row.forma_inicio ?? "",
    curso_enfermedad: row.curso_enfermedad ?? "",
    relato_cronologico: row.relato_cronologico ?? "",
    antecedentes_personales: row.antecedentes_personales ?? "",
    antecedentes_patologicos: row.antecedentes_patologicos ?? "",
    antecedentes_quirurgicos: row.antecedentes_quirurgicos ?? "",
    antecedentes_familiares: row.antecedentes_familiares ?? "",
    antecedentes_alergicos: row.antecedentes_alergicos ?? "",
    medicacion_habitual: row.medicacion_habitual ?? "",
    estado_general: row.estado_general ?? "",
    examen_general: row.examen_general ?? "",
    examen_regional: (row.examen_regional as Record<string, string>) ?? {},
    diagnosticos: (row.diagnosticos as unknown as Diagnostico[]) ?? [],
    plan_trabajo: row.plan_trabajo ?? "",
    tratamiento: row.tratamiento ?? "",
    indicaciones_generales: row.indicaciones_generales ?? "",
    proximo_control: row.proximo_control ?? "",
    campos_especialidad: (row.campos_especialidad as Record<string, unknown>) ?? {},
  };
}

export function diagnosticosDe(row: AtencionRow): Diagnostico[] {
  return (row.diagnosticos as unknown as Diagnostico[]) ?? [];
}

export function edadEnAnios(fechaNacimiento: string | null): number | null {
  if (!fechaNacimiento) return null;
  const nac = new Date(fechaNacimiento);
  if (Number.isNaN(nac.getTime())) return null;
  const hoy = new Date();
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad -= 1;
  return edad;
}
