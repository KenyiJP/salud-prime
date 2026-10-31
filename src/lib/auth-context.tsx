import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fijarUsuarioActivo, usuarioActivoId } from "@/lib/query-scope";

import type { Rol } from "./acceso-roles";
export { rutaInicialPorRol } from "./acceso-roles";

export type RolUsuario = Rol;

// `src/integrations/supabase/types.ts` is stale (regenerated in a separate task),
// so we read `roles_usuario` through an untyped view of the same client.
const db = supabase as unknown as SupabaseClient<any>;

// Lista blanca alineada con la RLS del Día 29B: solo el titular accede al panel
// clínico completo. Recepción, enfermería y facturación tienen vistas propias
// (ver `acceso-roles.ts`, única tabla de acceso por ruta).
export const ROLES_CLINICOS: RolUsuario[] = ["founder", "medico"];

// Roles que ven el plan y la suscripción del consultorio (RLS de `suscripciones`).
export const ROLES_SUSCRIPCION: RolUsuario[] = ["founder", "medico", "facturacion"];

// Roles que administran marca, landing y reseñas (RLS de `resenas` y storage
// `landing-media`, Día 29C).
export const ROLES_MARCA: RolUsuario[] = ["founder", "medico", "community_manager"];

// A founder can read other members of their own tenant, so we must scope the
// role lookup to the authenticated user (never to tenant_id by hand).
const PRIORIDAD_ROL: RolUsuario[] = [
  "founder",
  "medico",
  "enfermeria",
  "recepcion",
  "facturacion",
  "community_manager",
  "asistente",
];

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
  const pedidoRolRef = useRef(0);
  const userIdRef = useRef<string | null>(null);

  const loadRol = useCallback(async (activeSession: Session | null) => {
    if (!activeSession) {
      setRol(null);
      return;
    }
    const pedido = ++pedidoRolRef.current;
    try {
      const nuevo = await fetchRolActual();
      if (pedido === pedidoRolRef.current) setRol(nuevo);
    } catch {
      // Error de red/5xx: se conserva el rol anterior en vez de simular «sin rol».
      if (pedido === pedidoRolRef.current && !userIdRef.current) setRol(null);
    }
  }, []);

  // Cargas de rol en vuelo. `loading` solo baja cuando termina la ÚLTIMA: la carga inicial
  // (getSession) y la que dispara INITIAL_SESSION corren a la vez, y la primera en terminar
  // dejaba `loading=false` con `rol=null` (la segunda aún no publicaba) → el guard mandaba
  // a «pendiente de activación» a una cuenta que sí tiene rol (≈1 de cada 14 cargas en frío).
  const cargasEnVueloRef = useRef(0);

  useEffect(() => {
    let active = true;

    const cargarRolConEstado = async (activeSession: Session | null) => {
      cargasEnVueloRef.current += 1;
      try {
        await loadRol(activeSession);
      } finally {
        cargasEnVueloRef.current -= 1;
        if (active && cargasEnVueloRef.current === 0) setLoading(false);
      }
    };

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      userIdRef.current = data.session?.user.id ?? null;
      fijarUsuarioActivo(userIdRef.current);
      setSession(data.session);
      await cargarRolConEstado(data.session);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === "TOKEN_REFRESHED") {
        setSession(nextSession);
        return;
      }
      // SIGNED_IN, USER_UPDATED, INITIAL_SESSION… se re-emiten con la misma cuenta:
      // no hay que volver a cargar el rol ni desmontar la pantalla (se perdería lo tecleado).
      if (event !== "SIGNED_OUT" && nextSession?.user.id && nextSession.user.id === userIdRef.current) {
        setSession(nextSession);
        return;
      }
      // F1: cambio de identidad (otra cuenta, sesión vencida o cierre de sesión). Se vacía la caché
      // ANTES de publicar la nueva sesión y el rol, y se cancelan las consultas en vuelo para que
      // ninguna respuesta de la cuenta anterior se escriba después de la limpieza.
      // Primera emisión tras la carga: la identidad previa es la que fijó el guard de ruta (no se
      // vacía la caché de la propia cuenta, que ya pudo precargar datos).
      const idNuevo = nextSession?.user.id ?? null;
      const idPrevio = userIdRef.current ?? usuarioActivoId();
      if (idPrevio !== idNuevo) {
        void queryClient.cancelQueries();
        queryClient.clear();
      }
      userIdRef.current = nextSession?.user.id ?? null;
      fijarUsuarioActivo(userIdRef.current);
      setRol(null); // otra cuenta (o cierre de sesión): jamás heredar el rol anterior
      setSession(nextSession);
      setLoading(true);
      void cargarRolConEstado(nextSession);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [loadRol, queryClient]);

  const refreshRol = useCallback(async () => {
    await loadRol(session);
  }, [loadRol, session]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    // Evita que otra cuenta en el mismo navegador vea datos en caché de la sesión anterior.
    void queryClient.cancelQueries();
    queryClient.clear();
    userIdRef.current = null;
    fijarUsuarioActivo(null);
    setSession(null);
    setRol(null);
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
