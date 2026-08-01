import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { CalendarDays, Clock, Plus } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { PageHeader, PlaceholderCard } from "@/components/page-primitives";
import { Button } from "@/components/ui/button";
import {
  citasQuery,
  fechaCorta,
  horaCorta,
  nombreCompleto,
} from "@/lib/clinica-queries";

export const Route = createFileRoute("/calendario")({
  head: () => ({
    meta: [
      { title: "Calendario de Citas — MediSuite" },
      {
        name: "description",
        content:
          "Agenda médica con citas programadas, duración, motivo y profesional asignado desde tu base de datos clínica.",
      },
      { property: "og:title", content: "Calendario de Citas — MediSuite" },
      {
        property: "og:description",
        content: "Consulta y gestiona la agenda de citas de tu consultorio.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(citasQuery());
  },
  component: CalendarioPage,
  errorComponent: ({ error }) => (
    <DashboardShell>
      <div role="alert" className="rounded-xl border border-destructive/40 bg-card p-6 text-sm">
        No se pudieron cargar las citas: {error.message}
      </div>
    </DashboardShell>
  ),
  notFoundComponent: () => (
    <DashboardShell>
      <p className="text-sm text-muted-foreground">Sin citas disponibles.</p>
    </DashboardShell>
  ),
});

function CalendarioPage() {
  const { data: citas } = useSuspenseQuery(citasQuery());

  return (
    <DashboardShell>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Agenda"
          title="Calendario de Citas"
          description="Citas leídas de la tabla citas, con paciente y profesional relacionados."
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
            description="El calendario semanal con drag-and-drop reemplazará este listado."
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

        <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
          <table className="w-full text-sm">
            <thead className="bg-background/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Fecha</th>
                <th className="px-4 py-3 text-left font-medium">Hora</th>
                <th className="px-4 py-3 text-left font-medium">Paciente</th>
                <th className="hidden px-4 py-3 text-left font-medium sm:table-cell">
                  Profesional
                </th>
                <th className="hidden px-4 py-3 text-left font-medium md:table-cell">
                  Motivo
                </th>
                <th className="px-4 py-3 text-left font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {citas.map((c) => (
                <tr key={c.id} className="border-t border-border/50">
                  <td className="px-4 py-3 whitespace-nowrap">{fechaCorta(c.inicio)}</td>
                  <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">
                    {horaCorta(c.inicio)} · {c.duracion_min}′
                  </td>
                  <td className="px-4 py-3">{nombreCompleto(c.pacientes)}</td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                    {nombreCompleto(c.medicos)}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {c.motivo ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs text-primary">
                      {c.estado}
                    </span>
                  </td>
                </tr>
              ))}
              {citas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No hay citas registradas.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}
