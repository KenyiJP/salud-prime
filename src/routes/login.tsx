import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Stethoscope } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchRolActual, rutaInicialPorRol } from "@/lib/auth-context";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Iniciar sesión — MediSuite Perú" },
      {
        name: "description",
        content:
          "Accede a tu consultorio digital MediSuite: agenda, fichas clínicas y facturación para médicos independientes en Perú.",
      },
      { property: "og:title", content: "Iniciar sesión — MediSuite Perú" },
      {
        property: "og:description",
        content: "Ingresa con tu cuenta MediSuite para gestionar tu consultorio.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setLoading(false);
      setError("Credenciales inválidas. Verifica tu correo y contraseña.");
      return;
    }

    try {
      const rol = await fetchRolActual();
      if (!rol) {
        setLoading(false);
        navigate({ to: "/pendiente-activacion", replace: true });
        return;
      }
      navigate({ to: rutaInicialPorRol(rol), replace: true });
    } catch {
      setLoading(false);
      navigate({ to: "/pendiente-activacion", replace: true });
    }
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
          <h1 className="font-display text-xl font-semibold">Iniciar sesión</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ingresa con la cuenta de tu consultorio.
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
                autoComplete="current-password"
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
              {loading ? "Ingresando…" : "Ingresar"}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          ¿No tienes cuenta?{" "}
          <Link to="/registro" className="text-primary underline-offset-4 hover:underline">
            Crear cuenta
          </Link>
        </p>
      </div>
    </div>
  );
}
