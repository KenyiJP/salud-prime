import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { requireSession } from "@/lib/auth-guard";
import { DashboardShell } from "@/components/dashboard-shell";
import { RequireTenantAccess } from "@/components/require-tenant-access";
import { PageHeader } from "@/components/page-primitives";
import { MarcaIdentidadTab } from "@/components/marca/marca-identidad-tab";
import { MarcaSeccionesTab } from "@/components/marca/marca-secciones-tab";
import { MarcaServiciosTab } from "@/components/marca/marca-servicios-tab";
import { MarcaTestimoniosTab } from "@/components/marca/marca-testimonios-tab";
import { MarcaSlugTab } from "@/components/marca/marca-slug-tab";
import { MarcaSuscripcionTab } from "@/components/marca/marca-suscripcion-tab";
import { MarcaPreview } from "@/components/marca/marca-preview";
import { cn } from "@/lib/utils";
import { ROLES_SUSCRIPCION, useAuth } from "@/lib/auth-context";
import type { LandingConfigInput } from "@/lib/landing-marca-schemas";
import {
  landingConfigQuery,
  landingServiciosQuery,
  landingTestimoniosQuery,
  planesSuscripcionQuery,
  suscripcionActualQuery,
  tenantSlugQuery,
  useLandingConfigQuery,
  useLandingServiciosQuery,
  useLandingTestimoniosQuery,
  useTenantSlugQuery,
} from "@/lib/landing-marca.queries";

export const Route = createFileRoute("/marca")({
  beforeLoad: () => requireSession(),
  ssr: false,
  head: () => ({
    meta: [
      { title: "Identidad y landing — MediSuite" },
      {
        name: "description",
        content:
          "Personaliza los colores, tipografía, servicios, testimonios y el subdominio de tu landing pública.",
      },
      { property: "og:title", content: "Identidad y landing — MediSuite" },
      {
        property: "og:description",
        content: "Editor visual de la landing pública de tu consultorio.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(landingConfigQuery());
    context.queryClient.ensureQueryData(landingServiciosQuery());
    context.queryClient.ensureQueryData(landingTestimoniosQuery());
    context.queryClient.ensureQueryData(tenantSlugQuery());
    context.queryClient.ensureQueryData(planesSuscripcionQuery());
    context.queryClient.ensureQueryData(suscripcionActualQuery());
  },
  component: MarcaPage,
  errorComponent: ({ error }: { error: unknown }) => (
    <DashboardShell Guard={RequireTenantAccess}>
      <div role="alert" className="rounded-xl border border-destructive/40 bg-card p-6 text-sm">
        No se pudo cargar el panel de marca:{" "}
        {error instanceof Error ? error.message : String(error)}
      </div>
    </DashboardShell>
  ),
  notFoundComponent: () => (
    <DashboardShell Guard={RequireTenantAccess}>
      <p className="text-sm text-muted-foreground">
        Todavía no configuraste la landing de tu consultorio.
      </p>
    </DashboardShell>
  ),
});

type TabId = "identidad" | "secciones" | "servicios" | "testimonios" | "slug" | "suscripcion";

const TABS: { id: TabId; label: string }[] = [
  { id: "identidad", label: "Identidad" },
  { id: "secciones", label: "Secciones y ubicación" },
  { id: "servicios", label: "Servicios" },
  { id: "testimonios", label: "Testimonios" },
  { id: "slug", label: "Subdominio" },
  { id: "suscripcion", label: "Plan y suscripción" },
];

function MarcaPage() {
  const [tab, setTab] = useState<TabId>("identidad");
  const { rol } = useAuth();
  // Día 29B: el community manager no ve la suscripción (RLS); se oculta la pestaña.
  const tabsVisibles = TABS.filter(
    (t) => t.id !== "suscripcion" || (rol !== null && ROLES_SUSCRIPCION.includes(rol)),
  );
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [previewValores, setPreviewValores] = useState<LandingConfigInput | null>(null);

  const configQuery = useLandingConfigQuery();
  const serviciosQuery = useLandingServiciosQuery();
  const testimoniosQuery = useLandingTestimoniosQuery();
  const slugQuery = useTenantSlugQuery();

  const config = configQuery.data;
  const servicios = serviciosQuery.data ?? [];
  const testimonios = testimoniosQuery.data ?? [];
  const slugInfo = slugQuery.data;

  if (config && config.tenant_id !== tenantId) {
    setTenantId(config.tenant_id);
  }

  // Cuando llega o cambia la config guardada (carga inicial o tras
  // "Guardar"), reinicia la base de la vista previa en vivo.
  useEffect(() => {
    if (config) setPreviewValores(config);
  }, [config]);

  // Combina lo guardado con lo que el médico está tecleando/eligiendo
  // ahora mismo en Identidad o Secciones — la vista previa se actualiza
  // al instante, sin esperar a que se presione "Guardar".
  const configVistaPrevia = previewValores
    ? { ...config, ...previewValores }
    : config;

  return (
    <DashboardShell Guard={RequireTenantAccess}>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Marca"
          title="Identidad y landing"
          description="Personaliza el diseño, los servicios, los testimonios y la dirección pública de tu landing."
        />

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2 border-b border-border/60 pb-3">
              {tabsVisibles.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                    tab === t.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="rounded-2xl border border-border/60 bg-card p-6">
              {configQuery.isLoading || !config || !tenantId ? (
                <p className="text-sm text-muted-foreground">Cargando configuración…</p>
              ) : (
                <>
                  {tab === "identidad" ? (
                    <MarcaIdentidadTab
                      config={config}
                      tenantId={tenantId}
                      onValoresChange={setPreviewValores}
                    />
                  ) : null}
                  {tab === "secciones" ? (
                    <MarcaSeccionesTab
                      config={config}
                      tenantId={tenantId}
                      onValoresChange={setPreviewValores}
                    />
                  ) : null}
                  {tab === "servicios" ? <MarcaServiciosTab /> : null}
                  {tab === "testimonios" ? <MarcaTestimoniosTab /> : null}
                  {tab === "slug" ? <MarcaSlugTab /> : null}
                  {tab === "suscripcion" && tabsVisibles.some((t) => t.id === "suscripcion") ? (
                    <MarcaSuscripcionTab />
                  ) : null}
                </>
              )}
            </div>
          </div>

          <div className="xl:sticky xl:top-6 xl:self-start">
            {configVistaPrevia ? (
              <MarcaPreview
                config={configVistaPrevia}
                servicios={servicios}
                testimonios={testimonios}
                nombreConsultorio={slugInfo?.nombre_comercial ?? "Tu consultorio"}
              />
            ) : null}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
