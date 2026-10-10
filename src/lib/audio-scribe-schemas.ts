// Tipos del módulo Voice Scribe (Día 27A). Espejo exacto del contrato §4.3.
// Las tablas/RPCs aún no están en types.ts generado: se definen aquí.

export type AudioCodigoError =
  | "no_autorizado"
  | "funcion_desactivada"
  | "texto_no_vigente"
  | "sin_consentimiento"
  | "consentimiento_rechazado"
  | "consentimiento_revocado"
  | "paciente_no_encontrado"
  | "consentimiento_no_encontrado"
  | "sesion_no_encontrada"
  | "sesion_ya_activa"
  | "sesion_cerrada"
  | "secuencia_invalida"
  | "fragmento_no_encontrado_en_storage"
  | "limite_excedido"
  | "atencion_no_coincide"
  | "accion_invalida"
  | "prorroga_agotada" // tolerado: el servidor aún puede devolverlo; sin UI
  | "tope_conservacion"
  | "parametro_invalido";

export type AudioResultado<T = object> =
  | ({ ok: true } & T)
  | { ok: false; codigo: AudioCodigoError };

export type AudioFormato = "audio/webm" | "audio/ogg" | "audio/mp4";

/** Extensión de archivo según MIME sin parámetros de codec. */
export const FORMATO_EXT: Record<AudioFormato, string> = {
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/mp4": "m4a",
};

/** Mensaje visible por código de error. Nunca texto técnico del backend. */
export const MENSAJE_ERROR: Record<AudioCodigoError, string> = {
  no_autorizado: "Sin autorización para esta acción.",
  funcion_desactivada: "La transcripción de consulta está desactivada.",
  texto_no_vigente: "El texto de consentimiento no está vigente.",
  sin_consentimiento: "Se requiere consentimiento del paciente.",
  consentimiento_rechazado: "El paciente no aceptó la grabación.",
  consentimiento_revocado: "El paciente retiró su permiso.",
  paciente_no_encontrado: "Paciente no encontrado.",
  consentimiento_no_encontrado: "No se encontró el consentimiento del paciente.",
  sesion_no_encontrada: "Sesión de audio no encontrada.",
  sesion_ya_activa: "Ya hay una sesión de grabación activa.",
  sesion_cerrada: "La sesión de grabación ya fue cerrada.",
  secuencia_invalida: "Error interno al registrar fragmento.",
  fragmento_no_encontrado_en_storage: "Error al subir el audio.",
  limite_excedido: "Se alcanzó el límite de grabación.",
  atencion_no_coincide: "La atención no coincide con la sesión.",
  accion_invalida: "Acción no válida.",
  prorroga_agotada: "El audio ya está conservado por el máximo de 30 días; no admite prórroga.",
  tope_conservacion: "Se alcanzó el tope máximo de conservación.",
  parametro_invalido: "Parámetro inválido.",
};

/** Sesión devuelta por audio_listar_sesiones_atencion (sin rutas, por contrato). */
export type AudioSesionResumen = {
  id: string;
  estado: string;
  integridad: string | null;
  iniciada_en: string;
  duracion_ms: number | null;
  n_fragmentos: number;
  conservar: boolean;
  conservar_hasta: string | null;
  purgar_despues_de: string;
  purgada_en: string | null;
  motivo_purga: string | null;
};

export type RespuestaTextoConsentimiento = AudioResultado<{
  version: string;
  texto: string;
  texto_sha256: string;
}>;

export type RespuestaRegistrarConsentimiento = AudioResultado<{
  consentimiento_id: string;
  decision: string;
}>;

export type RespuestaIniciarSesion = AudioResultado<{
  sesion_id: string;
  prefijo_ruta: string;
}>;

export type RespuestaRegistrarFragmento = AudioResultado<{
  n_fragmentos: number;
}>;

export type RespuestaFinalizarSesion = AudioResultado<{
  integridad: "completa" | "con_huecos";
}>;

export type RespuestaConservar = AudioResultado<{
  conservar: boolean;
  conservar_hasta: string | null;
}>;

export type RespuestaListarSesiones = AudioResultado<{
  sesiones: AudioSesionResumen[];
}>;
