import { createFileRoute } from "@tanstack/react-router";
import { requireSession } from "@/lib/auth-guard";
import { DashboardShell } from "@/components/dashboard-shell";
import { PageHeader } from "@/components/page-primitives";
import { HorariosPanel } from "@/components/horarios-panel";
import { bloqueosQuery, horariosQuery, tiposConsultaAdminQuery } from "@/lib/agenda.queries";

export const Route = createFileRoute("/horarios")({
  beforeLoad: () => requireSession(),
  ssr: false,
  head: () => ({
    meta: [
      { title: "Horarios y bloqueos — MediSuite" },
      {
        name: "description",
        content:
          "Configura tus turnos de atención semanales, la duración de cada slot y los bloqueos de agenda.",
      },
      { property: "og:title", content: "Horarios y bloqueos — MediSuite" },
      {
        property: "og:description",
        content: "Define tu disponibilidad semanal y los periodos bloqueados de tu agenda médica.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(tiposConsultaAdminQuery());
    context.queryClient.ensureQueryData(horariosQuery());
    context.queryClient.ensureQueryData(bloqueosQuery());
  },
  component: HorariosPage,
  errorComponent: ({ error }: { error: unknown }) => (
    <DashboardShell>
      <div role="alert" className="rounded-xl border border-destructive/40 bg-card p-6 text-sm">
        No se pudo cargar la configuración de horarios:{" "}
        {error instanceof Error ? error.message : String(error)}
      </div>
    </DashboardShell>
  ),
  notFoundComponent: () => (
    <DashboardShell>
      <p className="text-sm text-muted-foreground">Sin horarios disponibles.</p>
    </DashboardShell>
  ),
});

function HorariosPage() {
  return (
    <DashboardShell>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Configuración"
          title="Horarios y bloqueos"
          description="Define en qué días y horas atiendes, la duración de cada cita y los periodos en los que no estarás disponible."
        />
        <HorariosPanel />
      </div>
    </DashboardShell>
  );
}
