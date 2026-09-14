import { useEffect, useState, type ChangeEvent } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Image as ImageIcon, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  ETIQUETA_TIPOGRAFIA,
  TIPOGRAFIAS_PERMITIDAS,
  landingConfigSchema,
  type LandingConfigInput,
  type LandingConfigRow,
} from "@/lib/landing-marca-schemas";
import { useActualizarLandingConfig } from "@/lib/landing-marca.queries";
import { subirImagenLanding } from "@/lib/landing-media-upload";
import { toast } from "sonner";

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

/** Selector de color: swatch nativo + input de texto hex, ambos sincronizados. */
function CampoColor({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const esHexValido = /^#[0-9a-fA-F]{6}$/.test(value);
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={esHexValido ? value : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 shrink-0 cursor-pointer rounded-md border border-input bg-transparent p-1"
          aria-label={`Selector de ${label.toLowerCase()}`}
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#0f766e"
          className="font-mono uppercase"
        />
      </div>
      {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
    </div>
  );
}

function CampoImagen({
  label,
  hint,
  url,
  tenantId,
  carpeta,
  onUploaded,
}: {
  label: string;
  hint: string;
  url: string | null;
  tenantId: string;
  carpeta: "identidad" | "portada" | "galeria";
  onUploaded: (url: string) => void;
}) {
  const [subiendo, setSubiendo] = useState(false);

  async function onArchivo(e: ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    if (!archivo) return;
    setSubiendo(true);
    try {
      const publicUrl = await subirImagenLanding(tenantId, carpeta, archivo);
      onUploaded(publicUrl);
      toast.success("Imagen subida.");
    } catch (err) {
      toast.error((err as Error).message || "No se pudo subir la imagen.");
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-4">
        <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-lg border border-border/60 bg-background">
          {url ? (
            <img src={url} alt={label} className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
        <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border/70 bg-background px-3 py-2 text-sm hover:bg-accent">
          {subiendo ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {subiendo ? "Subiendo…" : "Subir imagen"}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            disabled={subiendo}
            onChange={onArchivo}
          />
        </label>
      </div>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

export function MarcaIdentidadTab({
  config,
  tenantId,
}: {
  config: LandingConfigRow;
  tenantId: string;
}) {
  const actualizar = useActualizarLandingConfig();
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <section className="space-y-4">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Paleta de colores
          </h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="color_primario"
              render={({ field, fieldState }) => (
                <CampoColor
                  label="Color primario"
                  value={field.value}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                />
              )}
            />
            <FormField
              control={form.control}
              name="color_secundario"
              render={({ field, fieldState }) => (
                <CampoColor
                  label="Color secundario"
                  value={field.value}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                />
              )}
            />
            <FormField
              control={form.control}
              name="color_fondo"
              render={({ field, fieldState }) => (
                <CampoColor
                  label="Color de fondo"
                  value={field.value}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                />
              )}
            />
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Tipografía
          </h3>
          <FormField
            control={form.control}
            name="tipografia"
            render={({ field }) => (
              <FormItem className="max-w-xs">
                <FormLabel>Fuente de la landing</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TIPOGRAFIAS_PERMITIDAS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {ETIQUETA_TIPOGRAFIA[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        <section className="space-y-4">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Imágenes
          </h3>
          <div className="grid gap-6 sm:grid-cols-2">
            <CampoImagen
              label="Logo del consultorio"
              hint="PNG o SVG con fondo transparente, ideal 400×400px."
              url={valores.logo_url}
              tenantId={tenantId}
              carpeta="identidad"
              onUploaded={(url) => form.setValue("logo_url", url, { shouldDirty: true })}
            />
            <CampoImagen
              label="Foto del médico"
              hint="Foto de perfil profesional, formato cuadrado recomendado."
              url={valores.foto_medico_url}
              tenantId={tenantId}
              carpeta="identidad"
              onUploaded={(url) => form.setValue("foto_medico_url", url, { shouldDirty: true })}
            />
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Biografía y formación
          </h3>
          <FormField
            control={form.control}
            name="biografia"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Biografía corta</FormLabel>
                <FormControl>
                  <Textarea
                    rows={4}
                    placeholder="Cuéntales a tus pacientes quién eres y cómo los ayudas…"
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value || null)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="formacion_academica"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Formación académica</FormLabel>
                <FormControl>
                  <Textarea
                    rows={4}
                    placeholder="Universidad, especialidad, maestrías, certificaciones…"
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
            Colegiatura y video
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="mostrar_cmp"
              render={({ field }) => (
                <div className="flex items-center justify-between rounded-lg border border-border/60 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">Mostrar CMP</p>
                    <p className="text-xs text-muted-foreground">
                      Número de Colegio Médico del Perú.
                    </p>
                  </div>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </div>
              )}
            />
            <FormField
              control={form.control}
              name="mostrar_rne"
              render={({ field }) => (
                <div className="flex items-center justify-between rounded-lg border border-border/60 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">Mostrar RNE</p>
                    <p className="text-xs text-muted-foreground">
                      Registro Nacional de Especialistas.
                    </p>
                  </div>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </div>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="video_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Video promocional (URL)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://youtube.com/watch?v=…"
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value || null)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        <div className="flex justify-end border-t border-border/60 pt-6">
          <Button type="submit" disabled={actualizar.isPending || !form.formState.isDirty}>
            {actualizar.isPending ? "Guardando…" : "Guardar identidad de marca"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
