import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { GoogleCalendarCard } from "@/components/google-calendar-card";
import { PageHeader } from "@/components/page-primitives";
import { requireSession } from "@/lib/auth-guard";

export const Route = createFileRoute("/configuracion/calendario")({
  beforeLoad: () => requireSession(),
  ssr: false,
  head: () => ({
    meta: [
      { title: "Google Calendar — MediSuite" },
      {
        name: "description",
        content: "Conecta y administra Google Calendar para sincronizar tu agenda médica.",
      },
      { property: "og:title", content: "Google Calendar — MediSuite" },
      {
        property: "og:description",
        content: "Configura la sincronización de citas médicas con Google Calendar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ConfiguracionCalendarioPage,
});

function ConfiguracionCalendarioPage() {
  return (
    <DashboardShell>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Configuración"
          title="Calendario"
          description="Administra la conexión que sincroniza tus citas con Google Calendar."
        />
        <GoogleCalendarCard />
      </div>
    </DashboardShell>
  );
}