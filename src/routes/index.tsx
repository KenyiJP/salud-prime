import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  Activity,
  CalendarClock,
  FileHeart,
  Pill,
  Stethoscope,
  TrendingUp,
  Users,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { PageHeader, PlaceholderCard } from "@/components/page-primitives";
import {
  citasQuery,
  esHoy,
  fechaCorta,
  horaCorta,
  medicosQuery,
  nombreCompleto,
  pacientesQuery,
} from "@/lib/clinica-queries";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Panel Clínico — MediSuite Perú" },
      {
        name: "description",
        content:
          "Panel operativo para médicos independientes en Perú: citas del día, pacientes activos y agenda conectada a tu base de datos clínica.",
      },
      { property: "og:title", content: "Panel Clínico — MediSuite Perú" },
      {
        property: "og:description",
        content:
          "Resumen de citas, pacientes y agenda clínica en un solo panel para consultorios independientes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(citasQuery());
    context.queryClient.ensureQueryData(pacientesQuery());
    context.queryClient.ensureQueryData(medicosQuery());
  },
  component: DashboardHome,
  errorComponent: ({ error }) => (
    <DashboardShell>
      <div role="alert" className="rounded-xl border border-destructive/40 bg-card p-6 text-sm">
        No se pudo cargar la información clínica: {error.message}
      </div>
    </DashboardShell>
  ),
  notFoundComponent: () => (
    <DashboardShell>
      <p className="text-sm text-muted-foreground">Sin datos disponibles.</p>
    </DashboardShell>
  ),
});

function DashboardHome() {
  const { data: citas } = useSuspenseQuery(citasQuery());
  const { data: pacientes } = useSuspenseQuery(pacientesQuery());
  const { data: medicos } = useSuspenseQuery(medicosQuery());

  const citasHoy = citas.filter((c) => esHoy(c.inicio));
  const proximas = citas
    .filter((c) => new Date(c.inicio).getTime() >= Date.now())
    .slice(0, 5);
  const completadas = citas.filter((c) => c.estado === "completada").length;

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
      label: "Profesionales",
      value: String(medicos.length),
      delta: "Tabla medicos",
      icon: Stethoscope,
    },
    {
      label: "Citas atendidas",
      value: String(completadas),
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
          description="Indicadores calculados en vivo desde tus tablas medicos, pacientes y citas."
        />

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((k) => (
            <div
              key={k.label}
              className="rounded-xl border border-border/60 bg-card p-5 shadow-[0_1px_0_0_oklch(1_0_0/6%)]"
            >
              <div className="flex items-start justify-between">
                <p className="text-sm text-muted-foreground">{k.label}</p>
                <div className="grid h-8 w-8 place-items-center rounded-md bg-primary/10 text-primary ring-1 ring-primary/25">
                  <k.icon className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 font-display text-2xl font-semibold tracking-tight">
                {k.value}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{k.delta}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-xl border border-border/60 bg-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <h2 className="font-display text-lg font-semibold">
                Pacientes por profesional
              </h2>
            </div>
            <ul className="space-y-3 text-sm">
              {medicos.map((m) => {
                const total = pacientes.filter(
                  (p) =>
                    p.medicos &&
                    `${p.medicos.nombres} ${p.medicos.apellidos}` ===
                      `${m.nombres} ${m.apellidos}`,
                ).length;
                const pct = pacientes.length
                  ? Math.round((total / pacientes.length) * 100)
                  : 0;
                return (
                  <li key={m.id} className="rounded-lg border border-border/50 p-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="truncate font-medium">
                        Dr(a). {nombreCompleto(m)}
                      </p>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {total} pacientes
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {m.especialidad} · {m.cmp ?? "sin CMP"}
                    </p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
              {medicos.length === 0 ? (
                <li className="text-muted-foreground">Aún no hay médicos registrados.</li>
              ) : null}
            </ul>
          </div>

          <div className="rounded-xl border border-border/60 bg-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <FileHeart className="h-4 w-4 text-primary" />
              <h2 className="font-display text-lg font-semibold">Próximas citas</h2>
            </div>
            <ul className="space-y-3 text-sm">
              {proximas.map((c) => (
                <li
                  key={c.id}
                  className="flex items-start gap-3 rounded-lg border border-border/50 bg-background/40 p-3"
                >
                  <span className="mt-0.5 shrink-0 rounded-md bg-primary/15 px-2 py-1 font-mono text-xs text-primary">
                    {horaCorta(c.inicio)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{nombreCompleto(c.pacientes)}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {fechaCorta(c.inicio)} · {c.motivo ?? "Consulta"}
                    </p>
                  </div>
                </li>
              ))}
              {proximas.length === 0 ? (
                <li className="text-muted-foreground">No hay citas programadas.</li>
              ) : null}
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
