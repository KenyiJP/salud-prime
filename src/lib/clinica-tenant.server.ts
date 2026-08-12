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

export async function resolveMedicoId(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<string> {
  return (await resolveMedicoContext(supabase, userId)).medicoId;
}
