import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle, ShieldAlert } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import {
  GraficoDiario,
  KpiCard,
  KpiGridSkeleton,
  RangoSelector,
  fmtEntero,
  fmtPorcentaje,
  calcularVariacion,
  fmtSegundos,
  useRangoMetricas,
} from "@/components/metricas-ui";
import { PageHeader } from "@/components/page-primitives";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSession } from "@/lib/auth-guard";
import {
  useEsAdminPlataformaQuery,
  useMetricasComercialQuery,
} from "@/lib/metricas-conversacion.queries";

export const Route = createFileRoute("/admin/metricas-comercial")({
  beforeLoad: () => requireSession(),
  ssr: false,
  head: () => ({
    meta: [
      { title: "Métricas comerciales — MediSuite" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MetricasComercialPage,
});

const SERIES = [
  { clave: "chats_iniciados", etiqueta: "Chats iniciados", color: "var(--chart-2)" },
  { clave: "demos_agendadas", etiqueta: "Demos agendadas", color: "var(--chart-1)" },
] as const;

const ETIQUETA_FUNNEL: Record<string, string> = {
  nuevo: "Nuevo",
  calificado: "Calificado",
  demo_agendada: "Demo agendada",
  cliente: "Cliente",
  perdido: "Perdido",
};

function MetricasComercialPage() {
  const { dias, setDias, rango } = useRangoMetricas(30);
  const admin = useEsAdminPlataformaQuery();
  // No se consulta la RPC hasta confirmar que es admin: evita una llamada
  // que sabemos que será rechazada. La barrera real sigue siendo la RPC.
  const metricas = useMetricasComercialQuery(rango, admin.data === true);
  const ant = metricas.data?.ok ? (metricas.data.periodo_anterior ?? null) : null;

  return (
    <DashboardShell>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Administración"
          title="Métricas comerciales"
          description="Rendimiento del bot comercial de MediSuite: chats de prospectos, demos agendadas y tiempo de respuesta."
        />

        {admin.isLoading ? <KpiGridSkeleton /> : null}

        {admin.isSuccess && !admin.data ? <SinAcceso /> : null}

        {admin.data ? (
          <>
            <RangoSelector dias={dias} onChange={setDias} />

            {metricas.isLoading ? <KpiGridSkeleton /> : null}

            {metricas.isError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No se pudieron cargar las métricas</AlertTitle>
                <AlertDescription>
                  {metricas.error instanceof Error
                    ? metricas.error.message
                    : "Intenta de nuevo en unos minutos."}
                </AlertDescription>
              </Alert>
            ) : null}

            {metricas.data && !metricas.data.ok ? <SinAcceso /> : null}

            {metricas.data?.ok ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <KpiCard
                    titulo="Chats iniciados"
                    valor={fmtEntero(metricas.data.chats_iniciados)}
                    variacion={calcularVariacion(
                      metricas.data.chats_iniciados,
                      ant?.chats_iniciados,
                    )}
                  />
                  <KpiCard
                    titulo="Demos agendadas"
                    valor={fmtEntero(metricas.data.demos_agendadas)}
                    variacion={calcularVariacion(
                      metricas.data.demos_agendadas,
                      ant?.demos_agendadas,
                    )}
                    ayuda={`${fmtPorcentaje(metricas.data.tasa_demo_pct)} de los chats`}
                  />
                  <KpiCard
                    titulo="Tasa de abandono"
                    valor={fmtPorcentaje(metricas.data.tasa_abandono_pct)}
                    variacion={calcularVariacion(
                      metricas.data.tasa_abandono_pct,
                      ant?.tasa_abandono_pct,
                      { bajarEsBueno: true },
                    )}
                    ayuda="Chats sin demo y sin pasar a una persona."
                  />
                  <KpiCard
                    titulo="Tiempo de respuesta"
                    valor={fmtSegundos(metricas.data.tiempo_respuesta_promedio_seg)}
                    variacion={calcularVariacion(
                      metricas.data.tiempo_respuesta_promedio_seg,
                      ant?.tiempo_respuesta_promedio_seg,
                      { bajarEsBueno: true },
                    )}
                    ayuda="Promedio entre el mensaje del prospecto y la respuesta del bot."
                  />
                  <KpiCard
                    titulo="Pasados a una persona"
                    valor={fmtEntero(metricas.data.escaladas_humano)}
                  />
                  <KpiCard
                    titulo="Mensajes"
                    valor={fmtEntero(metricas.data.mensajes_lead)}
                    ayuda={`de prospectos · ${fmtEntero(metricas.data.mensajes_ia)} del bot`}
                  />
                </div>

                <GraficoDiario
                  titulo="Actividad diaria"
                  descripcion="Por día del primer mensaje (hora de Lima)."
                  datos={metricas.data.serie_diaria}
                  series={SERIES}
                />

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Embudo de prospectos</CardTitle>
                    <CardDescription>
                      Prospectos creados en el rango, según su etapa actual.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {Object.keys(metricas.data.funnel_leads).length === 0 ? (
                      <p className="text-sm text-muted-foreground">Sin prospectos en este rango.</p>
                    ) : (
                      <dl className="grid gap-3 sm:grid-cols-3">
                        {Object.entries(metricas.data.funnel_leads).map(([estado, n]) => (
                          <div key={estado} className="rounded-md border border-border/60 p-3">
                            <dt className="text-xs text-muted-foreground">
                              {ETIQUETA_FUNNEL[estado] ?? estado}
                            </dt>
                            <dd className="font-display text-2xl tabular-nums">{fmtEntero(n)}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : null}
          </>
        ) : null}
      </div>
    </DashboardShell>
  );
}

function SinAcceso() {
  return (
    <Alert>
      <ShieldAlert className="h-4 w-4" />
      <AlertTitle>Sección exclusiva de la administración de MATEO</AlertTitle>
      <AlertDescription>
        Tu cuenta no tiene acceso a las métricas comerciales de la plataforma.
      </AlertDescription>
    </Alert>
  );
}
