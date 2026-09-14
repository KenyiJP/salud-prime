import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
import { ConfirmarEliminar } from "@/components/confirmar-eliminar";
import {
  landingServicioSchema,
  type LandingServicioInput,
  type LandingServicioRow,
} from "@/lib/landing-marca-schemas";
import {
  useCrearLandingServicio,
  useActualizarLandingServicio,
  useEliminarLandingServicio,
  useLandingServiciosQuery,
  useReordenarLandingServicios,
} from "@/lib/landing-marca.queries";

const VALORES_VACIOS: LandingServicioInput = {
  nombre: "",
  descripcion: null,
  precio: null,
  duracion_minutos: null,
  activo: true,
};

function ServicioFormDialog({
  open,
  onOpenChange,
  servicio,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  servicio: LandingServicioRow | null;
}) {
  const crear = useCrearLandingServicio();
  const actualizar = useActualizarLandingServicio();
  const form = useForm<LandingServicioInput>({
    resolver: zodResolver(landingServicioSchema),
    defaultValues: VALORES_VACIOS,
  });
  const [mostrarDuracion, setMostrarDuracion] = useState(false);

  useEffect(() => {
    if (open) {
      const valores = servicio ? { ...servicio } : VALORES_VACIOS;
      form.reset(valores);
      setMostrarDuracion(valores.duracion_minutos != null);
    }
  }, [open, servicio, form]);

  async function onSubmit(values: LandingServicioInput) {
    if (servicio) {
      await actualizar.mutateAsync({ id: servicio.id, cambios: values });
    } else {
      await crear.mutateAsync(values);
    }
    onOpenChange(false);
  }

  const enviando = crear.isPending || actualizar.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{servicio ? "Editar servicio" : "Nuevo servicio"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del servicio</FormLabel>
                  <FormControl>
                    <Input placeholder="Consulta de medicina interna" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="precio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio (S/)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="120.00"
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(e.target.value === "" ? null : Number(e.target.value))
                        }
                      />
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
                    <FormLabel>Duración de la consulta</FormLabel>
                    <div className="flex items-center gap-2 pb-1.5">
                      <Switch
                        checked={mostrarDuracion}
                        onCheckedChange={(checked) => {
                          setMostrarDuracion(checked);
                          if (!checked) field.onChange(null);
                        }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {mostrarDuracion ? "Se mostrará al público" : "No se mostrará"}
                      </span>
                    </div>
                    {mostrarDuracion ? (
                      <FormControl>
                        <Input
                          type="number"
                          step="1"
                          min="1"
                          placeholder="30 min"
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(e.target.value === "" ? null : Number(e.target.value))
                          }
                        />
                      </FormControl>
                    ) : null}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="activo"
              render={({ field }) => (
                <div className="flex items-center justify-between rounded-lg border border-border/60 px-4 py-3">
                  <p className="text-sm font-medium">Visible en la landing</p>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </div>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={enviando}>
                {enviando ? "Guardando…" : servicio ? "Guardar cambios" : "Crear servicio"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function MarcaServiciosTab() {
  const { data: servicios, isLoading } = useLandingServiciosQuery();
  const eliminar = useEliminarLandingServicio();
  const reordenar = useReordenarLandingServicios();
  const [dialogAbierto, setDialogAbierto] = useState(false);
  const [servicioEditando, setServicioEditando] = useState<LandingServicioRow | null>(null);

  const lista = servicios ?? [];

  function abrirNuevo() {
    setServicioEditando(null);
    setDialogAbierto(true);
  }

  function abrirEditar(servicio: LandingServicioRow) {
    setServicioEditando(servicio);
    setDialogAbierto(true);
  }

  function mover(index: number, direccion: -1 | 1) {
    const destino = index + direccion;
    if (destino < 0 || destino >= lista.length) return;
    const copia = [...lista];
    [copia[index], copia[destino]] = [copia[destino], copia[index]];
    reordenar.mutate(copia.map((s) => s.id));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Servicios de la landing
          </h3>
          <p className="text-sm text-muted-foreground">
            Se muestran en el orden definido aquí. Solo los activos aparecen al público.
          </p>
        </div>
        <Button size="sm" className="gap-2" onClick={abrirNuevo}>
          <Plus className="h-4 w-4" /> Nuevo servicio
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando servicios…</p>
      ) : lista.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/70 px-4 py-6 text-center text-sm text-muted-foreground">
          Todavía no agregaste servicios a tu landing.
        </p>
      ) : (
        <ul className="space-y-2">
          {lista.map((servicio, index) => (
            <li
              key={servicio.id}
              className="flex items-center gap-3 rounded-lg border border-border/60 bg-card p-3"
            >
              <div className="flex flex-col">
                <button
                  type="button"
                  className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                  disabled={index === 0 || reordenar.isPending}
                  onClick={() => mover(index, -1)}
                  aria-label="Subir"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                  disabled={index === lista.length - 1 || reordenar.isPending}
                  onClick={() => mover(index, 1)}
                  aria-label="Bajar"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium">{servicio.nombre}</p>
                  {!servicio.activo ? (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      Oculto
                    </Badge>
                  ) : null}
                </div>
                {servicio.descripcion ? (
                  <p className="truncate text-xs text-muted-foreground">
                    {servicio.descripcion}
                  </p>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  {servicio.precio != null ? `S/ ${servicio.precio.toFixed(2)}` : "Sin precio"}
                  {servicio.duracion_minutos != null
                    ? ` · ${servicio.duracion_minutos} min`
                    : ""}
                </p>
              </div>

              <Button size="icon" variant="ghost" onClick={() => abrirEditar(servicio)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <ConfirmarEliminar
                title="¿Eliminar este servicio?"
                description={`"${servicio.nombre}" dejará de mostrarse en tu landing.`}
                onConfirm={() => eliminar.mutate(servicio.id)}
                disabled={eliminar.isPending}
                trigger={
                  <Button size="icon" variant="ghost" className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                }
              />
            </li>
          ))}
        </ul>
      )}

      <ServicioFormDialog
        open={dialogAbierto}
        onOpenChange={setDialogAbierto}
        servicio={servicioEditando}
      />
    </div>
  );
}
