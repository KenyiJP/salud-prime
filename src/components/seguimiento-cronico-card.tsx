import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Activity,
  CalendarClock,
  CheckCircle2,
  FlaskConical,
  PauseCircle,
  Pill,
  PlayCircle,
  Plus,
  ShieldCheck,
  Stethoscope,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TIPOS_HITO_SEGUIMIENTO,
  inferirControlDesdeTexto,
  type EstadoHitoSeguimiento,
  type TipoHitoSeguimiento,
} from "@/lib/seguimiento-cronico-schemas";
import {
  useActualizarHitoSeguimiento,
  useCambiarEstadoPlan,
  useCrearSeguimientoPlan,
  useSeguimientosPaciente,
  useTiposConsultaSeguimiento,
} from "@/lib/seguimiento-cronico.queries";

interface SeguimientoCronicoCardProps {
  pacienteId: string;
  condicionSugerida?: string | null;
  proximoControlSugerido?: string | null;
  atencionOrigenId?: string | null;
}

const ETIQUETA_TIPO_HITO: Record<TipoHitoSeguimiento, string> = {
  control_medico: "Control médico",
  laboratorio: "Exámenes de control",
  medicacion: "Adherencia a medicación",
};

const ETIQUETA_ESTADO_HITO: Record<
  EstadoHitoSeguimiento,
  { texto: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  pendiente: { texto: "Programado", variant: "outline" },
  notificado: { texto: "WhatsApp enviado", variant: "secondary" },
  completado: { texto: "Completado", variant: "default" },
  cancelado: { texto: "Cancelado", variant: "destructive" },
};

function IconoTipoHito({ tipo }: { tipo: TipoHitoSeguimiento }) {
  if (tipo === "laboratorio") return <FlaskConical className="h-3.5 w-3.5 text-primary" />;
  if (tipo === "medicacion") return <Pill className="h-3.5 w-3.5 text-primary" />;
  return <Stethoscope className="h-3.5 w-3.5 text-primary" />;
}

export function SeguimientoCronicoCard({
  pacienteId,
  condicionSugerida,
  proximoControlSugerido,
  atencionOrigenId,
}: SeguimientoCronicoCardProps) {
  const { data: planes, isLoading } = useSeguimientosPaciente(pacienteId);
  const { data: tiposConsulta } = useTiposConsultaSeguimiento();
  const crearPlan = useCrearSeguimientoPlan();
  const cambiarEstadoPlan = useCambiarEstadoPlan(pacienteId);
  const actualizarHito = useActualizarHitoSeguimiento(pacienteId);

  const inferido = useMemo(
    () => inferirControlDesdeTexto(proximoControlSugerido),
    [proximoControlSugerido],
  );

  const [mostrarForm, setMostrarForm] = useState(false);
  const [condicion, setCondicion] = useState(condicionSugerida ?? "");
  const [tipoHito, setTipoHito] = useState<TipoHitoSeguimiento>("control_medico");
  const [periodicidad, setPeriodicidad] = useState(String(inferido.periodicidadDias));
  const [proximaFecha, setProximaFecha] = useState(inferido.proximaFechaIso);
  const [tipoConsultaId, setTipoConsultaId] = useState<string>("sin_tarifa");
  const [notasAdherencia, setNotasAdherencia] = useState(proximoControlSugerido ?? "");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (condicionSugerida && !condicion) {
      setCondicion(condicionSugerida);
    }
  }, [condicionSugerida, condicion]);

  useEffect(() => {
    setPeriodicidad(String(inferido.periodicidadDias));
    setProximaFecha(inferido.proximaFechaIso);
    if (proximoControlSugerido) {
      setNotasAdherencia(proximoControlSugerido);
    }
  }, [inferido.periodicidadDias, inferido.proximaFechaIso, proximoControlSugerido]);

  const handlePeriodicidadRapida = (dias: number) => {
    setPeriodicidad(String(dias));
    const hoy = new Date();
    hoy.setDate(hoy.getDate() + dias);
    const yyyy = hoy.getFullYear();
    const mm = String(hoy.getMonth() + 1).padStart(2, "0");
    const dd = String(hoy.getDate()).padStart(2, "0");
    setProximaFecha(`${yyyy}-${mm}-${dd}`);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      await crearPlan.mutateAsync({
        paciente_id: pacienteId,
        condicion: condicion.trim(),
        periodicidad_dias: parseInt(periodicidad, 10) || 30,
        proxima_fecha: proximaFecha,
        tipo_hito: tipoHito,
        notas_adherencia: notasAdherencia.trim() || null,
        tipo_consulta_id: tipoConsultaId !== "sin_tarifa" ? tipoConsultaId : null,
        atencion_origen_id: atencionOrigenId ?? null,
      });
      setMostrarForm(false);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "No se pudo registrar el plan.");
    }
  };

  return (
    <Card className="border-border/60 bg-card" data-testid="seguimiento-cronico-card">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Activity className="h-4 w-4 text-primary" />
            Seguimiento Automatizado de Crónicos (WhatsApp)
          </CardTitle>
          <CardDescription>
            Programa controles periódicos de consulta, laboratorio o medicación con aviso neutro por
            WhatsApp (Ley N° 29733) y cita de control vinculada.
          </CardDescription>
        </div>
        <Button
          type="button"
          size="sm"
          variant={mostrarForm ? "outline" : "default"}
          onClick={() => {
            setErrorMsg(null);
            setMostrarForm((prev) => !prev);
          }}
        >
          <Plus className="mr-1 h-4 w-4" />
          {mostrarForm ? "Cancelar" : "Nuevo plan crónico"}
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {mostrarForm ? (
          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-lg border border-border/60 bg-muted/20 p-4"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="seg-condicion">Condición crónica (uso interno en HCE)</Label>
                <Input
                  id="seg-condicion"
                  placeholder="Ej. Hipertensión arterial esencial, Diabetes Mellitus tipo 2..."
                  value={condicion}
                  onChange={(e) => setCondicion(e.target.value)}
                  maxLength={200}
                  required
                />
                <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  Privacidad protegida: el diagnóstico nunca se muestra en el mensaje de WhatsApp.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="seg-tipo-hito">Tipo de seguimiento</Label>
                <Select
                  value={tipoHito}
                  onValueChange={(v) => setTipoHito(v as TipoHitoSeguimiento)}
                >
                  <SelectTrigger id="seg-tipo-hito">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_HITO_SEGUIMIENTO.map((t) => (
                      <SelectItem key={t.valor} value={t.valor}>
                        {t.etiqueta}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="seg-tipo-consulta">
                  Tarifa / Tipo de consulta de control (BYOK)
                </Label>
                <Select value={tipoConsultaId} onValueChange={setTipoConsultaId}>
                  <SelectTrigger id="seg-tipo-consulta">
                    <SelectValue placeholder="Reserva sin cobro adelantado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sin_tarifa">Sin tarifa adelantada (libre)</SelectItem>
                    {(tiposConsulta ?? []).map((tc) => (
                      <SelectItem key={tc.id} value={tc.id}>
                        {tc.nombre}
                        {tc.precio_consulta != null
                          ? ` — S/ ${Number(tc.precio_consulta).toFixed(2)}${
                              tc.requiere_pago_adelantado ? " (pago adelantado)" : ""
                            }`
                          : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="seg-periodicidad">Periodicidad (días)</Label>
                <div className="flex items-center gap-1.5">
                  <Input
                    id="seg-periodicidad"
                    type="number"
                    min={1}
                    max={365}
                    value={periodicidad}
                    onChange={(e) => setPeriodicidad(e.target.value)}
                    required
                  />
                  {[15, 30, 60, 90].map((d) => (
                    <Button
                      key={d}
                      type="button"
                      size="sm"
                      variant={periodicidad === String(d) ? "secondary" : "outline"}
                      className="px-2 text-xs"
                      onClick={() => handlePeriodicidadRapida(d)}
                    >
                      {d}d
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="seg-fecha">Fecha del próximo control</Label>
                <Input
                  id="seg-fecha"
                  type="date"
                  value={proximaFecha}
                  onChange={(e) => setProximaFecha(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="seg-notas">
                  Nota clínica interna de control (laboratorios pedidos, metas o adherencia)
                </Label>
                <Input
                  id="seg-notas"
                  placeholder="Ej. Traer HbA1c, creatinina sérica y bitácora de presión arterial..."
                  value={notasAdherencia}
                  onChange={(e) => setNotasAdherencia(e.target.value)}
                  maxLength={240}
                />
              </div>
            </div>

            {errorMsg ? (
              <p role="alert" className="text-xs font-medium text-destructive">
                {errorMsg}
              </p>
            ) : null}

            <div className="flex justify-end gap-2">
              <Button
                type="submit"
                size="sm"
                disabled={crearPlan.isPending}
              >
                {crearPlan.isPending
                  ? "Programando..."
                  : "Guardar plan y agendar cita de control"}
              </Button>
            </div>
          </form>
        ) : null}

        {isLoading ? (
          <p className="text-xs text-muted-foreground">Cargando planes de seguimiento…</p>
        ) : !planes || planes.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Este paciente aún no tiene planes de seguimiento crónico activos.
          </p>
        ) : (
          <div className="space-y-3">
            {planes.map((plan) => {
              const hitosOrdenados = [...(plan.seguimiento_hitos ?? [])].sort((a, b) =>
                b.fecha_programada.localeCompare(a.fecha_programada),
              );

              return (
                <div
                  key={plan.id}
                  className="space-y-2.5 rounded-lg border border-border/60 bg-background/60 p-3 text-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-foreground">{plan.condicion}</span>
                        <Badge variant={plan.activo ? "default" : "secondary"}>
                          {plan.activo ? `Cada ${plan.periodicidad_dias} días` : "En pausa"}
                        </Badge>
                      </div>
                      {plan.notas_adherencia ? (
                        <p className="text-xs text-muted-foreground">{plan.notas_adherencia}</p>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CalendarClock className="h-3.5 w-3.5" />
                        Próximo: {plan.proxima_fecha}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs"
                        disabled={cambiarEstadoPlan.isPending}
                        onClick={() =>
                          cambiarEstadoPlan.mutate({
                            seguimientoId: plan.id,
                            activo: !plan.activo,
                          })
                        }
                      >
                        {plan.activo ? (
                          <>
                            <PauseCircle className="mr-1 h-3.5 w-3.5" />
                            Pausar
                          </>
                        ) : (
                          <>
                            <PlayCircle className="mr-1 h-3.5 w-3.5" />
                            Reactivar
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {hitosOrdenados.length > 0 ? (
                    <div className="space-y-1.5 border-t border-border/40 pt-2">
                      {hitosOrdenados.slice(0, 4).map((hito) => {
                        const badgeInfo = ETIQUETA_ESTADO_HITO[hito.estado] ?? {
                          texto: hito.estado,
                          variant: "outline" as const,
                        };
                        const abierto =
                          hito.estado === "pendiente" || hito.estado === "notificado";

                        return (
                          <div
                            key={hito.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded bg-muted/30 px-2.5 py-1.5 text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <IconoTipoHito tipo={hito.tipo} />
                              <span className="font-medium">
                                {ETIQUETA_TIPO_HITO[hito.tipo] ?? hito.tipo}
                              </span>
                              <span className="text-muted-foreground">
                                · {hito.fecha_programada}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <Badge variant={badgeInfo.variant} className="text-[10px]">
                                {badgeInfo.texto}
                              </Badge>
                              {abierto ? (
                                <>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 px-1.5 text-[11px] text-emerald-700 hover:text-emerald-800"
                                    disabled={actualizarHito.isPending}
                                    onClick={() =>
                                      actualizarHito.mutate({
                                        hitoId: hito.id,
                                        nuevoEstado: "completado",
                                      })
                                    }
                                    title="Marcar control como completado y agendar el siguiente"
                                  >
                                    <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                                    Cumplido
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 px-1.5 text-[11px] text-destructive hover:text-destructive"
                                    disabled={actualizarHito.isPending}
                                    onClick={() =>
                                      actualizarHito.mutate({
                                        hitoId: hito.id,
                                        nuevoEstado: "cancelado",
                                      })
                                    }
                                    title="Cancelar este control"
                                  >
                                    <XCircle className="h-3.5 w-3.5" />
                                  </Button>
                                </>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
