import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import {
  COLUMNAS_RESENA,
  ESTADO_POR_PESTANA,
  ErrorUsuario,
  mensajeRechazoMarcarLeida,
  mensajeRechazoModerar,
  normalizarResumen,
  type PestanaResena,
  type RespuestaMarcarLeida,
  type RespuestaModerar,
  type ResenaFila,
  type ResumenReputacion,
} from "./resenas-schemas";

// La tabla/vista/RPC del Día 26C aún no están en types.ts generado: se usa una vista sin tipar
// del mismo cliente (RLS sigue aplicando igual; solo clave pública en el navegador).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbSinTipos = SupabaseClient<any, "public", any>;
const db = supabase as unknown as DbSinTipos;

const KEYS = {
  // La key incluye el user.id: otra cuenta en el mismo navegador nunca reutiliza el médico en caché.
  medico: (userId: string | undefined) => ["reputacion-medico-id", userId] as const,
  resumen: (medicoId: string | undefined) => ["reputacion-resumen", medicoId] as const,
  lista: (medicoId: string | undefined, p: PestanaResena) =>
    ["reputacion-lista", medicoId, p] as const,
};

async function getMedicoId(): Promise<string> {
  const { data: u, error: ue } = await supabase.auth.getUser();
  if (ue || !u.user) throw new ErrorUsuario("Tu sesión expiró. Vuelve a iniciar sesión.");
  // Titular: su propia ficha; CM del consultorio: la ficha del médico de su
  // tenant (la RLS de `medicos` ya filtra por tenant_id del usuario).
  let { data, error } = await db.from("medicos").select("id").eq("user_id", u.user.id).limit(1);
  if (!error && (!data || data.length === 0)) {
    ({ data, error } = await db.from("medicos").select("id").order("created_at", { ascending: true }).limit(1));
  }
  if (error) {
    console.error("[reputacion] no se pudo leer el perfil médico", error);
    throw new ErrorUsuario("No se pudo cargar tu perfil médico. Inténtalo de nuevo.");
  }
  const fila = ((data ?? []) as { id: string }[])[0];
  if (!fila) throw new ErrorUsuario("No existe un perfil médico vinculado a esta cuenta.");
  return fila.id;
}

export function useMedicoReputacionQuery() {
  const { user } = useAuth();
  return useQuery({
    queryKey: KEYS.medico(user?.id),
    queryFn: getMedicoId,
    enabled: !!user,
    staleTime: 5 * 60_000,
  });
}

export function useResumenReputacionQuery(medicoId: string | undefined) {
  return useQuery({
    queryKey: KEYS.resumen(medicoId),
    enabled: !!medicoId,
    queryFn: async (): Promise<ResumenReputacion | null> => {
      const { data, error } = await db
        .from("resenas_reputacion_resumen")
        .select("*")
        .eq("medico_id", medicoId!)
        .limit(1);
      if (error) {
        console.error("[reputacion] error leyendo el resumen", error);
        throw new ErrorUsuario("No se pudo cargar el resumen de reputación. Inténtalo de nuevo.");
      }
      return normalizarResumen(((data ?? []) as Record<string, unknown>[])[0] ?? null);
    },
  });
}

/** Tope de filas que trae la lista; si se alcanza, la UI avisa que puede haber más. */
export const LIMITE_LISTA_RESENAS = 100;

export function useResenasQuery(medicoId: string | undefined, pestana: PestanaResena) {
  return useQuery({
    queryKey: KEYS.lista(medicoId, pestana),
    enabled: !!medicoId,
    queryFn: async (): Promise<ResenaFila[]> => {
      const { data, error } = await db
        .from("resenas")
        .select(COLUMNAS_RESENA)
        .eq("medico_id", medicoId!)
        .eq("estado", ESTADO_POR_PESTANA[pestana])
        .order("respondida_en", { ascending: false, nullsFirst: false })
        .limit(LIMITE_LISTA_RESENAS);
      if (error) {
        console.error("[reputacion] error leyendo reseñas", error);
        throw new ErrorUsuario("No se pudieron cargar las reseñas. Inténtalo de nuevo.");
      }
      return (data ?? []) as unknown as ResenaFila[];
    },
  });
}

/**
 * Resultado de moderar. Un rechazo de negocio (`ok=false` + código) NO lanza: vuelve como dato
 * para que la UI pueda mostrar un aviso con acción (p. ej. enlace a configurar la web).
 */
export type ResultadoModeracion =
  | { ok: true; aprobada: boolean; landingPublicada: boolean }
  | { ok: false; codigo: string; mensaje: string };

/** Aprobar/rechazar vía RPC `resena_moderar` (SECURITY DEFINER, valida tenant y rol). */
export function useModerarResenaMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { resenaId: string; aprobar: boolean }): Promise<ResultadoModeracion> => {
      const { data, error } = await db.rpc("resena_moderar", {
        p_resena_id: v.resenaId,
        p_aprobar: v.aprobar,
      });
      if (error) {
        console.error("[reputacion] error en resena_moderar", error);
        throw new ErrorUsuario("No se pudo moderar la reseña. Inténtalo de nuevo.");
      }
      const r = (data ?? {}) as RespuestaModerar;
      if (!r.ok) {
        const codigo = r.codigo ?? "desconocido";
        console.error("[reputacion] resena_moderar rechazada", codigo);
        return { ok: false, codigo, mensaje: mensajeRechazoModerar(r.codigo) };
      }
      return { ok: true, aprobada: v.aprobar, landingPublicada: r.landing_publicada === true };
    },
    onSettled: () => {
      // También tras un rechazo de negocio: el estado de la reseña pudo cambiar en otro lado.
      void qc.invalidateQueries({ queryKey: ["reputacion-lista"] });
      void qc.invalidateQueries({ queryKey: ["reputacion-resumen"] });
    },
  });
}

/**
 * Marca una reseña como leída / no leída vía RPC `resena_marcar_leida(p_resena_id, p_leida)`
 * (contrato §7.1). Permite deshacer enviando `leida: false`.
 */
export function useMarcarLeidaMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { resenaId: string; leida?: boolean }): Promise<{ leida: boolean }> => {
      const leida = v.leida ?? true;
      const { data, error } = await db.rpc("resena_marcar_leida", {
        p_resena_id: v.resenaId,
        p_leida: leida,
      });
      if (error) {
        console.error("[reputacion] error en resena_marcar_leida", error);
        throw new ErrorUsuario("No se pudo actualizar la reseña. Inténtalo de nuevo.");
      }
      const r = (data ?? {}) as RespuestaMarcarLeida;
      if (!r.ok) {
        console.error("[reputacion] resena_marcar_leida rechazada", r.codigo);
        throw new ErrorUsuario(mensajeRechazoMarcarLeida(r.codigo));
      }
      return { leida: r.leida ?? leida };
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ["reputacion-lista"] });
      void qc.invalidateQueries({ queryKey: ["reputacion-resumen"] });
    },
  });
}
