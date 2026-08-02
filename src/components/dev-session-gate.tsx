import { ReactNode, useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

// TEMPORARY for Día 4 testing only — remove once Día 5 ships real login/signup.
const DEMO_EMAIL = "medico.demo@proyectomateo.pe";
const DEMO_PASSWORD = "MateoDemo2026!";

function useSupabaseSessionStatus() {
  const [status, setStatus] = useState<"loading" | "authenticated" | "anonymous">("loading");

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) setStatus(data.session ? "authenticated" : "anonymous");
    });
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setStatus(session ? "authenticated" : "anonymous");
    });
    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  return status;
}

function DemoSignIn() {
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
    });
    setLoading(false);
    if (error) {
      toast.error(`No se pudo iniciar sesión: ${error.message}`);
      return;
    }
  }

  return (
    <div className="dark flex min-h-screen w-full items-center justify-center bg-background px-4 text-foreground">
      <div className="max-w-sm space-y-4 rounded-xl border border-border/60 bg-card p-8 text-center">
        <h1 className="font-display text-xl font-semibold">Sesión requerida</h1>
        <p className="text-sm text-muted-foreground">
          El módulo de autenticación (Día 5) aún no está listo. Ingresa con la cuenta médica de
          prueba para validar el registro de pacientes y citas de hoy.
        </p>
        <Button className="w-full" disabled={loading} onClick={handleSignIn}>
          {loading ? "Ingresando…" : "Ingresar como médico de prueba"}
        </Button>
      </div>
    </div>
  );
}

export function RequireDemoSession({ children }: { children: ReactNode }) {
  const status = useSupabaseSessionStatus();

  if (status === "loading") {
    return (
      <div className="dark flex min-h-screen w-full items-center justify-center bg-background text-foreground">
        <p className="text-sm text-muted-foreground">Cargando sesión…</p>
      </div>
    );
  }

  if (status === "anonymous") {
    return <DemoSignIn />;
  }

  return <>{children}</>;
}
