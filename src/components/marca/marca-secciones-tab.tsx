import { useEffect, useState, type ChangeEvent } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, MapPin, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  landingConfigSchema,
  construirUrlGoogleMaps,
  type LandingConfigInput,
  type LandingConfigRow,
} from "@/lib/landing-marca-schemas";
import { useActualizarLandingConfig } from "@/lib/landing-marca.queries";
import { subirImagenLanding, eliminarImagenLanding } from "@/lib/landing-media-upload";

function aFormulario(config: LandingConfigRow): LandingConfigInput {
  const {
    id: _id,
    tenant_id: _tenantId,
    created_at: _createdAt,
    updated_at: _updatedAt,
    ...resto
  } = config;
  return resto;
}

function FilaToggle({
  titulo,
  descripcion,
  checked,
  onCheckedChange,
}: {
  titulo: string;
  descripcion: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border/60 px-4 py-3">
      <div>
        <p className="text-sm font-medium">{titulo}</p>
        <p className="text-xs text-muted-foreground">{descripcion}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

export function MarcaSeccionesTab({
  config,
  tenantId,
  onValoresChange,
}: {
  config: LandingConfigRow;
  tenantId: string;
  onValoresChange?: (valores: LandingConfigInput) => void;
}) {
  const actualizar = useActualizarLandingConfig();
  const [subiendoGaleria, setSubiendoGaleria] = useState(false);
  const form = useForm<LandingConfigInput>({
    resolver: zodResolver(landingConfigSchema),
    defaultValues: aFormulario(config),
  });

  useEffect(() => {
    form.reset(aFormulario(config));
  }, [config, form]);

  function onSubmit(values: LandingConfigInput) {
    actualizar.mutate(values);
  }

  const valores = form.watch();
  const galeria = valores.galeria_fotos_urls ?? [];

  // Refleja cada cambio en la vista previa en vivo, sin esperar a que el
  // médico presione "Guardar secciones y visibilidad".
  useEffect(() => {
    onValoresChange?.(valores);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(valores)]);

  async function agregarFotoGaleria(e: ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    if (!archivo) return;
    if (galeria.length >= 12) {
      toast.error("Máximo 12 fotos en la galería.");
      return;
    }
    setSubiendoGaleria(true);
    try {
      const url = await subirImagenLanding(tenantId, "galeria", archivo);
      form.setValue("galeria_fotos_urls", [...galeria, url], { shouldDirty: true });
      toast.success("Foto agregada a la galería.");
    } catch (err) {
      toast.error((err as Error).message || "No se pudo subir la foto.");
    } finally {
      setSubiendoGaleria(false);
    }
  }

  async function quitarFotoGaleria(url: string) {
    form.setValue(
      "galeria_fotos_urls",
      galeria.filter((u) => u !== url),
      { shouldDirty: true },
    );
    await eliminarImagenLanding(url);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <section className="space-y-4">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Publicación y secciones visibles
          </h3>
          <FormField
            control={form.control}
            name="publicado"
            render={({ field }) => (
              <FilaToggle
                titulo="Landing publicada"
                descripcion="Mientras esté apagado, tu web pública no es visible para nadie."
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="animaciones_activas"
              render={({ field }) => (
                <FilaToggle
                  titulo="Animaciones"
                  descripcion="Transiciones suaves al hacer scroll en la landing."
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <FormField
              control={form.control}
              name="mostrar_boton_reserva"
              render={({ field }) => (
                <FilaToggle
                  titulo="Botón de reserva de cita"
                  descripcion="Muestra el botón que lleva al flujo de agendamiento."
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <FormField
              control={form.control}
              name="mostrar_boton_whatsapp"
              render={({ field }) => (
                <FilaToggle
                  titulo="Botón de WhatsApp"
                  descripcion="Contacto directo por WhatsApp desde la landing."
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="whatsapp_numero"
            render={({ field }) => (
              <FormItem className="max-w-xs">
                <FormLabel>Número de WhatsApp</FormLabel>
                <FormControl>
                  <Input
                    placeholder="+51987654321"
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value || null)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        <section className="space-y-4">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <MapPin className="mr-1 inline h-4 w-4" />
            Ubicación del consultorio
          </h3>
          <FormField
            control={form.control}
            name="mapa_direccion"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dirección</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Av. España 123, Trujillo"
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value || null)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <p className="text-xs text-muted-foreground">
            Con solo escribir la dirección, tus pacientes podrán abrirla directamente en Google
            Maps (web o app) desde tu landing — no necesitas indicar coordenadas.
          </p>
          {valores.mapa_direccion ? (
            <a
              href={construirUrlGoogleMaps(valores.mapa_direccion)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <MapPin className="h-3.5 w-3.5" /> Probar enlace en Google Maps
            </a>
          ) : null}
        </section>

        <section className="space-y-4">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Galería de fotos ({galeria.length}/12)
          </h3>
          <div className="flex flex-wrap gap-3">
            {galeria.map((url) => (
              <div
                key={url}
                className="group relative h-24 w-24 overflow-hidden rounded-lg border border-border/60"
              >
                <img src={url} alt="Foto de galería" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => quitarFotoGaleria(url)}
                  className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="Quitar foto"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {galeria.length < 12 ? (
              <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border/70 text-muted-foreground hover:bg-accent">
                {subiendoGaleria ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Upload className="h-5 w-5" />
                )}
                <span className="text-[11px]">Agregar</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  disabled={subiendoGaleria}
                  onChange={agregarFotoGaleria}
                />
              </label>
            ) : null}
          </div>
        </section>

        <div className="flex justify-end border-t border-border/60 pt-6">
          <Button type="submit" disabled={actualizar.isPending || !form.formState.isDirty}>
            {actualizar.isPending ? "Guardando…" : "Guardar secciones y visibilidad"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
