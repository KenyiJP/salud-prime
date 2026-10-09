import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type RolUsuario = "founder" | "medico" | "community_manager" | "asistente";

// `src/integrations/supabase/types.ts` is stale (regenerated in a separate task),
// so we read `roles_usuario` through an untyped view of the same client.
const db = supabase as unknown as SupabaseClient<any>;

export const ROLES_CLINICOS: RolUsuario[] = ["founder", "medico", "asistente"];

export function rutaInicialPorRol(rol: RolUsuario | null): string {
  if (rol === "community_manager") return "/perfil-consultorio";
  return "/";
}

// A founder can read other members of their own tenant, so we must scope the
// role lookup to the authenticated user (never to tenant_id by hand).
const PRIORIDAD_ROL: RolUsuario[] = ["founder", "medico", "asistente", "community_manager"];

export async function fetchRolActual(): Promise<RolUsuario | null> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return null;

  const { data, error } = await db
    .from("roles_usuario")
    .select("rol")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);

  const roles = (data ?? []).map((r: { rol: RolUsuario }) => r.rol);
  return PRIORIDAD_ROL.find((rol) => roles.includes(rol)) ?? null;
}

type AuthState = {
  session: Session | null;
  user: User | null;
  rol: RolUsuario | null;
  loading: boolean;
  refreshRol: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [rol, setRol] = useState<RolUsuario | null>(null);
  const [loading, setLoading] = useState(true);

  const loadRol = useCallback(async (activeSession: Session | null) => {
    if (!activeSession) {
      setRol(null);
      return;
    }
    try {
      setRol(await fetchRolActual());
    } catch {
      setRol(null);
    }
  }, []);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      await loadRol(data.session);
      if (active) setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === "TOKEN_REFRESHED") {
        setSession(nextSession);
        return;
      }
      setSession(nextSession);
      setLoading(true);
      void loadRol(nextSession).then(() => setLoading(false));
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [loadRol]);

  const refreshRol = useCallback(async () => {
    await loadRol(session);
  }, [loadRol, session]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setRol(null);
    // Evita que otra cuenta en el mismo navegador vea datos en caché de la sesión anterior.
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo<AuthState>(
    () => ({ session, user: session?.user ?? null, rol, loading, refreshRol, signOut }),
    [session, rol, loading, refreshRol, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
