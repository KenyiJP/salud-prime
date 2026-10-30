import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { leerInvitacionPendiente } from "@/lib/invitacion-pendiente";

export const Route = createFileRoute("/pendiente-activacion")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Cuenta pendiente de activación — MediSuite" },
      {
        name: "description",
        content:
          "Tu cuenta MediSuite fue creada y espera activación por parte de un administrador del consultorio.",
      },
      { property: "og:title", content: "Cuenta pendiente de activación — MediSuite" },
      {
        property: "og:description",
        content: "Un administrador debe activar tu cuenta antes de acceder al panel clínico.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PendienteActivacionPage,
});

function PendienteActivacionPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // Invitado que confirmó su correo en otra pestaña: llevarlo a canjear la invitación.
  useEffect(() => {
    if (leerInvitacionPendiente()) navigate({ to: "/unirse", replace: true });
  }, [navigate]);

  async function handleSignOut() {
    await signOut();
    navigate({ to: "/login", replace: true });
  }

  return (
    <div className="dark flex min-h-screen w-full items-center justify-center bg-background px-4 text-foreground">
      <div className="max-w-md space-y-4 rounded-xl border border-border/60 bg-card p-8 text-center">
        <Clock className="mx-auto h-9 w-9 text-primary" />
        <h1 className="font-display text-xl font-semibold">Cuenta pendiente de activación</h1>
        <p className="text-sm text-muted-foreground">
          {user?.email ? `La cuenta ${user.email} ` : "Tu cuenta "}
          existe pero todavía no tiene un rol asignado en ningún consultorio. Un administrador
          debe activarla antes de que puedas acceder al panel. Si te enviaron un enlace de invitación,
          vuelve a abrirlo para unirte al consultorio.
        </p>
        <Button variant="outline" className="w-full" onClick={handleSignOut}>
          Cerrar sesión
        </Button>
      </div>
    </div>
  );
}
