import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Building2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { requireSession } from "@/lib/auth-guard";

export const Route = createFileRoute("/perfil-consultorio")({
  ssr: false,
  beforeLoad: () => requireSession(),
  head: () => ({
    meta: [
      { title: "Perfil del Consultorio — MediSuite" },
      {
        name: "description",
        content:
          "Espacio de gestión de la ficha pública del consultorio para community managers de MediSuite.",
      },
      { property: "og:title", content: "Perfil del Consultorio — MediSuite" },
      {
        property: "og:description",
        content: "Gestión de la presencia pública del consultorio médico en MediSuite.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PerfilConsultorioPage,
});

function PerfilConsultorioPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate({ to: "/login", replace: true });
  }

  return (
    <div className="dark min-h-screen w-full bg-background text-foreground">
      <header className="flex h-14 items-center justify-between border-b border-border/60 px-4 sm:px-8">
        <p className="font-display text-sm font-semibold">MediSuite · Community</p>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-muted-foreground sm:inline">{user?.email}</span>
          <Button variant="outline" size="sm" className="gap-2" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-8">
        <p className="text-xs uppercase tracking-widest text-primary">Marketing clínico</p>
        <h1 className="mt-2 font-display text-2xl font-semibold">Perfil del Consultorio</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Este espacio es para la gestión de la presencia pública del consultorio. Por seguridad
          y cumplimiento de la Ley 29733, tu rol no accede a datos clínicos de pacientes ni a la
          agenda médica.
        </p>

        <div className="mt-8 rounded-xl border border-border/60 bg-card p-8">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/30">
            <Building2 className="h-5 w-5" />
          </div>
          <h2 className="mt-4 font-display text-base font-semibold">
            Próximamente: gestión de la ficha pública del consultorio
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Aquí podrás editar datos de contacto, especialidades, horarios visibles y contenido
            promocional del consultorio.
          </p>
        </div>
      </main>
    </div>
  );
}
