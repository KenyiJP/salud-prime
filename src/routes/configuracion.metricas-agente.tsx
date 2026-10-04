import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import {
  GraficoDiario,
  KpiCard,
  KpiGridSkeleton,
  RangoSelector,
  fmtEntero,
  fmtPorcentaje,
  fmtSegundos,
  useRangoMetricas,
} from "@/components/metricas-ui";
import { PageHeader } from "@/components/page-primitives";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { requireSession } from "@/lib/auth-guard";
import { useMetricasAgenteClinicoQuery } from "@/lib/metricas-conversacion.queries";

export const Route = createFileRoute("/configuracion/metricas-agente")({
  beforeLoad: () => requireSession(),
  ssr: false,
  head: () => ({
    meta: [
      { title: "Métricas del agente — MediSuite" },
      {
        name: "description",
        content: "Conversión y tiempos de respuesta del agente de WhatsApp de tu consultorio.",
      },
    ],
  }),
  component: MetricasAgentePage,
});

const SERIES = [
  { clave: "chats_iniciados", etiqueta: "Chats iniciados", color: "var(--chart-2)" },
  { clave: "citas_confirmadas", etiqueta: "Citas confirmadas", color: "var(--chart-1)" },
] as const;

function MetricasAgentePage() {
  const { dias, setDias, rango } = useRangoMetricas(30);
  const { data, isLoading, isError, error } = useMetricasAgenteClinicoQuery(rango);

  return (
    <DashboardShell>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Configuración"
          title="Métricas del agente"
          description="Cuántos pacientes escriben a tu WhatsApp, cuántos terminan agendando y qué tan rápido responde el agente."
        />

        <RangoSelector dias={dias} onChange={setDias} />

        {isLoading ? <KpiGridSkeleton /> : null}

        {isError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No se pudieron cargar las métricas</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : "Intenta de nuevo en unos minutos."}
            </AlertDescription>
          </Alert>
        ) : null}

        {data ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <KpiCard titulo="Chats iniciados" valor={fmtEntero(data.chats_iniciados)} />
              <KpiCard
                titulo="Citas confirmadas"
                valor={fmtEntero(data.citas_confirmadas)}
                ayuda={`${fmtEntero(data.citas_solicitadas)} solicitadas · ${fmtEntero(data.citas_canceladas)} canceladas`}
              />
              <KpiCard
                titulo="Tasa de conversión"
                valor={fmtPorcentaje(data.tasa_conversion_pct)}
                ayuda="Chats que terminaron con una cita confirmada."
              />
              <KpiCard
                titulo="Tasa de abandono"
                valor={fmtPorcentaje(data.tasa_abandono_pct)}
                ayuda="Chats que quedaron sin cita y sin pasar a una persona."
              />
              <KpiCard
                titulo="Tiempo de respuesta"
                valor={fmtSegundos(data.tiempo_respuesta_promedio_seg)}
                ayuda="Promedio entre el mensaje del paciente y la respuesta del agente."
              />
              <KpiCard
                titulo="Pasados a una persona"
                valor={fmtEntero(data.escaladas_humano)}
                ayuda={`${fmtEntero(data.mensajes_paciente)} mensajes de pacientes · ${fmtEntero(data.mensajes_ia)} del agente`}
              />
            </div>

            <GraficoDiario
              titulo="Actividad diaria"
              descripcion="Por día del primer mensaje (hora de Lima)."
              datos={data.serie_diaria}
              series={SERIES}
            />
          </>
        ) : null}
      </div>
    </DashboardShell>
  );
}
