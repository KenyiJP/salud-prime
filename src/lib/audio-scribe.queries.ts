// Capa de datos de Voice Scribe (Día 27A). Wrappers de los RPC del contrato §4.3.
// Reglas: ningún texto de error del backend se propaga ni se muestra; un error de
// transporte se mapea a un código del contrato. Los RPC devuelven siempre un dato
// `{ok, codigo?}`, nunca lanzan.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { claveActiva } from "@/lib/query-scope";
import { supabase } from "@/integrations/supabase/client";
import {
  MENSAJE_ERROR,
  type AudioCodigoError,
  type AudioResultado,
  type RespuestaConservar,
  type RespuestaFinalizarSesion,
  type RespuestaIniciarSesion,
  type RespuestaListarSesiones,
  type RespuestaRegistrarConsentimiento,
  type RespuestaRegistrarFragmento,
  type RespuestaTextoConsentimiento,
} from "./audio-scribe-schemas";
import { codigoDeErrorTransporte, esCodigoAudio, normalizarRespuesta } from "./audio-scribe-captura";

/** Mensaje fijo, no vacío y sin texto técnico para CADA código del contrato. */
export function mensajeAudioError(codigo: AudioCodigoError | string | null | undefined): string {
  return esCodigoAudio(codigo) ? MENSAJE_ERROR[codigo] : MENSAJE_ERROR.parametro_invalido;
}

// Los tipos generados aún no incluyen los RPC de audio: único cast permitido.
type ClienteRpc = {
  rpc: (nombre: string, args: object) => PromiseLike<{ data: unknown; error: unknown }>;
};

async function rpc<T extends object>(nombre: string, args: object): Promise<AudioResultado<T>> {
  try {
    const { data, error } = await (supabase as unknown as ClienteRpc).rpc(nombre, args);
    if (error) return { ok: false, codigo: codigoDeErrorTransporte(error) };
    return normalizarRespuesta<T>(data);
  } catch {
    return { ok: false, codigo: "parametro_invalido" };
  }
}

// ───────────────────────── Funciones planas (las usa también el hook de captura) ─────────────────────────

export const audioTextoVigente = () =>
  rpc<{ version: string; texto: string; texto_sha256: string }>("audio_texto_consentimiento_vigente", {});

export type VarsConsentimiento = {
  pacienteId: string;
  citaId: string | null;
  atencionId: string | null;
  decision: "aceptado" | "rechazado";
  textoVersion: string;
};

export const audioRegistrarConsentimiento = (v: VarsConsentimiento) =>
  rpc<{ consentimiento_id: string; decision: string }>("audio_registrar_consentimiento", {
    p_paciente_id: v.pacienteId,
    p_cita_id: v.citaId,
    p_atencion_id: v.atencionId,
    p_decision: v.decision,
    p_texto_version: v.textoVersion,
  });

export const audioIniciarSesion = (consentimientoId: string, atencionId: string | null, formato: string) =>
  rpc<{ sesion_id: string; prefijo_ruta: string }>("audio_iniciar_sesion", {
    p_consentimiento_id: consentimientoId,
    p_atencion_id: atencionId,
    p_formato: formato,
  });

export const audioRegistrarFragmento = (a: {
  sesionId: string;
  secuencia: number;
  ruta: string;
  bytes: number;
  duracionMs: number;
  sha256: string;
}) =>
  rpc<{ n_fragmentos: number }>("audio_registrar_fragmento", {
    p_sesion_id: a.sesionId,
    p_secuencia: a.secuencia,
    p_ruta: a.ruta,
    p_bytes: a.bytes,
    p_duracion_ms: a.duracionMs,
    p_sha256: a.sha256,
  });

export const audioFinalizarSesion = (sesionId: string, nFragmentos: number, duracionMs: number) =>
  rpc<{ integridad: "completa" | "con_huecos" }>("audio_finalizar_sesion", {
    p_sesion_id: sesionId,
    p_n_fragmentos_esperados: nFragmentos,
    p_duracion_ms: duracionMs,
  });

export const audioVincularAtencion = (sesionId: string, atencionId: string) =>
  rpc<object>("audio_vincular_atencion", { p_sesion_id: sesionId, p_atencion_id: atencionId });

export const audioConservarSesion = (sesionId: string, accion: "conservar" | "quitar") =>
  rpc<{ conservar: boolean; conservar_hasta: string | null }>("audio_conservar_sesion", {
    p_sesion_id: sesionId,
    p_accion: accion,
  });

export const audioDescartarSesion = (sesionId: string) =>
  rpc<object>("audio_descartar_sesion", { p_sesion_id: sesionId });

export const audioRevocarConsentimiento = (consentimientoId: string) =>
  rpc<object>("audio_revocar_consentimiento", { p_consentimiento_id: consentimientoId });

export const audioListarSesiones = (atencionId: string) =>
  rpc<{ sesiones: RespuestaListarSesionesItems }>("audio_listar_sesiones_atencion", { p_atencion_id: atencionId });

type RespuestaListarSesionesItems = Extract<RespuestaListarSesiones, { ok: true }>["sesiones"];

// ───────────────────────── Hooks react-query (nombres del contrato §10) ─────────────────────────

export const useTextoConsentimientoVigente = () =>
  useQuery<RespuestaTextoConsentimiento>({
    queryKey: ["audio-consentimiento-vigente"],
    queryFn: audioTextoVigente,
  });

export const useRegistrarConsentimiento = () =>
  useMutation<RespuestaRegistrarConsentimiento, never, VarsConsentimiento>({
    mutationFn: audioRegistrarConsentimiento,
  });

export const useConservarSesion = () => {
  const qc = useQueryClient();
  return useMutation<
    RespuestaConservar,
    never,
    { sesionId: string; accion: "conservar" | "quitar" }
  >({
    mutationFn: (v) => audioConservarSesion(v.sesionId, v.accion),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: claveActiva("audio-sesiones") });
    },
  });
};

export const useSesionesAtencion = (atencionId: string | null) =>
  useQuery<RespuestaListarSesiones>({
    queryKey: claveActiva("audio-sesiones", atencionId),
    enabled: !!atencionId,
    queryFn: () => {
      if (!atencionId) return Promise.resolve({ ok: false, codigo: "parametro_invalido" } as const);
      return audioListarSesiones(atencionId);
    },
  });

// medicos.audio_scribe_habilitado: aún no está en types.ts generado (patrón triaje-config-card.tsx).
const claveHabilitado = () => claveActiva("medico-audio-scribe-habilitado");
type FilaAudioCfg = { id: string; audio_scribe_habilitado: boolean };

async function leerConfigMedico(): Promise<FilaAudioCfg | null> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;
  const { data, error } = await supabase
    .from("medicos")
    .select("id, audio_scribe_habilitado" as "id")
    .eq("user_id", u.user.id)
    .maybeSingle();
  if (error || !data) return null;
  return data as unknown as FilaAudioCfg;
}

/** `true` solo si el médico activó la función. Ante cualquier fallo: `false` (apagado seguro). */
export const useAudioScribeHabilitado = () =>
  useQuery<boolean>({
    queryKey: claveHabilitado(),
    queryFn: async () => (await leerConfigMedico())?.audio_scribe_habilitado === true,
  });

/** Resuelve `true` si se guardó; `false` si no (sin texto técnico). */
export const useSetAudioScribeHabilitado = () => {
  const qc = useQueryClient();
  return useMutation<boolean, never, boolean>({
    mutationFn: async (valor) => {
      const cfg = await leerConfigMedico();
      if (!cfg) return false;
      const { error } = await supabase
        .from("medicos")
        .update({ audio_scribe_habilitado: valor } as never)
        .eq("id", cfg.id);
      return !error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: claveHabilitado() });
    },
  });
};

// Tipos re-exportados por comodidad de C2.
export type {
  RespuestaConservar,
  RespuestaFinalizarSesion,
  RespuestaIniciarSesion,
  RespuestaRegistrarFragmento,
};
