import { createFileRoute } from "@tanstack/react-router";
import { requireSession } from "@/lib/auth-guard";
import { DashboardShell } from "@/components/dashboard-shell";
import { PageHeader } from "@/components/page-primitives";
import { FirmaMedicoCard } from "@/components/firma-medico-card";

export const Route = createFileRoute("/perfil-medico")({
  beforeLoad: () => requireSession(),
  ssr: false,
  head: () => ({
    meta: [
      { title: "Mi perfil médico — MediSuite" },
      {
        name: "description",
        content:
          "Carga o dibuja tu firma y sello digital para que aparezca en las órdenes de laboratorio e imágenes.",
      },
      { property: "og:title", content: "Mi perfil médico — MediSuite" },
      {
        property: "og:description",
        content: "Firma y sello digital del médico para las órdenes impresas de MediSuite.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PerfilMedicoPage,
  errorComponent: ({ error }) => (
    <DashboardShell>
      <div role="alert" className="rounded-xl border border-destructive/40 bg-card p-6 text-sm">
        No se pudo cargar tu perfil: {error.message}
      </div>
    </DashboardShell>
  ),
});

function PerfilMedicoPage() {
  return (
    <DashboardShell>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Mi cuenta"
          title="Mi perfil médico"
          description="Configura tu firma y sello: se imprimen automáticamente en cada orden que emitas."
        />
        <FirmaMedicoCard />
      </div>
    </DashboardShell>
  );
}
