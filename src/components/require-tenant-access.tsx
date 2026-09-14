import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";

function Pantalla({ children }: { children: ReactNode }) {
  return (
    <div className="dark flex min-h-screen w-full items-center justify-center bg-background px-4 text-foreground">
      {children}
    </div>
  );
}

/**
 * Guard para rutas compartidas entre personal clínico y marketing
 * (`founder`, `medico`, `asistente`, `community_manager`): a diferencia de
 * `RequireClinicalAccess`, aquí NO se expulsa a `community_manager` — el
 * Panel de Marca (`landing_config`/`landing_servicios`/`landing_testimonios`)
 * es precisamente la superficie que ese rol necesita administrar. RLS en
 * cada tabla ya filtra por `tenant_id`, así que basta con exigir sesión y
 * cualquier rol asignado.
 */
export function RequireTenantAccess({ children }: { children: ReactNode }) {
  const { session, rol, loading } = useAuth();
  const navigate = useNavigate();

  const sinSesion = !loading && !session;
  const sinRol = !loading && !!session && rol === null;

  useEffect(() => {
    if (sinSesion) navigate({ to: "/login", replace: true });
    else if (sinRol) navigate({ to: "/pendiente-activacion", replace: true });
  }, [sinSesion, sinRol, navigate]);

  if (loading || sinSesion || sinRol) {
    return (
      <Pantalla>
        <p className="text-sm text-muted-foreground">Verificando sesión…</p>
      </Pantalla>
    );
  }

  return <>{children}</>;
}
