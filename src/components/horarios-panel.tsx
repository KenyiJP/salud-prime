import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CalendarOff, Clock, Pencil, Plus, Stethoscope, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmarEliminar } from "@/components/confirmar-eliminar";
import { formatearSoles } from "@/lib/clinica-schemas";
import {
  DIAS_SEMANA,
  horaCortaTexto,
  nombreDiaSemana,
  nuevoBloqueoSchema,
  nuevoHorarioSchema,
  nuevoTipoConsultaSchema,
  type NuevoBloqueoInput,
  type NuevoHorarioInput,
  type NuevoTipoConsultaInput,
  type TipoConsultaRow,
} from "@/lib/agenda-schemas";
import {
  useActualizarTipoConsulta,
  useBloqueos,
  useCrearBloqueo,
  useCrearHorario,
  useCrearTipoConsulta,
  useEliminarBloqueo,
  useHorarios,
  useTiposConsultaAdmin,
  useToggleHorario,
  useToggleTipoConsulta,
} from "@/lib/agenda.queries";

export function HorariosPanel() {
  return (
    <div className="space-y-6">
      <TiposConsulta />
      <div className="grid gap-6 lg:grid-cols-2">
        <TurnosSemanales />
        <BloqueosAgenda />
      </div>
    </div>
  );
}

const TIPO_CONSULTA_VALORES_VACIOS: NuevoTipoConsultaInput = {
  nombre: "",
  duracion_minutos: 30,
  precio_consulta: null,
  requiere_pago_adelantado: false,
  porcentaje_adelanto: null,
};

function TiposConsulta() {
  const { data: tipos } = useTiposConsultaAdmin();
  const crear = useCrearTipoConsulta();
  const actualizar = useActualizarTipoConsulta();
  const toggle = useToggleTipoConsulta();

  const [dialogAbierto, setDialogAbierto] = useState(false);
  const [editando, setEditando] = useState<TipoConsultaRow | null>(null);

  const form = useForm<NuevoTipoConsultaInput>({
    resolver: zodResolver(nuevoTipoConsultaSchema),
    defaultValues: TIPO_CONSULTA_VALORES_VACIOS,
  });

  const watchPrecio = form.watch("precio_consulta");
  const watchRequierePago = form.watch("requiere_pago_adelantado");
  const watchPorcentaje = form.watch("porcentaje_adelanto");

  useEffect(() => {
    if (dialogAbierto) {
      form.reset(
        editando
          ? {
              nombre: editando.nombre,
              duracion_minutos: editando.duracion_minutos,
              precio_consulta: editando.precio_consulta,
              requiere_pago_adelantado: editando.requiere_pago_adelantado,
              porcentaje_adelanto: editando.porcentaje_adelanto,
            }
          : TIPO_CONSULTA_VALORES_VACIOS,
      );
    }
  }, [dialogAbierto, editando, form]);

  function abrirNuevo() {
    setEditando(null);
    setDialogAbierto(true);
  }

  function abrirEditar(tipo: TipoConsultaRow) {
    setEditando(tipo);
    setDialogAbierto(true);
  }

  async function onSubmit(values: NuevoTipoConsultaInput) {
    if (editando) {
      await actualizar.mutateAsync({ id: editando.id, ...values });
    } else {
      await crear.mutateAsync(values);
    }
    setDialogAbierto(false);
  }

  const enviando = crear.isPending || actualizar.isPending;

  return (
    <section className="rounded-xl border border-border/60 bg-card p-5">
      <header className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Stethoscope className="h-4 w-4 text-primary" />
          <h2 className="font-display text-base font-semibold">Tipos de consulta</h2>
        </div>
        <Button size="sm" className="gap-2" onClick={abrirNuevo}>
          <Plus className="h-4 w-4" /> Nuevo tipo
        </Button>
      </header>
      <p className="mb-4 text-sm text-muted-foreground">
        Define cuánto dura cada tipo de consulta (ej. "Consulta general" 20 min, "Primera vez" 45
        min). Tu página pública usa esta duración para armar automáticamente los horarios
        disponibles, y también se sincroniza con Google Calendar.
      </p>

      <ul className="divide-y divide-border/50 border-t border-border/50">
        {tipos.map((tipo) => (
          <li key={tipo.id} className="flex items-center justify-between gap-3 py-3 text-sm">
            <div>
              <p className="font-medium">{tipo.nombre}</p>
              <p className="text-xs text-muted-foreground">
                {tipo.duracion_minutos} min
                {tipo.precio_consulta != null ? ` · ${formatearSoles(tipo.precio_consulta)}` : ""}
                {tipo.requiere_pago_adelantado && tipo.precio_consulta != null
                  ? ` · Adelanto ${
                      tipo.porcentaje_adelanto != null
                        ? `${tipo.porcentaje_adelanto}% (${formatearSoles(
                            (tipo.precio_consulta * tipo.porcentaje_adelanto) / 100,
                          )})`
                        : "100%"
                    }`
                  : ""}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                {tipo.activo ? "Activo" : "Inactivo"}
                <Switch
                  checked={!!tipo.activo}
                  disabled={toggle.isPending}
                  onCheckedChange={(activo) => toggle.mutate({ id: tipo.id, activo })}
                  aria-label={`Activar tipo de consulta ${tipo.nombre}`}
                />
              </label>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => abrirEditar(tipo)}
                aria-label={`Editar ${tipo.nombre}`}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          </li>
        ))}
        {tipos.length === 0 ? (
          <li className="py-6 text-center text-sm text-muted-foreground">
            Aún no configuras tipos de consulta. Mientras tanto, tu web pública usa la duración del
            turno (slot) en el que caiga cada horario.
          </li>
        ) : null}
      </ul>

      <Dialog open={dialogAbierto} onOpenChange={setDialogAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editando ? "Editar tipo de consulta" : "Nuevo tipo de consulta"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input placeholder="Consulta general" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="duracion_minutos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duración (min)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={5}
                        step={5}
                        {...field}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="precio_consulta"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio (S/)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step={0.5}
                        placeholder="Sin tarifa publicada"
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const valor = e.target.value;
                          field.onChange(valor === "" ? null : Number(valor));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="requiere_pago_adelantado"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                    <div>
                      <FormLabel className="text-sm">Exigir pago adelantado</FormLabel>
                      <p className="text-xs text-muted-foreground">
                        El paciente debe pagar antes de confirmar la reserva.
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          if (!checked) {
                            form.setValue("porcentaje_adelanto", null, { shouldValidate: true });
                          }
                        }}
                        disabled={watchPrecio == null}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              {watchRequierePago ? (
                <FormField
                  control={form.control}
                  name="porcentaje_adelanto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>% de adelanto</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={100}
                          step={1}
                          placeholder="Ej. 20 (déjalo vacío = 100%)"
                          value={field.value ?? ""}
                          onChange={(e) => {
                            const valor = e.target.value;
                            field.onChange(valor === "" ? null : Number(valor));
                          }}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        {watchPrecio != null
                          ? `${watchPorcentaje ?? 100}% de ${formatearSoles(watchPrecio)} = ${formatearSoles(
                              (watchPrecio * (watchPorcentaje ?? 100)) / 100,
                            )}`
                          : "Define un precio para calcular el adelanto."}
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null}
              <DialogFooter>
                <Button type="submit" disabled={enviando}>
                  {enviando ? "Guardando…" : "Guardar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function TurnosSemanales() {
  const { data: horarios } = useHorarios();
  const crear = useCrearHorario();
  const toggle = useToggleHorario();

  const form = useForm<NuevoHorarioInput>({
    resolver: zodResolver(nuevoHorarioSchema),
    defaultValues: {
      dia_semana: 0,
      hora_inicio: "08:00",
      hora_fin: "13:00",
      duracion_slot_minutos: 30,
    },
  });

  return (
    <section className="rounded-xl border border-border/60 bg-card p-5">
      <header className="mb-4 flex items-center gap-2">
        <Clock className="h-4 w-4 text-primary" />
        <h2 className="font-display text-base font-semibold">Turnos semanales</h2>
      </header>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((values) =>
            crear.mutate(values, { onSuccess: () => form.reset(form.getValues()) }),
          )}
          className="space-y-4"
        >
          <FormField
            control={form.control}
            name="dia_semana"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Día de la semana</FormLabel>
                <Select
                  value={String(field.value)}
                  onValueChange={(v) => field.onChange(Number(v))}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {DIAS_SEMANA.map((dia, index) => (
                      <SelectItem key={dia} value={String(index)}>
                        {dia}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="hora_inicio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Inicio</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="hora_fin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fin</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="duracion_slot_minutos"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slot (min)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={5}
                      step={5}
                      {...field}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Button type="submit" disabled={crear.isPending}>
            {crear.isPending ? "Guardando…" : "Agregar turno"}
          </Button>
        </form>
      </Form>

      <ul className="mt-6 divide-y divide-border/50 border-t border-border/50">
        {horarios.map((h) => (
          <li key={h.id} className="flex items-center justify-between gap-3 py-3 text-sm">
            <div>
              <p className="font-medium">{nombreDiaSemana(h.dia_semana)}</p>
              <p className="text-xs text-muted-foreground">
                {horaCortaTexto(h.hora_inicio)} – {horaCortaTexto(h.hora_fin)} · slots de{" "}
                {h.duracion_slot_minutos} min
              </p>
            </div>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              {h.activo ? "Activo" : "Inactivo"}
              <Switch
                checked={!!h.activo}
                disabled={toggle.isPending}
                onCheckedChange={(activo) => toggle.mutate({ id: h.id, activo })}
                aria-label={`Activar turno de ${nombreDiaSemana(h.dia_semana)}`}
              />
            </label>
          </li>
        ))}
        {horarios.length === 0 ? (
          <li className="py-6 text-center text-sm text-muted-foreground">
            Aún no registras turnos de atención.
          </li>
        ) : null}
      </ul>
    </section>
  );
}

function BloqueosAgenda() {
  const { data: bloqueos } = useBloqueos();
  const crear = useCrearBloqueo();
  const eliminar = useEliminarBloqueo();

  const form = useForm<NuevoBloqueoInput>({
    resolver: zodResolver(nuevoBloqueoSchema),
    defaultValues: { fecha_inicio: "", fecha_fin: "", motivo: "" },
  });

  const ahora = Date.now();
  const futuros = bloqueos.filter((b) => new Date(b.fecha_fin).getTime() >= ahora);

  return (
    <section className="rounded-xl border border-border/60 bg-card p-5">
      <header className="mb-4 flex items-center gap-2">
        <CalendarOff className="h-4 w-4 text-primary" />
        <h2 className="font-display text-base font-semibold">Bloqueos de agenda</h2>
      </header>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((values) =>
            crear.mutate(values, {
              onSuccess: () => form.reset({ fecha_inicio: "", fecha_fin: "", motivo: "" }),
            }),
          )}
          className="space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="fecha_inicio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Desde</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fecha_fin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hasta</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="motivo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Motivo (opcional)</FormLabel>
                <FormControl>
                  <Input placeholder="Ej. Vacaciones, congreso médico" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={crear.isPending}>
            {crear.isPending ? "Guardando…" : "Agregar bloqueo"}
          </Button>
        </form>
      </Form>

      <ul className="mt-6 divide-y divide-border/50 border-t border-border/50">
        {futuros.map((b) => (
          <li key={b.id} className="flex items-center justify-between gap-3 py-3 text-sm">
            <div>
              <p className="font-medium">{b.motivo || "Bloqueado"}</p>
              <p className="text-xs text-muted-foreground">
                {formatoLargo(b.fecha_inicio)} → {formatoLargo(b.fecha_fin)}
              </p>
            </div>
            <ConfirmarEliminar
              title="¿Eliminar bloqueo?"
              description={`Se liberará el rango ${formatoLargo(b.fecha_inicio)} → ${formatoLargo(b.fecha_fin)}.`}
              onConfirm={() => eliminar.mutate({ id: b.id })}
              disabled={eliminar.isPending}
              trigger={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Eliminar bloqueo"
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              }
            />
          </li>
        ))}
        {futuros.length === 0 ? (
          <li className="py-6 text-center text-sm text-muted-foreground">
            No tienes bloqueos futuros registrados.
          </li>
        ) : null}
      </ul>
    </section>
  );
}

function formatoLargo(iso: string) {
  return new Date(iso).toLocaleString("es-PE", { dateStyle: "medium", timeStyle: "short" });
}
