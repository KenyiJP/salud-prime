import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type TenantContext = { tenantId: string };

/**
 * `landing_config`/`landing_servicios`/`landing_testimonios` se gestionan
 * por cualquier miembro del tenant (médico, founder o community_manager),
 * a diferencia de las tablas clínicas que se resuelven por `medico_id`. RLS
 * en las tres tablas ya exige `tenant_id = ANY(tenant_ids_for_current_user())`,
 * así que basta con leer el primer tenant del usuario desde `roles_usuario`
 * para saber a qué fila apuntar (`tenant_id` nunca se acepta del cliente).
 */
export async function resolveTenantContext(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<TenantContext> {
  const { data, error } = await supabase
    .from("roles_usuario")
    .select("tenant_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) {
    throw new Error("Tu cuenta todavía no está asociada a ningún consultorio.");
  }
  return { tenantId: data.tenant_id };
}
