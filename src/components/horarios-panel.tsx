import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CalendarOff, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmarEliminar } from "@/components/confirmar-eliminar";
import {
  DIAS_SEMANA,
  horaCortaTexto,
  nombreDiaSemana,
  nuevoBloqueoSchema,
  nuevoHorarioSchema,
  type NuevoBloqueoInput,
  type NuevoHorarioInput,
} from "@/lib/agenda-schemas";
import {
  useBloqueos,
  useCrearBloqueo,
  useCrearHorario,
  useEliminarBloqueo,
  useHorarios,
  useToggleHorario,
} from "@/lib/agenda.queries";

export function HorariosPanel() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <TurnosSemanales />
      <BloqueosAgenda />
    </div>
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
