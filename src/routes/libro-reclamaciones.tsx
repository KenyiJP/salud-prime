import { createFileRoute, Link } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { AlertTriangle, CheckCircle2, FileWarning, Loader2, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import {
  TIPOS_RECLAMACION,
  ETIQUETA_TIPO_RECLAMACION,
  reclamacionWebFormSchema,
  type ReclamacionWebFormInput,
} from "@/lib/landing-marca-schemas";
import { useRegistrarReclamacionWeb } from "@/lib/reserva-publica.queries";

export const Route = createFileRoute("/libro-reclamaciones")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): { slug?: string } =>
    typeof search.slug === "string" ? { slug: search.slug } : {},
  head: () => ({
    meta: [
      { title: "Libro de Reclamaciones Virtual — MATEO Salud" },
      {
        name: "description",
        content:
          "Registra tu reclamo o queja conforme a la Ley N° 29571 (Código de Protección y Defensa del Consumidor) y el D.S. 011-2011-PCM.",
      },
    ],
  }),
  component: LibroReclamacionesPage,
});

const VACIO: ReclamacionWebFormInput = {
  tipo: "reclamo",
  consumidor_nombres: "",
  consumidor_apellidos: "",
  consumidor_documento: "",
  consumidor_domicilio: "",
  consumidor_email: "",
  consumidor_telefono: null,
  bien_contratado: "",
  monto_reclamado: null,
  detalle: "",
  pedido_consumidor: "",
};

/**
 * Libro de Reclamaciones Virtual (Día 21B, Indecopi — Ley 29571 /
 * D.S. 011-2011-PCM). Con `?slug=dr-juan-perez` el reclamo se dirige al
 * médico titular de esa landing; sin `slug`, se dirige a MATEO como
 * proveedor del SaaS. Único punto de escritura: `registrar_reclamacion_web`
 * (RPC security definer), llamado vía `useRegistrarReclamacionWeb`.
 */
function LibroReclamacionesPage() {
  const { slug } = Route.useSearch();
  const registrar = useRegistrarReclamacionWeb();

  const form = useForm<ReclamacionWebFormInput>({
    resolver: zodResolver(reclamacionWebFormSchema),
    defaultValues: VACIO,
  });

  function onSubmit(values: ReclamacionWebFormInput) {
    registrar.mutate(
      { ...values, slug: slug ?? null },
      {
        onError: () => {
          form.setError("root", {
            message: "No se pudo registrar tu reclamación. Intenta nuevamente en unos minutos.",
          });
        },
      },
    );
  }

  const resultado = registrar.data;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-6 py-4">
          <Stethoscope className="h-5 w-5 text-primary" />
          <span className="text-sm font-semibold">MATEO Salud</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-6 flex items-center gap-3">
          <FileWarning className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Libro de Reclamaciones Virtual</h1>
        </div>

        <div className="mb-8 space-y-2 rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          <p>
            Conforme al <strong>Código de Protección y Defensa del Consumidor (Ley N° 29571)</strong> y
            al <strong>D.S. N° 011-2011-PCM</strong>, este establecimiento cuenta con un Libro de
            Reclamaciones a disposición del consumidor.
          </p>
          <p>
            {slug
              ? "Este reclamo se dirige al profesional de salud titular de la página web que visitaste."
              : "Este reclamo se dirige a MATEO Salud como proveedor de la plataforma de software."}{" "}
            Recibirás respuesta en un plazo máximo de <strong>15 días hábiles</strong>.
          </p>
        </div>

        {resultado?.ok ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card py-10 text-center">
            <CheckCircle2 className="h-12 w-12 text-primary" />
            <h2 className="text-lg font-semibold">Reclamación registrada</h2>
            <p className="max-w-md text-sm text-muted-foreground">
              Tu código de seguimiento es:
            </p>
            <p className="rounded-md bg-muted px-4 py-2 font-mono text-lg font-bold text-foreground">
              {resultado.codigo}
            </p>
            <p className="max-w-md text-xs text-muted-foreground">
              Guarda este código. Te contactaremos al correo indicado dentro de los 15 días hábiles
              siguientes conforme al plazo legal.
            </p>
            <Link to="/" className="text-sm text-primary underline underline-offset-4">
              Volver al inicio
            </Link>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TIPOS_RECLAMACION.map((tipo) => (
                          <SelectItem key={tipo} value={tipo}>
                            {ETIQUETA_TIPO_RECLAMACION[tipo]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Reclamo: disconformidad con el servicio contratado. Queja: malestar sobre la
                      atención, no relacionado directamente con el servicio.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="consumidor_nombres"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombres</FormLabel>
                      <FormControl>
                        <Input placeholder="Tus nombres" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="consumidor_apellidos"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apellidos</FormLabel>
                      <FormControl>
                        <Input placeholder="Tus apellidos" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="consumidor_documento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>DNI / RUC</FormLabel>
                      <FormControl>
                        <Input placeholder="Documento de identidad" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="consumidor_telefono"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Celular (opcional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="987654321"
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
                name="consumidor_domicilio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Domicilio</FormLabel>
                    <FormControl>
                      <Input placeholder="Dirección completa" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="consumidor_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo electrónico</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="tucorreo@ejemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bien_contratado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bien o servicio contratado</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={
                          slug ? "Ej. Consulta médica del 15/09/2026" : "Ej. Suscripción MATEO Plan Pro"
                        }
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="monto_reclamado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monto reclamado en S/ (opcional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
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
                name="detalle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Detalle del reclamo o queja</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe con el mayor detalle posible lo ocurrido"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pedido_consumidor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pedido del consumidor</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ej. Reembolso, corrección del servicio, respuesta formal..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.formState.errors.root ? (
                <p className="flex items-center gap-2 text-sm text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  {form.formState.errors.root.message}
                </p>
              ) : null}

              {registrar.data && !registrar.data.ok ? (
                <p className="flex items-center gap-2 text-sm text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  {registrar.data.error_mensaje ?? "No se pudo registrar la reclamación."}
                </p>
              ) : null}

              <Button type="submit" disabled={registrar.isPending} className="gap-2">
                {registrar.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Enviar reclamación
              </Button>
            </form>
          </Form>
        )}
      </main>
    </div>
  );
}
