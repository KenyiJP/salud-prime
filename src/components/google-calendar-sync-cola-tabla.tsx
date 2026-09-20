import { useQuery } from "@tanstack/react-query";
import { CalendarClock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type GoogleCalendarSyncCola = Tables<"google_calendar_sync_cola">;

const colaQueryKey = ["google-calendar-sync-cola"] as const;

async function getGoogleCalendarSyncCola(): Promise<GoogleCalendarSyncCola[]> {
  const { data, error } = await supabase
    .from("google_calendar_sync_cola")
    .select("*")
    .order("proximo_intento", { ascending: true })
    .limit(50);
  if (error) throw new Error(error.message);
  return data ?? [];
}

const ETIQUETA_ESTADO: Record<string, string> = {
  completado: "Completado",
  procesando: "Procesando",
  error: "Error",
  pendiente: "Pendiente",
};

const CLASE_BADGE_ESTADO: Record<string, string> = {
  completado: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600",
  procesando: "border-amber-500/40 bg-amber-500/10 text-amber-600",
  error: "border-destructive/40 bg-destructive/10 text-destructive",
  pendiente: "border-amber-500/40 bg-amber-500/10 text-amber-600",
};

function claseBadgePorSubstring(estado: string) {
  const valor = estado.toLowerCase();
  if (valor.includes("error")) return "border-destructive/40 bg-destructive/10 text-destructive";
  if (valor.includes("complet") || valor.includes("procesad") || valor.includes("exito")) {
    return "border-emerald-500/40 bg-emerald-500/10 text-emerald-600";
  }
  return "border-amber-500/40 bg-amber-500/10 text-amber-600";
}

function EstadoBadge({ estado }: { estado: string }) {
  const clase = CLASE_BADGE_ESTADO[estado] ?? claseBadgePorSubstring(estado);
  return (
    <Badge variant="outline" className={clase}>
      {ETIQUETA_ESTADO[estado] ?? estado}
    </Badge>
  );
}

function formatearFecha(valor: string) {
  return new Date(valor).toLocaleString("es-PE", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function GoogleCalendarSyncColaTabla() {
  const cola = useQuery({
    queryKey: colaQueryKey,
    queryFn: getGoogleCalendarSyncCola,
  });

  return (
    <Card className="border-border/60 shadow-none">
      <CardHeader>
        <div className="flex items-start gap-4">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/25">
            <CalendarClock className="h-5 w-5" />
          </div>
          <div className="min-w-0 space-y-1.5">
            <CardTitle>Cola de reintentos</CardTitle>
            <CardDescription>
              Últimas 50 sincronizaciones pendientes o fallidas con Google Calendar para tu consultorio.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {cola.isPending ? (
          <div className="flex min-h-24 items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando cola…
          </div>
        ) : cola.isError ? (
          <div
            role="alert"
            className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
          >
            {cola.error.message}
          </div>
        ) : cola.data.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border/70 px-4 py-6 text-center text-sm text-muted-foreground">
            No hay sincronizaciones pendientes con Google Calendar.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Acción</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Intentos</TableHead>
                <TableHead>Próximo intento</TableHead>
                <TableHead>Último error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cola.data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="text-sm capitalize">{item.accion}</TableCell>
                  <TableCell>
                    <EstadoBadge estado={item.estado} />
                  </TableCell>
                  <TableCell className="text-sm">{item.intentos}</TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {formatearFecha(item.proximo_intento)}
                  </TableCell>
                  <TableCell className="max-w-md truncate text-sm text-muted-foreground">
                    {item.ultimo_error ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
