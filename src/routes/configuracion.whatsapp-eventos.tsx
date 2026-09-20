import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { WhatsappEventosTabla } from "@/components/whatsapp-eventos-tabla";
import { PageHeader } from "@/components/page-primitives";
import { requireSession } from "@/lib/auth-guard";

export const Route = createFileRoute("/configuracion/whatsapp-eventos")({
  beforeLoad: () => requireSession(),
  ssr: false,
  head: () => ({
    meta: [
      { title: "Eventos de WhatsApp — MediSuite" },
      {
        name: "description",
        content: "Historial de eventos de webhook de WhatsApp recibidos para diagnóstico.",
      },
      { property: "og:title", content: "Eventos de WhatsApp — MediSuite" },
      {
        property: "og:description",
        content: "Revisa el historial de eventos de webhook de WhatsApp de tu consultorio.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ConfiguracionWhatsappEventosPage,
});

function ConfiguracionWhatsappEventosPage() {
  return (
    <DashboardShell>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Configuración"
          title="Eventos de WhatsApp"
          description="Historial de eventos de webhook recibidos, para diagnosticar por qué no llegó un mensaje."
        />
        <WhatsappEventosTabla />
      </div>
    </DashboardShell>
  );
}
