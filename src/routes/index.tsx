import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  CalendarClock,
  FileHeart,
  Pill,
  TrendingUp,
  Users,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { PageHeader, PlaceholderCard } from "@/components/page-primitives";

export const Route = createFileRoute("/")({
  component: DashboardHome,
});

const kpis = [
  { label: "Citas hoy", value: "12", delta: "+3 vs ayer", icon: CalendarClock },
  { label: "Pacientes activos", value: "348", delta: "+18 este mes", icon: Users },
  { label: "Recetas emitidas", value: "27", delta: "Semana en curso", icon: Pill },
  { label: "Ingresos del mes", value: "S/ 14,820", delta: "+8.2%", icon: TrendingUp },
];

function DashboardHome() {
  return (
    <DashboardShell>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Panel principal"
          title="Buenas tardes, Dra. Rojas"
          description="Resumen operativo de tu consulta. Los módulos se activarán a medida que conectes tu información clínica."
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
                Actividad clínica
              </h2>
            </div>
            <div className="grid h-56 place-items-center rounded-lg border border-dashed border-border/60 text-sm text-muted-foreground">
              Gráfico de consultas próximamente
            </div>
          </div>
          <div className="rounded-xl border border-border/60 bg-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <FileHeart className="h-4 w-4 text-primary" />
              <h2 className="font-display text-lg font-semibold">
                Próximas citas
              </h2>
            </div>
            <ul className="space-y-3 text-sm">
              {[
                { h: "15:00", p: "Luis Fernández", m: "Control mensual" },
                { h: "15:45", p: "Ana Quispe", m: "Primera consulta" },
                { h: "16:30", p: "Carlos Vega", m: "Resultados de laboratorio" },
              ].map((c) => (
                <li
                  key={c.h}
                  className="flex items-start gap-3 rounded-lg border border-border/50 bg-background/40 p-3"
                >
                  <span className="mt-0.5 rounded-md bg-primary/15 px-2 py-1 font-mono text-xs text-primary">
                    {c.h}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{c.p}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {c.m}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <PlaceholderCard
            icon={<Pill className="h-5 w-5" />}
            title="Recetario inteligente"
            description="Sugerencias de dosis y verificación de interacciones aparecerán aquí una vez conectes tu vademécum."
          />
          <PlaceholderCard
            icon={<TrendingUp className="h-5 w-5" />}
            title="Reportes financieros"
            description="Visualiza ingresos por servicio, morosidad y proyecciones cuando actives Facturación electrónica."
          />
        </section>
      </div>
    </DashboardShell>
  );
}
