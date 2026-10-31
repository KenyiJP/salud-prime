import { redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { fijarUsuarioActivo } from "@/lib/query-scope";

// Client-side route guard: every dashboard route uses `ssr: false`, so the
// Supabase session (localStorage) is available here.
export async function requireSession() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    fijarUsuarioActivo(null);
    throw redirect({ to: "/login" });
  }
  // F1: las claves de consulta llevan el user.id; los loaders de ruta corren después de este guard.
  fijarUsuarioActivo(data.user.id);
  return { user: data.user };
}
