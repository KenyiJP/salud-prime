import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Stethoscope } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { leerInvitacionPendiente } from "@/lib/invitacion-pendiente";

export const Route = createFileRoute("/registro")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Crear cuenta — MediSuite Perú" },
      {
        name: "description",
        content:
          "Crea tu cuenta MediSuite para gestionar agenda, historia clínica y facturación de tu consultorio en Perú.",
      },
      { property: "og:title", content: "Crear cuenta — MediSuite Perú" },
      {
        property: "og:description",
        content: "Registro de médicos independientes en la plataforma MediSuite.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RegistroPage,
});

function RegistroPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creada, setCreada] = useState(false);
  const tieneInvitacion = typeof window !== "undefined" && leerInvitacionPendiente() !== null;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        // Con invitación pendiente, la confirmación del correo debe volver a /unirse.
        emailRedirectTo: `${window.location.origin}${leerInvitacionPendiente() ? "/unirse" : "/login"}`,
      },
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    // La cuenta nueva todavía no tiene fila en `roles_usuario`: no hay flujo de
    // alta de tenant aún, así que nunca redirigimos al panel clínico.
    await supabase.auth.signOut();
    setCreada(true);
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
            <p className="text-xs text-muted-foreground">Salud Digital · Perú</p>
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-6">
          {creada ? (
            <div className="space-y-3 text-center">
              <CheckCircle2 className="mx-auto h-9 w-9 text-primary" />
              <h1 className="font-display text-xl font-semibold">Cuenta creada</h1>
              <p className="text-sm text-muted-foreground">
                {tieneInvitacion
                  ? "Tu cuenta fue creada. Confirma tu correo y luego inicia sesión desde el mismo navegador: te llevaremos a aceptar la invitación."
                  : "Tu cuenta fue creada. Un administrador debe activarla antes de que puedas acceder al panel."}
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link to="/login">Volver a iniciar sesión</Link>
              </Button>
            </div>
          ) : (
            <>
              <h1 className="font-display text-xl font-semibold">Crear cuenta</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Regístrate con tu correo profesional.
              </p>

              <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                {error ? (
                  <p role="alert" className="text-sm text-destructive">
                    {error}
                  </p>
                ) : null}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creando cuenta…" : "Crear cuenta"}
                </Button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="text-primary underline-offset-4 hover:underline">
            Iniciar sesión
          </Link>
        </p>

        <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-xs text-muted-foreground/80">
          <Link to="/terminos" className="hover:underline">
            Términos
          </Link>
          <span>·</span>
          <Link to="/privacidad" className="hover:underline">
            Privacidad
          </Link>
          <span>·</span>
          <Link to="/reembolso" className="hover:underline">
            Reembolsos
          </Link>
          <span>·</span>
          <Link to="/libro-reclamaciones" className="hover:underline">
            Libro de Reclamaciones
          </Link>
        </p>
      </div>
    </div>
  );
}
