import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, Clock, Plus } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { PageHeader, PlaceholderCard } from "@/components/page-primitives";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/calendario")({
  head: () => ({ meta: [{ title: "Calendario de Citas — MediSuite" }] }),
  component: CalendarioPage,
});

function CalendarioPage() {
  return (
    <DashboardShell>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Agenda"
          title="Calendario de Citas"
          description="Gestiona tu disponibilidad, reservas online y recordatorios automáticos por WhatsApp y correo."
          actions={
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Nueva cita
            </Button>
          }
        />

        <div className="grid gap-4 md:grid-cols-3">
          <PlaceholderCard
            icon={<CalendarDays className="h-5 w-5" />}
            title="Vista semanal"
            description="El calendario semanal con drag-and-drop se mostrará aquí."
          />
          <PlaceholderCard
            icon={<Clock className="h-5 w-5" />}
            title="Bloques de disponibilidad"
            description="Define horarios de atención por sede y tipo de consulta."
          />
          <PlaceholderCard
            icon={<Plus className="h-5 w-5" />}
            title="Reserva online"
            description="Comparte un enlace público para que pacientes agenden solos."
          />
        </div>

        <div className="grid h-[420px] place-items-center rounded-xl border border-dashed border-border/60 bg-card/40 text-sm text-muted-foreground">
          Vista de calendario próximamente
        </div>
      </div>
    </DashboardShell>
  );
}
