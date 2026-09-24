import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CircleDollarSign, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  etiquetaEstadoPagoReserva,
  formatearSoles,
  registrarPagoPresencialSchema,
  type CitaRow,
} from "@/lib/clinica-schemas";
import {
  useMovimientosPagoCita,
  useRegistrarPagoPresencial,
  useResumenPagoCita,
} from "@/lib/citas.queries";

const METODOS_PAGO = [
  { value: "efectivo", label: "Efectivo" },
  { value: "pos", label: "POS / tarjeta" },
  { value: "transferencia", label: "Transferencia" },
  { value: "yape_plin", label: "Yape / Plin" },
] as const;

const CONCEPTOS_PAGO = [
  { value: "adelanto", label: "Adelanto" },
  { value: "saldo", label: "Saldo" },
  { value: "pago_completo", label: "Pago completo" },
  { value: "reembolso", label: "Reembolso" },
] as const;

/** Variant de {@link Badge} según el estado de pago de la reserva. */
function variantePorEstadoPago(
  estado: string | null,
): "default" | "secondary" | "destructive" | "outline" {
  switch (estado) {
    case "verificado":
      return "default";
    case "parcial":
    case "reportado":
      return "secondary";
    case "rechazado":
      return "destructive";
    default:
      return "outline";
  }
}

/** Badge compacto de estado de pago, reutilizable en el diálogo y en la agenda. */
export function BadgeEstadoPagoCita({ estado }: { estado: string | null }) {
  if (!estado || estado === "sin_pago") return null;
  return <Badge variant={variantePorEstadoPago(estado)}>{etiquetaEstadoPagoReserva(estado)}</Badge>;
}

/**
 * Panel financiero de una cita: lee el total esperado / pagado / pendiente
 * estrictamente de la vista `citas_resumen_pago` (regla de oro: nunca se
 * recalculan sumas en el frontend), muestra el historial de `pagos_cita` y
 * permite registrar un cobro presencial vía la RPC
 * `registrar_pago_presencial_cita`.
 */
export function CitaCobroPanel({ cita }: { cita: CitaRow }) {
  const { data: resumen, isLoading: cargandoResumen } = useResumenPagoCita(cita.id);
  const { data: movimientos, isLoading: cargandoMovimientos } = useMovimientosPagoCita(cita.id);
  const [dialogCobroAbierto, setDialogCobroAbierto] = useState(false);
  const [generandoOrden, setGenerandoOrden] = useState(false);

  if (!resumen && !cargandoResumen) return null;

  const generarYCopiarLinkPago = async () => {
    setGenerandoOrden(true);
    try {
      const { data: sesion } = await supabase.auth.getSession();
      const accessToken = sesion.session?.access_token;
      if (!accessToken) {
        toast.error("Tu sesión expiró. Vuelve a iniciar sesión.");
        return;
      }

      const respuesta = await fetch(
        "https://qtdhpvzvkzochawsdhxl.supabase.co/functions/v1/crear-orden-pago-cita",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ cita_id: cita.id }),
        },
      );

      const payload = (await respuesta.json().catch(() => ({}))) as {
        ok?: boolean;
        payment_code_url?: string | null;
        error?: string;
      };

      if (!respuesta.ok || !payload.ok) {
        toast.error(payload.error || "No se pudo generar el link de pago.");
        return;
      }
      if (!payload.payment_code_url) {
        toast.error("Culqi no devolvió un link de pago para esta orden.");
        return;
      }

      await navigator.clipboard.writeText(payload.payment_code_url);
      toast.success("Link de pago copiado. Compártelo con el paciente.");
    } catch {
      toast.error("No se pudo generar el link de pago. Intenta de nuevo.");
    } finally {
      setGenerandoOrden(false);
    }
  };

  return (
    <div className="space-y-3 rounded-lg border border-border/60 p-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="flex items-center gap-1.5 text-sm font-semibold">
          <CircleDollarSign className="h-4 w-4" /> Cobro de la cita
        </h4>
        {resumen ? <BadgeEstadoPagoCita estado={resumen.estado_pago_reserva} /> : null}
      </div>

      {cargandoResumen || !resumen ? (
        <p className="text-xs text-muted-foreground">Cargando resumen de pago…</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-md bg-muted/50 p-2">
              <p className="text-muted-foreground">Total esperado</p>
              <p className="font-semibold">
                {resumen.monto_esperado != null ? formatearSoles(resumen.monto_esperado) : "—"}
              </p>
            </div>
            <div className="rounded-md bg-muted/50 p-2">
              <p className="text-muted-foreground">Total pagado</p>
              <p className="font-semibold">
                {resumen.total_pagado != null
                  ? formatearSoles(resumen.total_pagado)
                  : formatearSoles(0)}
              </p>
            </div>
            <div className="rounded-md bg-muted/50 p-2">
              <p className="text-muted-foreground">Saldo pendiente</p>
              <p className="font-semibold">
                {resumen.saldo_pendiente != null ? formatearSoles(resumen.saldo_pendiente) : "—"}
              </p>
            </div>
          </div>

          {resumen.pago_obligatorio ? (
            <p className="text-xs text-muted-foreground">
              Adelanto requerido:{" "}
              {resumen.monto_adelanto_esperado != null
                ? formatearSoles(resumen.monto_adelanto_esperado)
                : "—"}
            </p>
          ) : null}

          <Separator />

          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">Movimientos</p>
            {cargandoMovimientos ? (
              <p className="text-xs text-muted-foreground">Cargando movimientos…</p>
            ) : !movimientos || movimientos.length === 0 ? (
              <p className="text-xs text-muted-foreground">Sin pagos registrados todavía.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="h-7 text-xs">Fecha</TableHead>
                    <TableHead className="h-7 text-xs">Concepto</TableHead>
                    <TableHead className="h-7 text-xs">Método</TableHead>
                    <TableHead className="h-7 text-right text-xs">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movimientos.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="py-1 text-xs">
                        {new Date(m.created_at).toLocaleString("es-PE", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </TableCell>
                      <TableCell className="py-1 text-xs capitalize">
                        {m.concepto.replace("_", " ")}
                      </TableCell>
                      <TableCell className="py-1 text-xs capitalize">
                        {m.metodo.replace("_", " / ")}
                      </TableCell>
                      <TableCell className="py-1 text-right text-xs">
                        {formatearSoles(m.monto)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Dialog open={dialogCobroAbierto} onOpenChange={setDialogCobroAbierto}>
              <DialogTrigger asChild>
                <Button type="button" size="sm">
                  Registrar cobro presencial
                </Button>
              </DialogTrigger>
              <DialogContent>
                <FormularioCobroPresencial
                  citaId={cita.id}
                  onExito={() => setDialogCobroAbierto(false)}
                />
              </DialogContent>
            </Dialog>

            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={generandoOrden}
              onClick={generarYCopiarLinkPago}
            >
              {generandoOrden ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Copy className="mr-1.5 h-3.5 w-3.5" />
              )}
              Copiar link de pago
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function FormularioCobroPresencial({ citaId, onExito }: { citaId: string; onExito: () => void }) {
  const registrar = useRegistrarPagoPresencial(citaId);
  const form = useForm({
    resolver: zodResolver(registrarPagoPresencialSchema),
    defaultValues: {
      cita_id: citaId,
      monto: 0,
      metodo: "efectivo" as const,
      concepto: "pago_completo" as const,
      nota: "",
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => {
          registrar.mutate(values, {
            onSuccess: (resultado) => {
              if (resultado.ok) onExito();
            },
          });
        })}
        className="space-y-3"
      >
        <DialogHeader>
          <DialogTitle>Registrar cobro presencial</DialogTitle>
        </DialogHeader>

        <FormField
          control={form.control}
          name="monto"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Monto (S/)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min={0.01}
                  {...field}
                  onChange={(e) => field.onChange(e.target.valueAsNumber)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="metodo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Método</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {METODOS_PAGO.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="concepto"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Concepto</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {CONCEPTOS_PAGO.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="nota"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nota (opcional)</FormLabel>
              <FormControl>
                <Textarea rows={2} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="submit" disabled={registrar.isPending}>
            {registrar.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
            Registrar cobro
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
