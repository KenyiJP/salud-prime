import { createFileRoute } from "@tanstack/react-router";
import { FileHeart, Search, UserPlus } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { PageHeader, PlaceholderCard } from "@/components/page-primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/fichas")({
  head: () => ({ meta: [{ title: "Fichas Clínicas (EHR) — MediSuite" }] }),
  component: FichasPage,
});

function FichasPage() {
  return (
    <DashboardShell>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Historia clínica"
          title="Fichas Clínicas (EHR)"
          description="Registra antecedentes, evoluciones, exámenes y adjuntos siguiendo la norma técnica del MINSA."
          actions={
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" /> Nuevo paciente
            </Button>
          }
        />

        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por DNI, nombre o historia…" className="h-10 pl-9" />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <PlaceholderCard
            icon={<FileHeart className="h-5 w-5" />}
            title="Listado de pacientes"
            description="La tabla de pacientes con filtros por edad, patología y última visita aparecerá aquí."
          />
          <PlaceholderCard
            icon={<FileHeart className="h-5 w-5" />}
            title="Plantillas SOAP"
            description="Crea evoluciones estructuradas con plantillas específicas por especialidad."
          />
        </div>
      </div>
    </DashboardShell>
  );
}
