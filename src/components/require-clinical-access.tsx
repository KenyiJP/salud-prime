import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ROLES_CLINICOS, useAuth } from "@/lib/auth-context";

function Pantalla({ children }: { children: ReactNode }) {
  return (
    <div className="dark flex min-h-screen w-full items-center justify-center bg-background px-4 text-foreground">
      {children}
    </div>
  );
}

/**
 * Real session gate for the clinical dashboard. Routes already redirect
 * unauthenticated users in `beforeLoad`; this handles role-based access
 * (community_manager has no RLS access to pacientes/citas).
 */
export function RequireClinicalAccess({ children }: { children: ReactNode }) {
  const { session, rol, loading } = useAuth();
  const navigate = useNavigate();

  const sinSesion = !loading && !session;
  const esCommunity = rol === "community_manager";
  const sinRol = !loading && !!session && rol === null;

  useEffect(() => {
    if (sinSesion) navigate({ to: "/login", replace: true });
    else if (!loading && esCommunity) navigate({ to: "/perfil-consultorio", replace: true });
    else if (sinRol) navigate({ to: "/pendiente-activacion", replace: true });
  }, [sinSesion, esCommunity, sinRol, loading, navigate]);

  if (loading || sinSesion || sinRol || esCommunity) {
    return (
      <Pantalla>
        <p className="text-sm text-muted-foreground">Verificando sesión…</p>
      </Pantalla>
    );
  }

  if (rol && !ROLES_CLINICOS.includes(rol)) {
    return (
      <Pantalla>
        <p className="text-sm text-muted-foreground">
          Tu rol no tiene acceso al panel clínico.
        </p>
      </Pantalla>
    );
  }

  return <>{children}</>;
}
