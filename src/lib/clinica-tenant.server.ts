import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

// Resolves the médico owned by the authenticated user; RLS on `medicos`
// already scopes this to auth.uid(), this just gives us the id to filter by.
// `medico_id` is NEVER accepted from the client.
export async function resolveMedicoId(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<string> {
  const { data, error } = await supabase
    .from("medicos")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) {
    throw new Error(
      "No existe un perfil de médico vinculado a esta cuenta. Completa el registro médico primero.",
    );
  }
  return data.id;
}
