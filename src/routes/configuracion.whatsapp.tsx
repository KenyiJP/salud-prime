import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { PageHeader } from "@/components/page-primitives";
import { WhatsappIntegracionCard } from "@/components/whatsapp-integracion-card";
import { requireSession } from "@/lib/auth-guard";

export const Route = createFileRoute("/configuracion/whatsapp")({
  beforeLoad: () => requireSession(),
  ssr: false,
  head: () => ({
    meta: [
      { title: "WhatsApp Business — MediSuite" },
      {
        name: "description",
        content: "Consulta el estado de la integración de WhatsApp Business de tu consultorio.",
      },
      { property: "og:title", content: "WhatsApp Business — MediSuite" },
      {
        property: "og:description",
        content: "Estado de la conexión de WhatsApp Business para el agente de MATEO.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ConfiguracionWhatsappPage,
});

function ConfiguracionWhatsappPage() {
  return (
    <DashboardShell>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Configuración"
          title="WhatsApp Business"
          description="Estado de la conexión de WhatsApp Business de tu consultorio."
        />
        <WhatsappIntegracionCard />
      </div>
    </DashboardShell>
  );
}
