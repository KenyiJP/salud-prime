import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import type { Porcentaje, RangoMetricas } from "@/lib/metricas-conversacion-schemas";

// Piezas puramente visuales compartidas por los dos dashboards de métricas.
// No consultan datos: cada pantalla trae los suyos, así el canal clínico y el
// comercial no pueden cruzarse desde aquí.

// ---------------------------------------------------------------------------
// Fechas — el negocio opera en America/Lima, no en la zona del navegador.
// ---------------------------------------------------------------------------

function hoyLima(): Date {
  const [y, m, d] = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima" })
    .format(new Date())
    .split("-")
    .map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function aIso(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}

function rangoUltimosDias(dias: number): RangoMetricas {
  const hasta = hoyLima();
  const desde = new Date(hasta);
  desde.setUTCDate(desde.getUTCDate() - (dias - 1));
  return { desde: aIso(desde), hasta: aIso(hasta) };
}

const PRESETS = [
  { dias: 7, etiqueta: "7 días" },
  { dias: 30, etiqueta: "30 días" },
  { dias: 90, etiqueta: "90 días" },
] as const;

export function useRangoMetricas(diasIniciales = 30) {
  const [dias, setDias] = useState<number>(diasIniciales);
  // `hoyLima()` cambia solo al cruzar medianoche; recalcular por `dias` basta.
  const rango = useMemo(() => rangoUltimosDias(dias), [dias]);
  return { dias, setDias, rango };
}

export function RangoSelector({
  dias,
  onChange,
}: {
  dias: number;
  onChange: (dias: number) => void;
}) {
  return (
    <div className="flex gap-2" role="group" aria-label="Rango de fechas">
      {PRESETS.map((p) => (
        <Button
          key={p.dias}
          type="button"
          size="sm"
          variant={dias === p.dias ? "default" : "outline"}
          aria-pressed={dias === p.dias}
          onClick={() => onChange(p.dias)}
        >
          {p.etiqueta}
        </Button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Formato
// ---------------------------------------------------------------------------

/** `null` significa "sin datos"; se muestra guion, nunca 0 % (que sería un resultado real). */
export function fmtPorcentaje(valor: Porcentaje): string {
  return valor === null || valor === undefined ? "—" : `${valor.toLocaleString("es-PE")} %`;
}

export function fmtEntero(valor: number | null | undefined): string {
  return valor === null || valor === undefined ? "—" : valor.toLocaleString("es-PE");
}

export function fmtSegundos(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return "—";
  if (valor < 60) return `${valor.toLocaleString("es-PE", { maximumFractionDigits: 1 })} s`;
  const min = Math.floor(valor / 60);
  const seg = Math.round(valor % 60);
  return `${min} min ${seg} s`;
}

function fmtDiaCorto(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

// ---------------------------------------------------------------------------
// Tarjetas
// ---------------------------------------------------------------------------

export function KpiCard({
  titulo,
  valor,
  ayuda,
}: {
  titulo: string;
  valor: string;
  ayuda?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{titulo}</CardDescription>
        <CardTitle className="font-display text-3xl tabular-nums">{valor}</CardTitle>
      </CardHeader>
      {ayuda ? (
        <CardContent>
          <p className="text-xs text-muted-foreground">{ayuda}</p>
        </CardContent>
      ) : null}
    </Card>
  );
}

export function KpiGridSkeleton({ cantidad = 6 }: { cantidad?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true">
      {Array.from({ length: cantidad }).map((_, i) => (
        <Skeleton key={i} className="h-28 w-full" />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Gráfico de barras diario (dos series)
// ---------------------------------------------------------------------------

export interface SerieBarras {
  clave: string;
  etiqueta: string;
  color: string;
}

export function GraficoDiario({
  titulo,
  descripcion,
  datos,
  series,
}: {
  titulo: string;
  descripcion: string;
  datos: ReadonlyArray<object>;
  series: readonly SerieBarras[];
}) {
  const config: ChartConfig = Object.fromEntries(
    series.map((s) => [s.clave, { label: s.etiqueta, color: s.color }]),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{titulo}</CardTitle>
        <CardDescription>{descripcion}</CardDescription>
      </CardHeader>
      <CardContent>
        {datos.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Aún no hay conversaciones en este rango.
          </p>
        ) : (
          <ChartContainer config={config} className="aspect-auto h-64 w-full">
            <BarChart data={[...datos]} margin={{ left: 0, right: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="dia"
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: string) => fmtDiaCorto(v)}
              />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
              <ChartTooltip content={<ChartTooltipContent />} />
              {series.map((s) => (
                <Bar key={s.clave} dataKey={s.clave} fill={`var(--color-${s.clave})`} radius={3} />
              ))}
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
