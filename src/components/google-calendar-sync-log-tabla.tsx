import { useQuery } from "@tanstack/react-query";
import { claveActiva } from "@/lib/query-scope";
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

type GoogleCalendarSyncLog = Tables<"google_calendar_sync_log">;

const syncLogQueryKey = () => claveActiva("google-calendar-sync-log");

async function getGoogleCalendarSyncLog(): Promise<GoogleCalendarSyncLog[]> {
  const { data, error } = await supabase
    .from("google_calendar_sync_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return data ?? [];
}

const CLASE_BADGE_ESTADO: Record<"exito" | "error" | "otro", string> = {
  exito: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600",
  error: "border-destructive/40 bg-destructive/10 text-destructive",
  otro: "border-amber-500/40 bg-amber-500/10 text-amber-600",
};

function clasificarResultado(resultado: string): "exito" | "error" | "otro" {
  const normalizado = resultado.toLowerCase();
  if (normalizado.includes("exito") || normalizado.includes("success") || normalizado.includes("ok")) {
    return "exito";
  }
  if (normalizado.includes("error") || normalizado.includes("fallo")) {
    return "error";
  }
  return "otro";
}

function ResultadoBadge({ resultado }: { resultado: string }) {
  return (
    <Badge variant="outline" className={CLASE_BADGE_ESTADO[clasificarResultado(resultado)]}>
      {resultado}
    </Badge>
  );
}

function formatearFecha(valor: string) {
  return new Date(valor).toLocaleString("es-PE", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function GoogleCalendarSyncLogTabla() {
  const syncLog = useQuery({
    queryKey: syncLogQueryKey(),
    queryFn: getGoogleCalendarSyncLog,
  });

  return (
    <Card className="border-border/60 shadow-none">
      <CardHeader>
        <div className="flex items-start gap-4">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/25">
            <CalendarClock className="h-5 w-5" />
          </div>
          <div className="min-w-0 space-y-1.5">
            <CardTitle>Sincronizaciones registradas</CardTitle>
            <CardDescription>
              Últimas 50 operaciones de sincronización con Google Calendar registradas para tu consultorio.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {syncLog.isPending ? (
          <div className="flex min-h-24 items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando historial…
          </div>
        ) : syncLog.isError ? (
          <div
            role="alert"
            className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
          >
            {syncLog.error.message}
          </div>
        ) : syncLog.data.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border/70 px-4 py-6 text-center text-sm text-muted-foreground">
            Aún no se han registrado sincronizaciones con Google Calendar.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Acción</TableHead>
                <TableHead>Resultado</TableHead>
                <TableHead>Detalle</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {syncLog.data.map((registro) => (
                <TableRow key={registro.id}>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {formatearFecha(registro.created_at)}
                  </TableCell>
                  <TableCell className="text-sm">{registro.accion}</TableCell>
                  <TableCell>
                    <ResultadoBadge resultado={registro.resultado} />
                  </TableCell>
                  <TableCell className="max-w-md truncate text-sm text-muted-foreground">
                    {registro.detalle ?? "—"}
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
