import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { GoogleCalendarSyncColaTabla } from "@/components/google-calendar-sync-cola-tabla";
import { PageHeader } from "@/components/page-primitives";
import { requireSession } from "@/lib/auth-guard";

export const Route = createFileRoute("/configuracion/google-calendar-cola")({
  beforeLoad: () => requireSession(),
  ssr: false,
  head: () => ({
    meta: [
      { title: "Cola de reintentos Google Calendar — MediSuite" },
      {
        name: "description",
        content: "Historial de sincronizaciones pendientes o fallidas con Google Calendar.",
      },
      { property: "og:title", content: "Cola de reintentos Google Calendar — MediSuite" },
      {
        property: "og:description",
        content: "Revisa la cola de reintentos de sincronización con Google Calendar de tu consultorio.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ConfiguracionGoogleCalendarColaPage,
});

function ConfiguracionGoogleCalendarColaPage() {
  return (
    <DashboardShell>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Configuración"
          title="Cola de reintentos Google Calendar"
          description="Citas que aún no lograron sincronizarse con Google Calendar, con su próximo reintento."
        />
        <GoogleCalendarSyncColaTabla />
      </div>
    </DashboardShell>
  );
}
