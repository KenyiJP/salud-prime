import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { aceptarInvitacion } from "@/lib/equipo.queries";
import { mensajeEquipo, tokenDeHash } from "@/lib/equipo-utils";
import {
  borrarInvitacionPendiente,
  guardarInvitacionPendiente,
  leerInvitacionPendiente,
} from "@/lib/invitacion-pendiente";
import { rutaInicialPorRol, useAuth, type RolUsuario } from "@/lib/auth-context";

export const Route = createFileRoute("/unirse")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Unirse a un consultorio — MediSuite" },
      { name: "robots", content: "noindex, nofollow" },
      // El token viaja en el fragmento; esto evita además que salga por Referer.
      { name: "referrer", content: "no-referrer" },
    ],
  }),
  component: UnirsePage,
});

function UnirsePage() {
  const { user, rol, loading, refreshRol, signOut } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [listo, setListo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1) Capturar el token del fragmento y sacarlo de la URL de inmediato. También
  //    reacciona si se pega otro enlace en la misma pestaña (cambia solo el hash).
  useEffect(() => {
    function capturar() {
      const hash = window.location.hash;
      const delHash = tokenDeHash(hash);
      if (delHash) guardarInvitacionPendiente(delHash);
      if (hash.startsWith("#token=") || hash.startsWith("#token%3D")) {
        window.history.replaceState(window.history.state, "", window.location.pathname);
      }
      setToken(delHash ?? leerInvitacionPendiente());
      setListo(true);
    }
    capturar();
    window.addEventListener("hashchange", capturar);
    return () => window.removeEventListener("hashchange", capturar);
  }, []);

  async function aceptar() {
    if (!token || enviando) return;
    setEnviando(true);
    setError(null);
    try {
      const r = await aceptarInvitacion(token);
      if (!r.ok) {
        setEnviando(false);
        // Token usado/vencido/revocado o cuenta que ya pertenece a un consultorio: ya no sirve guardarlo.
        if (["invitacion_invalida", "ya_usada", "ya_miembro", "ya_pertenece_a_otro_consultorio"].includes(r.codigo)) {
          borrarInvitacionPendiente();
          setToken(null);
        }
        setError(mensajeEquipo(r.codigo));
        return;
      }
      borrarInvitacionPendiente();
      try {
        await refreshRol();
      } catch {
        /* el canje ya ocurrió: recargamos abajo para releer el rol */
      }
      const destino = rutaInicialPorRol(r.rol as RolUsuario);
      // Recarga completa: garantiza rol y caché frescos aunque refreshRol haya fallado.
      window.location.assign(destino);
    } catch {
      setEnviando(false);
      setError("No se pudo completar la invitación. Inténtalo de nuevo.");
    }
  }

  async function usarOtraCuenta() {
    await signOut();
  }

  return (
    <div className="dark flex min-h-screen w-full items-center justify-center bg-background px-4 py-12 text-foreground">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/30">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display text-base font-semibold">MediSuite</p>
            <p className="text-xs text-muted-foreground">Invitación a un consultorio</p>
          </div>
        </div>

        <div className="space-y-4 rounded-xl border border-border/60 bg-card p-6">
          {!listo || loading ? (
            <p className="text-sm text-muted-foreground">Verificando invitación…</p>
          ) : !token ? (
            <>
              <h1 className="text-lg font-semibold">Invitación no disponible</h1>
              <p className="text-sm text-muted-foreground">
                {error ??
                  "El enlace no es válido, venció o ya fue usado. Pide al titular del consultorio que genere una invitación nueva."}
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link to="/login">Ir a iniciar sesión</Link>
              </Button>
            </>
          ) : !user ? (
            <>
              <h1 className="text-lg font-semibold">Te invitaron a un consultorio</h1>
              <p className="text-sm text-muted-foreground">
                Inicia sesión o crea tu cuenta. Luego volverás aquí para aceptar la invitación.
              </p>
              <div className="grid gap-2">
                <Button asChild>
                  <Link to="/login">Ya tengo cuenta</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/registro">Crear cuenta</Link>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Si confirmas tu correo desde otra pestaña, vuelve a abrir el enlace original de la invitación.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-lg font-semibold">Aceptar invitación</h1>
              <p className="text-sm text-muted-foreground">
                Te unirás al consultorio con la cuenta <strong className="text-foreground">{user.email}</strong>.
                El rol que recibirás lo definió el titular al invitarte.
              </p>
              {error ? (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              ) : null}
              <Button className="w-full" onClick={aceptar} disabled={enviando}>
                {enviando ? "Uniéndote…" : "Aceptar y unirme"}
              </Button>
              {rol ? (
                <Button asChild variant="outline" className="w-full">
                  <Link to={rutaInicialPorRol(rol)} onClick={borrarInvitacionPendiente}>
                    Ya tengo acceso: ir a mi panel
                  </Link>
                </Button>
              ) : null}
              <Button variant="ghost" className="w-full" onClick={usarOtraCuenta} disabled={enviando}>
                No soy yo / usar otra cuenta
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
