import { redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

// Client-side route guard: every dashboard route uses `ssr: false`, so the
// Supabase session (localStorage) is available here.
export async function requireSession() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw redirect({ to: "/login" });
  }
  return { user: data.user };
}
