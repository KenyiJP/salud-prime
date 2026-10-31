// Capa de datos de gestión de equipo (Día 29, Etapa 3). Wrappers de las RPC
// `equipo_*` (SECURITY DEFINER, rechazos como dato `{ok:false, codigo}`).
// Ningún texto de error del backend llega a la UI: solo códigos mapeados.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { claveActiva } from "@/lib/query-scope";
import { supabase } from "@/integrations/supabase/client";
import { esCorreo, normalizarCorreo } from "@/lib/equipo-utils";

type Rpc = (
  nombre: string,
  args?: Record<string, unknown>,
) => PromiseLike<{ data: unknown; error: unknown }>;

type Consulta = {
  select: (c: string) => Consulta;
  order: (c: string, o: { ascending: boolean }) => Consulta;
  limit: (n: number) => PromiseLike<{ data: unknown[] | null; error: unknown }>;
};
type Cliente = { rpc: Rpc; from: (t: string) => Consulta };

// Los tipos generados no incluyen las RPC del Día 29: único cast permitido.
const db = supabase as unknown as Cliente;

export type ResultadoEquipo<T = object> = ({ ok: true } & T) | { ok: false; codigo: string };

async function llamar<T>(nombre: string, args: Record<string, unknown> = {}): Promise<ResultadoEquipo<T>> {
  try {
    const { data, error } = await db.rpc(nombre, args);
    if (error || !data || typeof data !== "object") return { ok: false, codigo: "error_red" };
    const r = data as { ok?: boolean; codigo?: string };
    if (r.ok === true) return data as ResultadoEquipo<T>;
    return { ok: false, codigo: typeof r.codigo === "string" ? r.codigo : "error_desconocido" };
  } catch {
    return { ok: false, codigo: "error_red" };
  }
}

export type Miembro = {
  user_id: string;
  email: string | null;
  rol: string;
  created_at: string;
  es_titular: boolean;
};

export type Invitacion = {
  id: string;
  rol: string;
  nombre_referencia: string | null;
  creado_en: string;
  expira_en: string;
  usada_en: string | null;
  revocada_en: string | null;
};

export const equipoKeys = {
  todo: () => claveActiva("equipo"),
  miembros: () => claveActiva("equipo", "miembros"),
  invitaciones: () => claveActiva("equipo", "invitaciones"),
};

export function useMiembrosQuery() {
  return useQuery({
    queryKey: equipoKeys.miembros(),
    queryFn: () => llamar<{ miembros: Miembro[] }>("equipo_listar_miembros"),
  });
}

/** Solo el titular las ve (RLS `equipo_invitaciones_select_titular`); nunca incluye el token. */
export function useInvitacionesQuery(habilitado: boolean) {
  return useQuery({
    queryKey: equipoKeys.invitaciones(),
    enabled: habilitado,
    queryFn: async (): Promise<Invitacion[]> => {
      const { data, error } = await db
        .from("equipo_invitaciones")
        .select("id, rol, nombre_referencia, creado_en, expira_en, usada_en, revocada_en")
        .order("creado_en", { ascending: false })
        .limit(30);
      if (error) throw new Error("No se pudieron cargar las invitaciones.");
      return (data ?? []) as Invitacion[];
    },
  });
}

function useMutacionEquipo<TIn, TOut>(
  fn: (v: TIn) => Promise<ResultadoEquipo<TOut>>,
  opciones: { gcTime?: number } = {},
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    gcTime: opciones.gcTime,
    onSuccess: (r) => {
      if (r.ok) void qc.invalidateQueries({ queryKey: equipoKeys.todo() });
    },
  });
}

export const useCrearInvitacion = () =>
  useMutacionEquipo(
    async (v: { rol: string; nombre: string; correo: string }) => {
      // El backend exige el correo: la invitación queda atada a esa cuenta verificada.
      const correo = normalizarCorreo(v.correo);
      if (!esCorreo(correo)) {
        return { ok: false, codigo: correo ? "correo_invalido" : "correo_requerido" } as ResultadoEquipo<never>;
      }
      return llamar<{ invitacion_id: string; token: string; expira_en: string }>("equipo_crear_invitacion", {
        p_rol: v.rol,
        p_nombre_referencia: v.nombre.trim() || null,
        p_email_destino: correo,
      });
    },
    // F2: el resultado incluye el token en claro; no se retiene en el MutationCache (gcTime 0).
    { gcTime: 0 },
  );

export const useCambiarRol = () =>
  useMutacionEquipo((v: { userId: string; rol: string }) =>
    llamar("equipo_cambiar_rol", { p_user_id: v.userId, p_rol_nuevo: v.rol }),
  );

export const useRevocarAcceso = () =>
  useMutacionEquipo((v: { userId: string }) => llamar("equipo_revocar_acceso", { p_user_id: v.userId }));

export const useRevocarInvitacion = () =>
  useMutacionEquipo((v: { id: string }) => llamar("equipo_revocar_invitacion", { p_invitacion_id: v.id }));

/** Lo usa `/unirse` para canjear el token (cualquier usuario autenticado). */
export function aceptarInvitacion(token: string) {
  return llamar<{ tenant_id: string; rol: string }>("equipo_aceptar_invitacion", { p_token: token });
}
