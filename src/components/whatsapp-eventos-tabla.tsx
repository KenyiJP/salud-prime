import { useQuery } from "@tanstack/react-query";
import { claveActiva } from "@/lib/query-scope";
import { Loader2, MessageCircle } from "lucide-react";
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

type WhatsappWebhookEvent = Tables<"whatsapp_webhook_events">;

const eventosQueryKey = () => claveActiva("whatsapp-webhook-eventos");

async function getWhatsappWebhookEventos(): Promise<WhatsappWebhookEvent[]> {
  const { data, error } = await supabase
    .from("whatsapp_webhook_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return data ?? [];
}

const ETIQUETA_ESTADO: Record<string, string> = {
  procesado: "Procesado",
  error: "Error",
  pendiente: "Pendiente",
};

const CLASE_BADGE_ESTADO: Record<string, string> = {
  procesado: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600",
  error: "border-destructive/40 bg-destructive/10 text-destructive",
  pendiente: "border-amber-500/40 bg-amber-500/10 text-amber-600",
};

function EstadoBadge({ estado }: { estado: string }) {
  return (
    <Badge variant="outline" className={CLASE_BADGE_ESTADO[estado] ?? ""}>
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

export function WhatsappEventosTabla() {
  const eventos = useQuery({
    queryKey: eventosQueryKey(),
    queryFn: getWhatsappWebhookEventos,
  });

  return (
    <Card className="border-border/60 shadow-none">
      <CardHeader>
        <div className="flex items-start gap-4">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/25">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div className="min-w-0 space-y-1.5">
            <CardTitle>Eventos recibidos</CardTitle>
            <CardDescription>
              Últimos 50 eventos de webhook de WhatsApp registrados para tu consultorio.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {eventos.isPending ? (
          <div className="flex min-h-24 items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando eventos…
          </div>
        ) : eventos.isError ? (
          <div
            role="alert"
            className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
          >
            {eventos.error.message}
          </div>
        ) : eventos.data.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border/70 px-4 py-6 text-center text-sm text-muted-foreground">
            Aún no se han recibido eventos de WhatsApp.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Detalle de error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {eventos.data.map((evento) => (
                <TableRow key={evento.id}>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {formatearFecha(evento.created_at)}
                  </TableCell>
                  <TableCell>
                    <EstadoBadge estado={evento.estado} />
                  </TableCell>
                  <TableCell className="text-sm">{evento.phone_number_id}</TableCell>
                  <TableCell className="max-w-md truncate text-sm text-muted-foreground">
                    {evento.detalle_error ?? "—"}
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
