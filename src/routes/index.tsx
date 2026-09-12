import { createFileRoute } from "@tanstack/react-router";
import { requireSession } from "@/lib/auth-guard";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Activity, CalendarClock, FileHeart, Pill, TrendingUp, Users } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { PageHeader, PlaceholderCard } from "@/components/page-primitives";
import { nombrePaciente, pacientesQuery } from "@/lib/pacientes.queries";
import { citasQuery, fechaCorta, horaCorta } from "@/lib/citas.queries";

export const Route = createFileRoute("/")({
  beforeLoad: () => requireSession(),
  // Client-only: the data below requires an authenticated Supabase session,
  // which does not exist during SSR/prerender.
  ssr: false,
  head: () => ({
    meta: [
      { title: "Panel Clínico — MediSuite Perú" },
      {
        name: "description",
        content: "Panel operativo para médicos independientes en Perú: citas del día, pacientes activos y agenda conectada a tu base de datos clínica.",
      },
      { property: "og:title", content: "Panel Clínico — MediSuite Perú" },
      {
        property: "og:description",
        content: "Resumen de citas, pacientes y agenda clínica en un solo panel para consultorios independientes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(citasQuery());
    context.queryClient.ensureQueryData(pacientesQuery());
  },
  component: DashboardHome,
  errorComponent: ({ error }: { error: unknown }) => (
    <DashboardShell>
      <div role="alert" className="rounded-xl border border-destructive/40 bg-card p-6 text-sm">
        No se pudo cargar la información clínica: {error instanceof Error ? error.message : String(error)}
      </div>
    </DashboardShell>
  ),
  notFoundComponent: () => (
    <DashboardShell>
      <p className="text-sm text-muted-foreground">Sin datos disponibles.</p>
    </DashboardShell>
  ),
});

function esHoy(iso: string) {
  const a = new Date(iso);
  const b = new Date();
  return a.toDateString() === b.toDateString();
}

function DashboardHome() {
  const { data: citas } = useSuspenseQuery(citasQuery());
  const { data: pacientes } = useSuspenseQuery(pacientesQuery());

  const citasHoy = citas.filter((c) => esHoy(c.fecha_hora));
  const proximas = citas.filter((c) => new Date(c.fecha_hora).getTime() >= Date.now()).slice(0, 5);
  const atendidas = citas.filter((c) => c.estado === "atendida").length;

  const kpis = [
    {
      label: "Citas hoy",
      value: String(citasHoy.length),
      delta: `${proximas.length} próximas programadas`,
      icon: CalendarClock,
    },
    {
      label: "Pacientes registrados",
      value: String(pacientes.length),
      delta: "Tabla pacientes",
      icon: Users,
    },
    {
      label: "Citas atendidas",
      value: String(atendidas),
      delta: `${citas.length} en total`,
      icon: TrendingUp,
    },
  ];

  return (
    <DashboardShell>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Panel principal"
          title="Resumen clínico"
          description="Indicadores calculados en vivo desde tus tablas pacientes y citas."
        />

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {kpis.map((k) => (
            <div key={k.label} className="rounded-xl border border-border/60 bg-card p-5 shadow-[0_1px_0_0_oklch(1_0_0/6%)]">
              <div className="flex items-start justify-between">
                <p className="text-sm text-muted-foreground">{k.label}</p>
                <div className="grid h-8 w-8 place-items-center rounded-md bg-primary/10 text-primary ring-1 ring-primary/25">
                  <k.icon className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 font-display text-2xl font-semibold tracking-tight">{k.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{k.delta}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-xl border border-border/60 bg-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <h2 className="font-display text-lg font-semibold">Pacientes recientes</h2>
            </div>
            <ul className="space-y-3 text-sm">
              {pacientes.slice(0, 6).map((p) => (
                <li key={p.id} className="rounded-lg border border-border/50 p-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate font-medium">{nombrePaciente(p)}</p>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {p.documento_identidad ? `Doc. ${p.documento_identidad}` : "Sin documento"}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{p.telefono ?? "Sin teléfono"}</p>
                </li>
              ))}
              {pacientes.length === 0 ? <li className="text-muted-foreground">Aún no hay pacientes registrados.</li> : null}
            </ul>
          </div>

          <div className="rounded-xl border border-border/60 bg-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <FileHeart className="h-4 w-4 text-primary" />
              <h2 className="font-display text-lg font-semibold">Próximas citas</h2>
            </div>
            <ul className="space-y-3 text-sm">
              {proximas.map((c) => (
                <li key={c.id} className="flex items-start gap-3 rounded-lg border border-border/50 bg-background/40 p-3">
                  <span className="mt-0.5 shrink-0 rounded-md bg-primary/15 px-2 py-1 font-mono text-xs text-primary">
                    {horaCorta(c.fecha_hora)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{nombrePaciente(c.pacientes)}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {fechaCorta(c.fecha_hora)} · {c.motivo ?? "Consulta"}
                    </p>
                  </div>
                </li>
              ))}
              {proximas.length === 0 ? <li className="text-muted-foreground">No hay citas programadas.</li> : null}
            </ul>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <PlaceholderCard
            icon={<Pill className="h-5 w-5" />}
            title="Recetario inteligente"
            description="Pendiente de conectar el vademécum; las recetas se vincularán a pacientes y citas existentes."
          />
          <PlaceholderCard
            icon={<TrendingUp className="h-5 w-5" />}
            title="Reportes financieros"
            description="Los ingresos se calcularán a partir de las citas atendidas cuando actives Facturación electrónica."
          />
        </section>
      </div>
    </DashboardShell>
  );
}
