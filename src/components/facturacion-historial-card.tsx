import { Loader2, Receipt } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatearMonto, type EstadoTransaccion } from "@/lib/facturacion-schemas";
import { useHistorialTransaccionesQuery } from "@/lib/facturacion.queries";

const ESTADO_BADGE: Record<
  EstadoTransaccion,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  exitosa: { label: "Pagado", variant: "default" },
  pendiente: { label: "Pendiente", variant: "secondary" },
  fallida: { label: "Fallida", variant: "destructive" },
  anulada: { label: "Anulada", variant: "outline" },
};

export function FacturacionHistorialCard() {
  const historial = useHistorialTransaccionesQuery();

  return (
    <Card className="max-w-3xl border-border/60 shadow-none">
      <CardHeader>
        <div className="flex items-start gap-4">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/25">
            <Receipt className="h-5 w-5" />
          </div>
          <div className="min-w-0 space-y-1.5">
            <CardTitle>Historial de pagos de tu suscripción</CardTitle>
            <CardDescription>
              Cargos de tu plan MATEO, procesados y deduplicados automáticamente por webhook.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {historial.isPending ? (
          <div className="flex min-h-24 items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando historial…
          </div>
        ) : historial.isError ? (
          <div
            role="alert"
            className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
          >
            {historial.error.message}
          </div>
        ) : historial.data && historial.data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border/60 text-xs uppercase text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Fecha</th>
                  <th className="py-2 pr-4 font-medium">Periodo</th>
                  <th className="py-2 pr-4 font-medium">Monto</th>
                  <th className="py-2 pr-4 font-medium">Método</th>
                  <th className="py-2 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {historial.data.map((transaccion) => {
                  const estado = ESTADO_BADGE[transaccion.estado as EstadoTransaccion] ?? {
                    label: transaccion.estado,
                    variant: "outline" as const,
                  };
                  return (
                    <tr key={transaccion.id} className="border-b border-border/40 last:border-0">
                      <td className="py-2.5 pr-4 text-muted-foreground">
                        {new Date(transaccion.created_at).toLocaleDateString("es-PE")}
                      </td>
                      <td className="py-2.5 pr-4 text-muted-foreground">
                        {transaccion.periodo_inicio
                          ? new Date(transaccion.periodo_inicio).toLocaleDateString("es-PE")
                          : "—"}
                      </td>
                      <td className="py-2.5 pr-4 font-medium">
                        {formatearMonto(transaccion.monto, transaccion.moneda)}
                      </td>
                      <td className="py-2.5 pr-4 text-muted-foreground">
                        {transaccion.metodo_pago ?? "—"}
                      </td>
                      <td className="py-2.5">
                        <Badge variant={estado.variant}>{estado.label}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Aún no registras pagos de suscripción. Aparecerán aquí en cuanto confirmes tu plan.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
