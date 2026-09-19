import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ArrowDown, ArrowUp, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  ETIQUETA_ORIGEN_TESTIMONIO,
  ORIGENES_TESTIMONIO,
  landingTestimonioSchema,
  type LandingTestimonioInput,
  type LandingTestimonioRow,
} from "@/lib/landing-marca-schemas";
import {
  useCrearLandingTestimonio,
  useActualizarLandingTestimonio,
  useEliminarLandingTestimonio,
  useLandingTestimoniosQuery,
  useReordenarLandingTestimonios,
} from "@/lib/landing-marca.queries";

const VALORES_VACIOS: LandingTestimonioInput = {
  nombre_paciente: "",
  contenido: "",
  calificacion: 5,
  origen: "manual",
  aprobado: false,
};

function Estrellas({ valor }: { valor: number | null }) {
  if (valor == null) return <span className="text-xs text-muted-foreground">Sin calificar</span>;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < valor ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`}
        />
      ))}
    </div>
  );
}

function TestimonioFormDialog({
  open,
  onOpenChange,
  testimonio,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  testimonio: LandingTestimonioRow | null;
}) {
  const crear = useCrearLandingTestimonio();
  const actualizar = useActualizarLandingTestimonio();
  const form = useForm<LandingTestimonioInput>({
    resolver: zodResolver(landingTestimonioSchema),
    defaultValues: VALORES_VACIOS,
  });

  useEffect(() => {
    if (open) {
      form.reset(testimonio ? { ...testimonio } : VALORES_VACIOS);
    }
  }, [open, testimonio, form]);

  async function onSubmit(values: LandingTestimonioInput) {
    if (testimonio) {
      await actualizar.mutateAsync({ id: testimonio.id, cambios: values });
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
          <DialogTitle>{testimonio ? "Editar testimonio" : "Nuevo testimonio"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nombre_paciente"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del paciente</FormLabel>
                  <FormControl>
                    <Input placeholder="María Gonzáles" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contenido"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Testimonio</FormLabel>
                  <FormControl>
                    <Textarea rows={4} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="calificacion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Calificación</FormLabel>
                    <Select
                      value={String(field.value ?? "")}
                      onValueChange={(v) => field.onChange(v === "" ? null : Number(v))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sin calificar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            {n} {n === 1 ? "estrella" : "estrellas"}
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
                name="origen"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Origen</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ORIGENES_TESTIMONIO.map((o) => (
                          <SelectItem key={o} value={o}>
                            {ETIQUETA_ORIGEN_TESTIMONIO[o]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="aprobado"
              render={({ field }) => (
                <div className="flex items-center justify-between rounded-lg border border-border/60 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">Aprobado</p>
                    <p className="text-xs text-muted-foreground">
                      Solo los testimonios aprobados aparecen en la landing publicada.
                    </p>
                  </div>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </div>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={enviando}>
                {enviando ? "Guardando…" : testimonio ? "Guardar cambios" : "Crear testimonio"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function MarcaTestimoniosTab() {
  const { data: testimonios, isLoading } = useLandingTestimoniosQuery();
  const eliminar = useEliminarLandingTestimonio();
  const actualizar = useActualizarLandingTestimonio();
  const reordenar = useReordenarLandingTestimonios();
  const [dialogAbierto, setDialogAbierto] = useState(false);
  const [testimonioEditando, setTestimonioEditando] = useState<LandingTestimonioRow | null>(null);

  const lista = testimonios ?? [];

  function abrirNuevo() {
    setTestimonioEditando(null);
    setDialogAbierto(true);
  }

  function abrirEditar(testimonio: LandingTestimonioRow) {
    setTestimonioEditando(testimonio);
    setDialogAbierto(true);
  }

  function mover(index: number, direccion: -1 | 1) {
    const destino = index + direccion;
    if (destino < 0 || destino >= lista.length) return;
    const copia = [...lista];
    [copia[index], copia[destino]] = [copia[destino], copia[index]];
    reordenar.mutate(copia.map((t) => t.id));
  }

  function alternarAprobado(testimonio: LandingTestimonioRow) {
    actualizar.mutate({ id: testimonio.id, cambios: { aprobado: !testimonio.aprobado } });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Testimonios de pacientes
          </h3>
          <p className="text-sm text-muted-foreground">
            Modera cada testimonio: solo los aprobados se publican en tu landing.
          </p>
        </div>
        <Button size="sm" className="gap-2" onClick={abrirNuevo}>
          <Plus className="h-4 w-4" /> Nuevo testimonio
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando testimonios…</p>
      ) : lista.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/70 px-4 py-6 text-center text-sm text-muted-foreground">
          Todavía no hay testimonios cargados.
        </p>
      ) : (
        <ul className="space-y-2">
          {lista.map((testimonio, index) => (
            <li
              key={testimonio.id}
              className="flex items-start gap-3 rounded-lg border border-border/60 bg-card p-3"
            >
              <div className="flex flex-col pt-0.5">
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

              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">{testimonio.nombre_paciente}</p>
                  <Estrellas valor={testimonio.calificacion} />
                  <Badge variant="secondary" className="text-xs">
                    {ETIQUETA_ORIGEN_TESTIMONIO[testimonio.origen]}
                  </Badge>
                  <Badge
                    variant={testimonio.aprobado ? "default" : "outline"}
                    className={
                      testimonio.aprobado
                        ? "text-xs"
                        : "text-xs border-amber-500/40 bg-amber-500/10 text-amber-600"
                    }
                  >
                    {testimonio.aprobado ? "Aprobado" : "Pendiente"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{testimonio.contenido}</p>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <Button
                  size="sm"
                  variant={testimonio.aprobado ? "outline" : "default"}
                  onClick={() => alternarAprobado(testimonio)}
                  disabled={actualizar.isPending}
                >
                  {testimonio.aprobado ? "Quitar aprobación" : "Aprobar"}
                </Button>
                <Button size="icon" variant="ghost" onClick={() => abrirEditar(testimonio)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <ConfirmarEliminar
                  title="¿Eliminar este testimonio?"
                  description={`El testimonio de "${testimonio.nombre_paciente}" se eliminará permanentemente.`}
                  onConfirm={() => eliminar.mutate(testimonio.id)}
                  disabled={eliminar.isPending}
                  trigger={
                    <Button size="icon" variant="ghost" className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  }
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      <TestimonioFormDialog
        open={dialogAbierto}
        onOpenChange={setDialogAbierto}
        testimonio={testimonioEditando}
      />
    </div>
  );
}
