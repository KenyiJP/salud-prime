import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ROLES_MARCA, useAuth } from "@/lib/auth-context";

function Pantalla({ children }: { children: ReactNode }) {
  return (
    <div className="dark flex min-h-screen w-full items-center justify-center bg-background px-4 text-foreground">
      {children}
    </div>
  );
}

/**
 * Guard para rutas compartidas entre personal clínico y marketing
 * (`founder`, `medico`, `community_manager`): a diferencia de
 * `RequireClinicalAccess`, aquí NO se expulsa a `community_manager` — el
 * Panel de Marca (`landing_config`/`landing_servicios`/`landing_testimonios`)
 * es precisamente la superficie que ese rol necesita administrar. RLS en
 * cada tabla ya filtra por `tenant_id`, así que basta con exigir sesión y
 * cualquier rol asignado.
 */
export function RequireTenantAccess({ children }: { children: ReactNode }) {
  const { session, rol, loading, signOut } = useAuth();
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

  // Día 29C: la RLS de landing/storage solo admite founder, medico y
  // community_manager; el resto de roles vería errores al guardar o subir.
  if (rol && !ROLES_MARCA.includes(rol)) {
    return (
      <Pantalla>
        <div className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">Tu rol no tiene acceso al panel de marca.</p>
          <button
            type="button"
            onClick={async () => { await signOut(); navigate({ to: "/login", replace: true }); }}
            className="rounded-md border border-border px-3 py-1.5 text-xs text-foreground hover:bg-accent"
          >
            Cerrar sesión
          </button>
        </div>
      </Pantalla>
    );
  }

  return <>{children}</>;
}
