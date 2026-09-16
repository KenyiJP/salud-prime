import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

export const TIPOGRAFIAS_PERMITIDAS = [
  "inter",
  "roboto",
  "poppins",
  "nunito",
  "montserrat",
  "work-sans",
  "merriweather",
  "playfair-display",
  "lora",
  "source-serif-pro",
] as const;
export type Tipografia = (typeof TIPOGRAFIAS_PERMITIDAS)[number];

export const ETIQUETA_TIPOGRAFIA: Record<Tipografia, string> = {
  inter: "Inter",
  roboto: "Roboto",
  poppins: "Poppins",
  nunito: "Nunito",
  montserrat: "Montserrat",
  "work-sans": "Work Sans",
  merriweather: "Merriweather",
  "playfair-display": "Playfair Display",
  lora: "Lora",
  "source-serif-pro": "Source Serif Pro",
};

/**
 * Mapeo a `font-family` CSS real por tipografía — se usa tanto en el
 * selector (para previsualizar cada opción con su propia fuente antes de
 * elegirla) como en la vista previa en vivo del panel de Marca.
 */
export const FUENTE_CSS: Record<Tipografia, string> = {
  inter: "'Inter', sans-serif",
  roboto: "'Roboto', sans-serif",
  poppins: "'Poppins', sans-serif",
  nunito: "'Nunito', sans-serif",
  montserrat: "'Montserrat', sans-serif",
  "work-sans": "'Work Sans', sans-serif",
  merriweather: "'Merriweather', serif",
  "playfair-display": "'Playfair Display', serif",
  lora: "'Lora', serif",
  "source-serif-pro": "'Source Serif Pro', serif",
};

export const ORIGENES_TESTIMONIO = ["manual", "motor_resenas"] as const;
export type OrigenTestimonio = (typeof ORIGENES_TESTIMONIO)[number];

export const ETIQUETA_ORIGEN_TESTIMONIO: Record<OrigenTestimonio, string> = {
  manual: "Cargado manualmente",
  motor_resenas: "Motor de reseñas",
};

const hexColor = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, "Usa un color en formato hexadecimal, ej. #0f766e.");

export const landingConfigSchema = z.object({
  color_primario: hexColor,
  color_secundario: hexColor,
  color_fondo: hexColor,
  tipografia: z.enum(TIPOGRAFIAS_PERMITIDAS),
  foto_medico_url: z.string().url().nullable(),
  logo_url: z.string().url().nullable(),
  galeria_fotos_urls: z.array(z.string().url()).max(12, "Máximo 12 fotos en la galería."),
  biografia: z.string().trim().max(2000, "Máximo 2000 caracteres.").nullable(),
  formacion_academica: z.string().trim().max(2000, "Máximo 2000 caracteres.").nullable(),
  mostrar_cmp: z.boolean(),
  mostrar_rne: z.boolean(),
  video_url: z.string().trim().url("Ingresa una URL válida (YouTube, Vimeo, etc.).").nullable(),
  animaciones_activas: z.boolean(),
  mostrar_boton_reserva: z.boolean(),
  mostrar_boton_whatsapp: z.boolean(),
  whatsapp_numero: z
    .string()
    .trim()
    .regex(/^\+?[0-9]{9,15}$/, "Ingresa un número válido, ej. +51987654321.")
    .nullable(),
  mapa_direccion: z.string().trim().max(300).nullable(),
  publicado: z.boolean(),
});
export type LandingConfigInput = z.infer<typeof landingConfigSchema>;

/**
 * Construye el enlace de búsqueda de Google Maps a partir de la dirección
 * descriptiva que escribe el médico. Al abrirse (web o app móvil) Google
 * Maps geocodifica el texto y ubica el pin — no requerimos que el médico
 * conozca ni copie coordenadas manualmente.
 */
export function construirUrlGoogleMaps(direccion: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion)}`;
}

export type LandingConfigRow = LandingConfigInput & {
  id: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
};

export const landingServicioSchema = z.object({
  nombre: z.string().trim().min(2, "El nombre es obligatorio.").max(120),
  descripcion: z.string().trim().max(500).nullable(),
  precio: z
    .number({ invalid_type_error: "Ingresa un precio válido." })
    .min(0, "El precio no puede ser negativo.")
    .nullable(),
  duracion_minutos: z.number().int().positive("La duración debe ser mayor a 0 minutos.").nullable(),
  activo: z.boolean(),
});
export type LandingServicioInput = z.infer<typeof landingServicioSchema>;

export type LandingServicioRow = LandingServicioInput & {
  id: string;
  tenant_id: string;
  landing_config_id: string;
  orden: number;
  created_at: string;
  updated_at: string;
};

export const landingTestimonioSchema = z.object({
  nombre_paciente: z.string().trim().min(2, "El nombre es obligatorio.").max(120),
  contenido: z.string().trim().min(5, "Escribe el testimonio completo.").max(1000),
  calificacion: z.number().int().min(1).max(5).nullable(),
  origen: z.enum(ORIGENES_TESTIMONIO),
  aprobado: z.boolean(),
});
export type LandingTestimonioInput = z.infer<typeof landingTestimonioSchema>;

export type LandingTestimonioRow = LandingTestimonioInput & {
  id: string;
  tenant_id: string;
  landing_config_id: string;
  orden: number;
  created_at: string;
  updated_at: string;
};

// Debe coincidir exactamente con `tenants_slug_formato_chk` (3-63 chars).
export const SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "El slug debe tener al menos 3 caracteres.")
  .max(63, "El slug no puede pasar de 63 caracteres.")
  .regex(
    SLUG_REGEX,
    "Solo minúsculas, números y guiones simples entre palabras (ej. dr-juan-perez).",
  );

export const MAX_ARCHIVO_BYTES = 5 * 1024 * 1024; // 5 MB
export const TIPOS_IMAGEN_PERMITIDOS = ["image/png", "image/jpeg", "image/webp"] as const;

// ---------------------------------------------------------------------------
// Landing pública (Día 17) — filas devueltas por las vistas `landing_publica`,
// `landing_servicios_publica` y `landing_testimonios_publica` (Día 15). Son de
// solo lectura (anon): ya filtran `publicado = true` / `activo = true` /
// `aprobado = true` en su propia definición SQL, así que basta con leerlas.
// Se derivan directamente de `Database["public"]["Views"]` — nunca a mano —
// para no desincronizarse si Supabase regenera `types.ts`.
// ---------------------------------------------------------------------------
export type LandingPublicaRow = Database["public"]["Views"]["landing_publica"]["Row"];
export type LandingServicioPublicoRow =
  Database["public"]["Views"]["landing_servicios_publica"]["Row"];
export type LandingTestimonioPublicoRow =
  Database["public"]["Views"]["landing_testimonios_publica"]["Row"];

export type LandingMedicaPublica = {
  config: LandingPublicaRow;
  servicios: LandingServicioPublicoRow[];
  testimonios: LandingTestimonioPublicoRow[];
};

/**
 * Enlace de WhatsApp con mensaje precompletado para el CTA de agendamiento
 * de la landing pública. Acepta números con o sin "+"/espacios (el médico
 * los captura libremente en el Panel de Marca); wa.me exige solo dígitos.
 * Devuelve `null` si no queda ningún dígito (fallback sin romper el layout).
 */
export function construirUrlWhatsapp(numero: string, nombreMedico: string): string | null {
  const soloDigitos = numero.replace(/[^0-9]/g, "");
  if (!soloDigitos) return null;
  const mensaje = `Hola Dr(a). ${nombreMedico}, deseo agendar una consulta médica.`;
  return `https://wa.me/${soloDigitos}?text=${encodeURIComponent(mensaje)}`;
}

// ---------------------------------------------------------------------------
// Reserva pública (Día 18) — un visitante anónimo agenda su propia cita desde
// `/dr-{slug}` sin cuenta ni sesión. Todo pasa por las RPCs `security definer`
// `obtener_tipos_consulta_publicos`, `obtener_slots_disponibles` y
// `registrar_reserva_web`: nunca se lee `citas`/`pacientes` directo con anon.
// ---------------------------------------------------------------------------

export const ASEGURADORA_TIPOS = [
  "particular",
  "sis",
  "essalud",
  "eps",
  "fuerzas_armadas",
  "otro",
] as const;
export type AseguradoraTipo = (typeof ASEGURADORA_TIPOS)[number];

export const ETIQUETA_ASEGURADORA: Record<AseguradoraTipo, string> = {
  particular: "Particular",
  sis: "SIS",
  essalud: "EsSalud",
  eps: "EPS",
  fuerzas_armadas: "Fuerzas Armadas / PNP",
  otro: "Otro",
};

export type TipoConsultaPublico =
  Database["public"]["Functions"]["obtener_tipos_consulta_publicos"]["Returns"][number];

export type SlotDisponible =
  Database["public"]["Functions"]["obtener_slots_disponibles"]["Returns"][number];

export type ResultadoReservaWeb =
  Database["public"]["Functions"]["registrar_reserva_web"]["Returns"][number];

/**
 * Documento peruano opcional (DNI 8 dígitos o carné de extranjería
 * alfanumérico); el paciente puede reservar sin documento y completarlo
 * presencialmente, por eso `nullable` en vez de obligatorio.
 */
const documentoIdentidadSchema = z.string().trim().max(20, "Máximo 20 caracteres.").nullable();

export const reservaPublicaFormSchema = z
  .object({
    nombres: z.string().trim().min(2, "Ingresa tus nombres.").max(120),
    apellidos: z.string().trim().min(2, "Ingresa tus apellidos.").max(120),
    telefono: z
      .string()
      .trim()
      .regex(/^\+?[0-9]{9,15}$/, "Ingresa un celular válido, ej. 987654321."),
    email: z.string().trim().toLowerCase().email("Ingresa un correo válido.").nullable(),
    documento_identidad: documentoIdentidadSchema,
    aseguradora_tipo: z.enum(ASEGURADORA_TIPOS),
    aseguradora_nombre: z.string().trim().max(120).nullable(),
    comentario: z.string().trim().max(500, "Máximo 500 caracteres.").nullable(),
    tipo_consulta_id: z.string().uuid().nullable(),
  })
  .refine((datos) => datos.aseguradora_tipo !== "eps" || !!datos.aseguradora_nombre, {
    message: "Indica el nombre de tu EPS.",
    path: ["aseguradora_nombre"],
  });
export type ReservaPublicaFormInput = z.infer<typeof reservaPublicaFormSchema>;

export const registrarReservaWebInputSchema = reservaPublicaFormSchema.and(
  z.object({ slug: slugSchema, inicio: z.string().datetime({ offset: true }) }),
);
export type RegistrarReservaWebInput = z.infer<typeof registrarReservaWebInputSchema>;

export const obtenerSlotsInputSchema = z.object({
  slug: slugSchema,
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida."),
  tipo_consulta_id: z.string().uuid().nullable().optional(),
});
export type ObtenerSlotsInput = z.infer<typeof obtenerSlotsInputSchema>;
