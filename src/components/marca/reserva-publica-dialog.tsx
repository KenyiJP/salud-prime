import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CalendarCheck, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ASEGURADORA_TIPOS,
  ETIQUETA_ASEGURADORA,
  reservaPublicaFormSchema,
  type ReservaPublicaFormInput,
  type SlotDisponible,
} from "@/lib/landing-marca-schemas";
import {
  useRegistrarReservaWeb,
  useSlotsDisponibles,
  useTiposConsultaPublicos,
} from "@/lib/reserva-publica.queries";

const VACIO: ReservaPublicaFormInput = {
  nombres: "",
  apellidos: "",
  telefono: "",
  email: null,
  documento_identidad: null,
  aseguradora_tipo: "particular",
  aseguradora_nombre: null,
  comentario: null,
  tipo_consulta_id: null,
};

/** yyyy-MM-dd en zona horaria local (nunca UTC: evita el corrimiento de un día). */
function fechaLocalISO(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function horaCortaLima(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Lima",
  });
}

/**
 * Modal de reserva pública (Día 18b): un visitante anónimo de `/dr-{slug}`
 * elige tipo de consulta, fecha, hora y completa sus datos, todo sin sesión.
 * Cada paso pasa exclusivamente por las RPCs `security definer` del backend
 * (`obtener_tipos_consulta_publicos` / `obtener_slots_disponibles` /
 * `registrar_reserva_web`) — este componente nunca toca `citas`/`pacientes`
 * directo, coherente con el aislamiento multi-tenant de la NTS 139 MINSA.
 */
export function ReservaPublicaDialog({
  slug,
  nombreMedico,
  colorPrimario,
  trigger,
}: {
  slug: string;
  nombreMedico: string;
  colorPrimario: string;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [fecha, setFecha] = useState<Date>(() => new Date());
  const [tipoConsultaId, setTipoConsultaId] = useState<string | null>(null);
  const [slotElegido, setSlotElegido] = useState<SlotDisponible | null>(null);
  const [confirmacion, setConfirmacion] = useState<{ codigo: string } | null>(null);

  const { data: tipos, isLoading: cargandoTipos } = useTiposConsultaPublicos(slug);
  const fechaISO = fechaLocalISO(fecha);
  const {
    data: slots,
    isLoading: cargandoSlots,
    isFetching: refrescandoSlots,
  } = useSlotsDisponibles({ slug, fecha: fechaISO, tipo_consulta_id: tipoConsultaId }, open);
  const registrar = useRegistrarReservaWeb();

  const form = useForm<ReservaPublicaFormInput>({
    resolver: zodResolver(reservaPublicaFormSchema),
    defaultValues: VACIO,
  });
  const aseguradoraTipo = form.watch("aseguradora_tipo");

  const hoyISO = fechaLocalISO(new Date());
  const limiteISO = fechaLocalISO(new Date(Date.now() + 60 * 24 * 60 * 60 * 1000));

  function reiniciar() {
    form.reset(VACIO);
    setSlotElegido(null);
    setConfirmacion(null);
    setTipoConsultaId(null);
    setFecha(new Date());
  }

  function alCambiarApertura(v: boolean) {
    setOpen(v);
    if (!v) reiniciar();
  }

  function onSubmit(values: ReservaPublicaFormInput) {
    if (!slotElegido) return;
    registrar.mutate(
      { ...values, slug, inicio: slotElegido.inicio, tipo_consulta_id: tipoConsultaId },
      {
        onSuccess: (resultado) => {
          if (resultado.ok) {
            setConfirmacion({ codigo: resultado.cita_id ?? "" });
          } else {
            form.setError("root", {
              message: mensajeError(resultado.error_codigo) ?? "No se pudo registrar la reserva.",
            });
            // El slot pudo ocuparse justo ahora (carrera con otro paciente):
            // se limpia la selección para forzar a elegir uno nuevo y evitar
            // reintentar sobre una hora que ya no existe.
            if (resultado.error_codigo === "slot_no_disponible") setSlotElegido(null);
          }
        },
      },
    );
  }

  const nombreDia = fecha.toLocaleDateString("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Lima",
  });

  return (
    <Dialog open={open} onOpenChange={alCambiarApertura}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        {confirmacion ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 className="h-12 w-12" style={{ color: colorPrimario }} />
            <DialogTitle>¡Cita reservada!</DialogTitle>
            <DialogDescription>
              Tu cita con Dr(a). {nombreMedico} quedó agendada para el {nombreDia} a las{" "}
              {slotElegido ? horaCortaLima(slotElegido.inicio) : ""}. Te contactaremos al teléfono
              indicado para confirmar cualquier detalle.
            </DialogDescription>
            <Button
              onClick={() => alCambiarApertura(false)}
              style={{ backgroundColor: colorPrimario }}
            >
              Listo
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Reservar cita con Dr(a). {nombreMedico}</DialogTitle>
              <DialogDescription>
                Elige el tipo de consulta (si aplica), la fecha y la hora disponible.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {cargandoTipos ? (
                <Skeleton className="h-9 w-full" />
              ) : tipos && tipos.length > 0 ? (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Tipo de consulta</label>
                  <Select
                    value={tipoConsultaId ?? "__default__"}
                    onValueChange={(v) => {
                      setTipoConsultaId(v === "__default__" ? null : v);
                      setSlotElegido(null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el tipo de consulta" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__default__">Consulta general</SelectItem>
                      {tipos.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.nombre} · {t.duracion_minutos} min
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start sm:gap-6">
                <Calendar
                  mode="single"
                  selected={fecha}
                  onSelect={(d) => {
                    if (!d) return;
                    setFecha(d);
                    setSlotElegido(null);
                  }}
                  disabled={(d) => {
                    const iso = fechaLocalISO(d);
                    return iso < hoyISO || iso > limiteISO;
                  }}
                  className="rounded-md border"
                />
                <div className="w-full flex-1 space-y-2">
                  <p className="text-sm font-medium capitalize">{nombreDia}</p>
                  {cargandoSlots || refrescandoSlots ? (
                    <div className="grid grid-cols-3 gap-2">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-9 w-full" />
                      ))}
                    </div>
                  ) : slots && slots.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {slots.map((s) => (
                        <Button
                          key={s.inicio}
                          type="button"
                          variant={slotElegido?.inicio === s.inicio ? "default" : "outline"}
                          size="sm"
                          style={
                            slotElegido?.inicio === s.inicio
                              ? { backgroundColor: colorPrimario }
                              : undefined
                          }
                          onClick={() => setSlotElegido(s)}
                        >
                          {horaCortaLima(s.inicio)}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No hay horas disponibles este día. Prueba otra fecha.
                    </p>
                  )}
                </div>
              </div>

              {slotElegido ? (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 border-t pt-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="nombres"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombres</FormLabel>
                            <FormControl>
                              <Input placeholder="Ej. María" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="apellidos"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Apellidos</FormLabel>
                            <FormControl>
                              <Input placeholder="Ej. Rodríguez" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="telefono"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Celular</FormLabel>
                            <FormControl>
                              <Input placeholder="987654321" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="documento_identidad"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>DNI (opcional)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Opcional"
                                {...field}
                                value={field.value ?? ""}
                                onChange={(e) => field.onChange(e.target.value || null)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Correo (opcional)</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="Opcional"
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) => field.onChange(e.target.value || null)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="aseguradora_tipo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Seguro / cobertura</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {ASEGURADORA_TIPOS.map((tipo) => (
                                  <SelectItem key={tipo} value={tipo}>
                                    {ETIQUETA_ASEGURADORA[tipo]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {aseguradoraTipo === "eps" ? (
                        <FormField
                          control={form.control}
                          name="aseguradora_nombre"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nombre de tu EPS</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Ej. Rímac, Pacífico"
                                  {...field}
                                  value={field.value ?? ""}
                                  onChange={(e) => field.onChange(e.target.value || null)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ) : null}
                    </div>
                    <FormField
                      control={form.control}
                      name="comentario"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Motivo de consulta (opcional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Cuéntanos brevemente el motivo de tu visita"
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) => field.onChange(e.target.value || null)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {form.formState.errors.root ? (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.root.message}
                      </p>
                    ) : null}
                    <DialogFooter>
                      <Button
                        type="submit"
                        disabled={registrar.isPending}
                        style={{ backgroundColor: colorPrimario }}
                        className="gap-2 text-white hover:opacity-90"
                      >
                        {registrar.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CalendarCheck className="h-4 w-4" />
                        )}
                        Confirmar reserva
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              ) : null}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function mensajeError(codigo: string | null): string | null {
  switch (codigo) {
    case "slot_no_disponible":
      return "Esa hora acaba de ocuparse. Elige otro horario disponible.";
    case "rate_limit":
      return "Alcanzaste el máximo de intentos de reserva por hora. Intenta más tarde o escríbenos por WhatsApp.";
    case "landing_no_encontrada":
      return "Esta página médica ya no está disponible.";
    default:
      return null;
  }
}
