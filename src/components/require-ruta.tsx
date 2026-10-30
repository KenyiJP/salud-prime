import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { puedeVerRuta, rutaAlternativa } from "@/lib/acceso-roles";
import { leerInvitacionPendiente } from "@/lib/invitacion-pendiente";

function Pantalla({ children }: { children: ReactNode }) {
  return (
    <div className="dark flex min-h-screen w-full items-center justify-center bg-background px-4 text-foreground">
      {children}
    </div>
  );
}

/**
 * Guard por ruta (Día 29, Etapa 3): decide con la tabla `ACCESO_RUTAS`. Es una
 * ayuda de interfaz; la barrera real es la RLS por lista blanca (Día 29B).
 * Uso: `const Guard = guardPorRuta("/calendario")` y `<DashboardShell Guard={Guard}>`.
 */
export function guardPorRuta(ruta: string) {
  return function RequireRuta({ children }: { children: ReactNode }) {
    const { session, rol, loading, signOut } = useAuth();
    const navigate = useNavigate();

    const sinSesion = !loading && !session;
    const sinRol = !loading && !!session && rol === null;

    useEffect(() => {
      if (sinSesion) navigate({ to: "/login", replace: true });
      else if (sinRol) {
        navigate({ to: leerInvitacionPendiente() ? "/unirse" : "/pendiente-activacion", replace: true });
      }
    }, [sinSesion, sinRol, navigate]);

    if (loading || sinSesion || sinRol) {
      return (
        <Pantalla>
          <p className="text-sm text-muted-foreground">Verificando sesión…</p>
        </Pantalla>
      );
    }

    if (!puedeVerRuta(rol, ruta)) {
      const destino = rutaAlternativa(rol);
      return (
        <Pantalla>
          <div className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">Tu rol no tiene acceso a esta pantalla.</p>
            <div className="flex items-center justify-center gap-2">
              {destino !== ruta && puedeVerRuta(rol, destino) ? (
                <button
                  type="button"
                  onClick={() => navigate({ to: destino, replace: true })}
                  className="rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:opacity-90"
                >
                  Ir a mi pantalla
                </button>
              ) : null}
              <button
                type="button"
                onClick={async () => {
                  await signOut();
                  navigate({ to: "/login", replace: true });
                }}
                className="rounded-md border border-border px-3 py-1.5 text-xs text-foreground hover:bg-accent"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </Pantalla>
      );
    }

    return <>{children}</>;
  };
}
