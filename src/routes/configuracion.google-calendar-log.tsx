import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { GoogleCalendarSyncLogTabla } from "@/components/google-calendar-sync-log-tabla";
import { PageHeader } from "@/components/page-primitives";
import { requireSession } from "@/lib/auth-guard";

export const Route = createFileRoute("/configuracion/google-calendar-log")({
  beforeLoad: () => requireSession(),
  ssr: false,
  head: () => ({
    meta: [
      { title: "Historial de sincronización con Google Calendar — MediSuite" },
      {
        name: "description",
        content: "Historial de sincronizaciones con Google Calendar registradas para diagnóstico.",
      },
      { property: "og:title", content: "Historial de sincronización con Google Calendar — MediSuite" },
      {
        property: "og:description",
        content: "Revisa el historial de sincronización con Google Calendar de tu consultorio.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ConfiguracionGoogleCalendarLogPage,
});

function ConfiguracionGoogleCalendarLogPage() {
  return (
    <DashboardShell>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Configuración"
          title="Historial de sincronización con Google Calendar"
          description="Registro histórico de sincronizaciones, para entender por qué una cita no se sincronizó."
        />
        <GoogleCalendarSyncLogTabla />
      </div>
    </DashboardShell>
  );
}
