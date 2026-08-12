import { createFileRoute } from "@tanstack/react-router";
import { requireSession } from "@/lib/auth-guard";
import { Pill, ShieldCheck, Sparkles } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { PageHeader, PlaceholderCard } from "@/components/page-primitives";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/recetario")({
  ssr: false,
  beforeLoad: () => requireSession(),
  head: () => ({ meta: [{ title: "Recetario Inteligente — MediSuite" }] }),
  component: RecetarioPage,
});

function RecetarioPage() {
  return (
    <DashboardShell>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Prescripción"
          title="Recetario Inteligente"
          description="Emite recetas digitales con verificación de interacciones, dosis pediátricas y envío directo al paciente."
          actions={
            <Button className="gap-2">
              <Sparkles className="h-4 w-4" /> Nueva receta
            </Button>
          }
        />

        <div className="grid gap-4 md:grid-cols-3">
          <PlaceholderCard
            icon={<Pill className="h-5 w-5" />}
            title="Vademécum"
            description="Base de medicamentos con presentación, laboratorio y precio referencial."
          />
          <PlaceholderCard
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Interacciones"
            description="Alertas de contraindicaciones y ajuste renal se mostrarán al prescribir."
          />
          <PlaceholderCard
            icon={<Sparkles className="h-5 w-5" />}
            title="Sugerencias IA"
            description="Autocompletado de indicaciones frecuentes basado en tu historial de prescripción."
          />
        </div>
      </div>
    </DashboardShell>
  );
}
