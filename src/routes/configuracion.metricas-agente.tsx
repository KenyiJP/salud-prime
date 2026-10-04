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
  calcularVariacion,
  fmtSegundos,
  fmtSoles,
  useRangoMetricas,
} from "@/components/metricas-ui";
import { PageHeader } from "@/components/page-primitives";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { requireSession } from "@/lib/auth-guard";
import { useMetricasAgenteClinicoQuery } from "@/lib/metricas-conversacion.queries";
import type {
  FueraHorarioClinico,
  IngresosAtribuidosClinico,
} from "@/lib/metricas-conversacion-schemas";

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

function ayudaIngresos(ingresos: IngresosAtribuidosClinico | null): string {
  if (!ingresos) return "Sin dato todavía.";
  const base = "Suma de las tarifas de las citas confirmadas por el agente.";
  const n = ingresos.citas_sin_tarifa;
  if (n <= 0) return base;
  // Sin tarifa publicada es un estado válido: el médico decide si fija precio.
  const cuantas = n.toLocaleString("es-PE");
  return n === 1
    ? `${base} 1 cita no tiene tarifa publicada y no suma.`
    : `${base} ${cuantas} citas no tienen tarifa publicada y no suman.`;
}

function ayudaFueraHorario(fuera: FueraHorarioClinico | null): string {
  if (!fuera) return "Sin dato todavía.";
  if (fuera.pct === null) return "Configura tus horarios para medir esto.";
  return `${fmtEntero(fuera.chats_fuera_horario)} de ${fmtEntero(fuera.chats_evaluados)} chats llegaron fuera de tu horario de atención.`;
}

function MetricasAgentePage() {
  const { dias, setDias, rango } = useRangoMetricas(30);
  const { data, isLoading, isError, error } = useMetricasAgenteClinicoQuery(rango);

  const ant = data?.periodo_anterior ?? null;
  const ingresos = data?.ingresos_atribuidos ?? null;
  const fuera = data?.fuera_horario ?? null;

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
              <KpiCard
                titulo="Chats iniciados"
                valor={fmtEntero(data.chats_iniciados)}
                variacion={calcularVariacion(data.chats_iniciados, ant?.chats_iniciados)}
              />
              <KpiCard
                titulo="Citas confirmadas"
                valor={fmtEntero(data.citas_confirmadas)}
                variacion={calcularVariacion(data.citas_confirmadas, ant?.citas_confirmadas)}
                ayuda={`${fmtEntero(data.citas_solicitadas)} solicitadas · ${fmtEntero(data.citas_canceladas)} canceladas`}
              />
              <KpiCard
                titulo="Tasa de conversión"
                valor={fmtPorcentaje(data.tasa_conversion_pct)}
                variacion={calcularVariacion(data.tasa_conversion_pct, ant?.tasa_conversion_pct)}
                ayuda="Chats que terminaron con una cita confirmada."
              />
              <KpiCard
                titulo="Tasa de abandono"
                valor={fmtPorcentaje(data.tasa_abandono_pct)}
                variacion={calcularVariacion(data.tasa_abandono_pct, ant?.tasa_abandono_pct, {
                  bajarEsBueno: true,
                })}
                ayuda="Chats que quedaron sin cita y sin pasar a una persona."
              />
              <KpiCard
                titulo="Tiempo de respuesta"
                valor={fmtSegundos(data.tiempo_respuesta_promedio_seg)}
                variacion={calcularVariacion(
                  data.tiempo_respuesta_promedio_seg,
                  ant?.tiempo_respuesta_promedio_seg,
                  { bajarEsBueno: true },
                )}
                ayuda="Promedio entre el mensaje del paciente y la respuesta del agente."
              />
              <KpiCard
                titulo="Ingresos atribuidos al agente"
                valor={ingresos ? fmtSoles(ingresos.monto_pen) : "—"}
                variacion={calcularVariacion(ingresos?.monto_pen, ant?.ingresos_monto_pen)}
                ayuda={ayudaIngresos(ingresos)}
              />
              <KpiCard
                titulo="Chats fuera de horario"
                valor={fuera ? fmtPorcentaje(fuera.pct) : "—"}
                ayuda={ayudaFueraHorario(fuera)}
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
