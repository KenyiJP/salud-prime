import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type MedicoContext = { medicoId: string; tenantId: string };

// Resolves the médico owned by the authenticated user; RLS on `medicos`
// already scopes this to the caller's tenants, this just gives us the ids to
// filter/insert by. `medico_id` and `tenant_id` are NEVER accepted from the
// client — both always come from this server-side lookup.
export async function resolveMedicoContext(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<MedicoContext> {
  const { data, error } = await supabase
    .from("medicos")
    .select("id, tenant_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) {
    throw new Error(
      "No existe un perfil de médico vinculado a esta cuenta. Completa el registro médico primero.",
    );
  }
  return { medicoId: data.id, tenantId: data.tenant_id };
}

const ROLES_OPERATIVOS = ["recepcion", "enfermeria", "facturacion"];

/**
 * Contexto para el personal operativo (Día 29, Etapa 3): recepción, enfermería y
 * facturación no tienen fila en `medicos`; operan sobre el consultorio al que
 * pertenecen. Es un helper APARTE de `resolveMedicoContext` a propósito: solo lo
 * usan los handlers de agenda/citas/pacientes que esos roles necesitan. Los de
 * firma, recetas y EHR siguen exigiendo ser el médico (mínimo privilegio). La RLS
 * por lista blanca sigue siendo la barrera real. El tenant sale de
 * `roles_usuario` del propio usuario, nunca del cliente.
 */
export async function resolveContextoConsultorio(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<MedicoContext> {
  const { data: propio, error } = await supabase
    .from("medicos")
    .select("id, tenant_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (propio) return { medicoId: propio.id, tenantId: propio.tenant_id };

  const { data: roles, error: errRol } = await supabase
    .from("roles_usuario")
    .select("tenant_id, rol")
    .eq("user_id", userId)
    .order("tenant_id", { ascending: true });
  if (errRol) throw new Error(errRol.message);
  const fila = (roles ?? []).find((r) => ROLES_OPERATIVOS.includes(String(r.rol)));
  if (!fila) {
    throw new Error(
      "No existe un perfil de médico vinculado a esta cuenta. Completa el registro médico primero.",
    );
  }
  // Día 29D: recepción/enfermería/facturación ya no pueden leer `medicos`
  // (firma, CMP, contacto, bot). Solo necesitan el id: vista `medicos_equipo_basico`.
  const { data: medico, error: errMed } = await supabase
    .from("medicos_equipo_basico")
    .select("id, tenant_id")
    .eq("tenant_id", fila.tenant_id)
    .order("id", { ascending: true }) // la vista no expone created_at; orden estable por id
    .limit(1)
    .maybeSingle();
  if (errMed) throw new Error("No se pudo cargar el consultorio. Inténtalo de nuevo.");
  if (!medico?.id || !medico.tenant_id) throw new Error("El consultorio no tiene un médico titular configurado.");
  return { medicoId: medico.id, tenantId: medico.tenant_id };
}

/**
 * Para acciones que la RLS reserva al médico titular (borrar citas/pacientes,
 * editar tipos de consulta y horarios). Falla con un mensaje fijo y claro en vez
 * de dejar que la base devuelva un error crudo o un éxito falso con 0 filas.
 */
export async function resolveMedicoTitular(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<MedicoContext> {
  const { data, error } = await supabase
    .from("medicos")
    .select("id, tenant_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error("No se pudo verificar tu perfil. Inténtalo de nuevo.");
  if (!data) throw new Error("Esta acción solo la puede realizar el médico titular del consultorio.");
  return { medicoId: data.id, tenantId: data.tenant_id };
}

export async function resolveMedicoId(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<string> {
  return (await resolveMedicoContext(supabase, userId)).medicoId;
}

type ClienteConteo = {
  from: (t: string) => {
    select: (
      c: string,
      o: { count: "exact"; head: true },
    ) => { eq: (col: string, v: string) => PromiseLike<{ count: number | null; error: unknown }> };
  };
};

/**
 * Tablas con registros que NO deben perderse al borrar una fila padre. Varias FK son
 * ON DELETE CASCADE (historia clínica, recetas, órdenes, pagos): borrar arrastraría
 * documentos médico-legales (NTS 139) y el libro de pagos. Se comprueba ANTES de borrar.
 */
const DEPENDENCIAS_PACIENTE = [
  "atenciones_medicas",
  "recetas",
  "ordenes_laboratorio",
  "ordenes_imagen",
  "triaje_precita",
  "seguimientos_cronicos",
  "audio_sesiones",
  "audio_consentimientos",
] as const;
const DEPENDENCIAS_CITA = [
  "atenciones_medicas",
  "recetas",
  "ordenes_laboratorio",
  "ordenes_imagen",
  "pagos_cita",
  "triaje_precita",
  "audio_sesiones",
  "audio_consentimientos",
] as const;

async function tieneRegistros(
  supabase: unknown,
  tablas: readonly string[],
  columna: string,
  id: string,
): Promise<boolean> {
  const db = supabase as ClienteConteo;
  for (const tabla of tablas) {
    const { count, error } = await db.from(tabla).select("id", { count: "exact", head: true }).eq(columna, id);
    // Ante la duda (error de lectura) se bloquea: borrar es irreversible.
    if (error || (count ?? 0) > 0) return true;
  }
  return false;
}

export async function pacienteTieneRegistros(supabase: unknown, pacienteId: string) {
  return tieneRegistros(supabase, DEPENDENCIAS_PACIENTE, "paciente_id", pacienteId);
}

export async function citaTieneRegistros(supabase: unknown, citaId: string) {
  return tieneRegistros(supabase, DEPENDENCIAS_CITA, "cita_id", citaId);
}
