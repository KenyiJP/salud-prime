import { z } from "zod";

export const MODALIDADES = [
  "Rx",
  "Eco",
  "TAC",
  "RMN",
  "DEXA",
  "Mamo",
  "Doppler",
  "Eco-cardio",
  "Fluoroscopia",
  "Gammagrafia",
] as const;
export type Modalidad = (typeof MODALIDADES)[number];

export const ETIQUETA_MODALIDAD: Record<string, string> = {
  Gammagrafia: "Gammagrafía",
};

export function etiquetaModalidad(m: string): string {
  return ETIQUETA_MODALIDAD[m] ?? m;
}

export type EstudioImagen = {
  id: string;
  nombre_display: string;
  modalidad: string;
  region: string | null;
  lateralidad: string | null;
  requiere_contraste: boolean;
  requiere_preparacion: boolean;
  instrucciones_preparacion: string | null;
  rank_uso: number;
};

/** Estudio ya agregado a la orden en construcción (lleva su nota opcional). */
export type EstudioSeleccionado = EstudioImagen & { nota: string };

export const ESTADOS_ORDEN_IMAGEN = ["pendiente", "realizada", "anulada"] as const;
export type EstadoOrdenImagen = (typeof ESTADOS_ORDEN_IMAGEN)[number];

export const ETIQUETA_ESTADO_IMAGEN: Record<EstadoOrdenImagen, string> = {
  pendiente: "Pendiente",
  realizada: "Realizada",
  anulada: "Anulada",
};

export type OrdenImagen = {
  id: string;
  paciente_id: string;
  medico_id: string;
  fecha_orden: string;
  estado: EstadoOrdenImagen;
  diagnostico_presuntivo: string | null;
  indicacion_clinica: string;
  observaciones: string | null;
  estudios: {
    orden: number;
    estudio_id: string;
    nombre_display: string;
    modalidad: string;
    region: string | null;
    requiere_contraste: boolean;
    requiere_preparacion: boolean;
    instrucciones_preparacion: string | null;
    nota: string | null;
  }[];
};

export type MedicoImpresion = {
  id: string;
  nombres: string;
  apellidos: string;
  cmp: string | null;
  rne: string | null;
  especialidad: string | null;
  email: string | null;
  firma_url: string | null;
};

const opcional = z.string().trim().optional().or(z.literal(""));

export const nuevaOrdenImagenSchema = z.object({
  paciente_id: z.string().uuid("Selecciona un paciente."),
  indicacion_clinica: z
    .string()
    .trim()
    .min(5, "Escribe la pregunta clínica para el radiólogo."),
  diagnostico_presuntivo: opcional,
  observaciones: opcional,
  estudios: z
    .array(
      z.object({
        estudio_id: z.string().uuid(),
        nota: opcional,
      }),
    )
    .min(1, "Agrega al menos un estudio a la orden."),
});
export type NuevaOrdenImagenInput = z.infer<typeof nuevaOrdenImagenSchema>;

export const cambiarEstadoOrdenImagenSchema = z.object({
  id: z.string().uuid(),
  estado: z.enum(ESTADOS_ORDEN_IMAGEN),
});
export type CambiarEstadoOrdenImagenInput = z.infer<
  typeof cambiarEstadoOrdenImagenSchema
>;

export const ordenesImagenPacienteSchema = z.object({
  paciente_id: z.string().uuid(),
});

export const ordenImagenPorIdSchema = z.object({ id: z.string().uuid() });

export const ordenImagenPublicaSchema = z.object({
  id: z.string().uuid(),
  token: z.string().min(16),
});

export const guardarFirmaSchema = z.object({
  path: z.string().min(3),
});
