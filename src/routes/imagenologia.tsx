import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Scan, Trash2, X } from "lucide-react";
import { requireSession } from "@/lib/auth-guard";
import { DashboardShell } from "@/components/dashboard-shell";
import { PageHeader } from "@/components/page-primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BuscadorEstudios } from "@/components/buscador-estudios";
import { HistorialOrdenesImagen } from "@/components/historial-ordenes-imagen";
import { nombrePaciente, pacientesQuery } from "@/lib/pacientes.queries";
import { useCrearOrdenImagen } from "@/lib/imagenologia.queries";
import {
  etiquetaModalidad,
  type EstudioSeleccionado,
} from "@/lib/imagenologia-schemas";

export const Route = createFileRoute("/imagenologia")({
  beforeLoad: () => requireSession(),
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    paciente: typeof search.paciente === "string" ? search.paciente : undefined,
    atencion: typeof search.atencion === "string" ? search.atencion : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Imagenología — MediSuite" },
      {
        name: "description",
        content:
          "Crea órdenes de imágenes por modalidad, con pregunta clínica al radiólogo, preparación e impresión A4 con QR.",
      },
      { property: "og:title", content: "Imagenología — MediSuite" },
      {
        property: "og:description",
        content:
          "Órdenes de radiografía, ecografía, TAC y RMN con búsqueda inteligente para consultorios en Perú.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(pacientesQuery());
  },
  component: ImagenologiaPage,
  errorComponent: ({ error }: { error: unknown }) => (
    <DashboardShell>
      <div role="alert" className="rounded-xl border border-destructive/40 bg-card p-6 text-sm">
        No se pudo cargar el módulo de imagenología: {error instanceof Error ? error.message : String(error)}
      </div>
    </DashboardShell>
  ),
  notFoundComponent: () => (
    <DashboardShell>
      <p className="text-sm text-muted-foreground">Sin información disponible.</p>
    </DashboardShell>
  ),
});

function ImagenologiaPage() {
  const { paciente: pacienteInicial, atencion } = Route.useSearch();
  const { data: pacientes } = useSuspenseQuery(pacientesQuery());
  const [pacienteId, setPacienteId] = useState(pacienteInicial ?? "");
  const [indicacion, setIndicacion] = useState("");
  const [diagnostico, setDiagnostico] = useState("");
  const [estudios, setEstudios] = useState<EstudioSeleccionado[]>([]);
  const crear = useCrearOrdenImagen();

  const ids = useMemo(() => estudios.map((e) => e.id), [estudios]);
  const indicacionOk = indicacion.trim().length >= 5;
  const puedeGuardar =
    !!pacienteId && indicacionOk && estudios.length > 0 && !crear.isPending;

  function guardar() {
    if (!puedeGuardar) return;
    crear.mutate(
      {
        paciente_id: pacienteId,
        atencion_id: atencion ?? null,
        indicacion_clinica: indicacion.trim(),
        diagnostico_presuntivo: diagnostico,
        observaciones: "",
        estudios: estudios.map((e) => ({ estudio_id: e.id, nota: e.nota })),
      },
      {
        onSuccess: (res) => {
          setEstudios([]);
          setIndicacion("");
          setDiagnostico("");
          window.open(`/orden-imagen/${res.id}`, "_blank", "noopener");
        },
      },
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Órdenes clínicas"
          title="Imagenología"
          description="Define la pregunta clínica, elige los estudios por modalidad o por nombre, e imprime la orden con QR."
        />

        <section className="space-y-5 rounded-xl border border-border/60 bg-card p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Paciente</Label>
              <Select value={pacienteId} onValueChange={setPacienteId}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Selecciona un paciente" />
                </SelectTrigger>
                <SelectContent>
                  {pacientes.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {nombrePaciente(p)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {pacientes.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Registra primero un paciente en Fichas Clínicas.
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="diagnostico">Diagnóstico presuntivo (opcional)</Label>
              <Input
                id="diagnostico"
                value={diagnostico}
                onChange={(e) => setDiagnostico(e.target.value)}
                placeholder="Ej. Neumonía adquirida en la comunidad"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="indicacion">Pregunta al radiólogo *</Label>
            <Textarea
              id="indicacion"
              rows={3}
              value={indicacion}
              onChange={(e) => setIndicacion(e.target.value)}
              placeholder="¿Qué necesitas que el radiólogo responda? Ej. Descartar consolidación en base derecha en paciente con tos y fiebre de 5 días."
            />
            {!indicacionOk ? (
              <p className="text-xs text-muted-foreground">
                Obligatorio: es la indicación clínica de toda la orden.
              </p>
            ) : null}
          </div>
        </section>

        <section className="space-y-5 rounded-xl border border-border/60 bg-card p-5">
          <h2 className="font-display text-sm font-semibold">Estudios a solicitar</h2>
          <BuscadorEstudios
            yaAgregados={ids}
            onAgregar={(estudio) =>
              setEstudios((prev) => [...prev, { ...estudio, nota: "" }])
            }
          />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold">
                Estudios en la orden
              </h3>
              <span className="text-xs text-muted-foreground">
                {estudios.length} agregados
              </span>
            </div>

            {estudios.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border/70 px-4 py-6 text-center text-sm text-muted-foreground">
                Aún no agregaste estudios.
              </p>
            ) : (
              <ol className="space-y-3">
                {estudios.map((e, i) => (
                  <li
                    key={e.id}
                    className="space-y-2 rounded-lg border border-border/60 p-3"
                  >
                    <div className="flex items-start gap-3">
                      <span className="w-5 shrink-0 text-xs text-muted-foreground">
                        {i + 1}.
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm">{e.nombre_display}</p>
                        <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                          <span className="rounded bg-muted px-1.5 py-0.5">
                            {etiquetaModalidad(e.modalidad)}
                          </span>
                          {e.region ? <span>{e.region}</span> : null}
                          {e.requiere_contraste ? (
                            <span className="rounded bg-primary/15 px-1.5 py-0.5 text-primary">
                              Con contraste
                            </span>
                          ) : null}
                          {e.requiere_preparacion ? (
                            <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-amber-500">
                              Requiere preparación
                            </span>
                          ) : null}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Quitar ${e.nombre_display}`}
                        onClick={() =>
                          setEstudios((prev) => prev.filter((x) => x.id !== e.id))
                        }
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    {e.requiere_preparacion && e.instrucciones_preparacion ? (
                      <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                        <span className="font-semibold">Preparación: </span>
                        {e.instrucciones_preparacion}
                      </p>
                    ) : null}

                    <Input
                      value={e.nota}
                      onChange={(ev) =>
                        setEstudios((prev) =>
                          prev.map((x) =>
                            x.id === e.id ? { ...x, nota: ev.target.value } : x,
                          ),
                        )
                      }
                      placeholder="Nota para este estudio (opcional): proyección adicional, lado, etc."
                      aria-label={`Nota para ${e.nombre_display}`}
                      className="h-9 text-sm"
                    />
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button className="gap-2" disabled={!puedeGuardar} onClick={guardar}>
              <Scan className="h-4 w-4" />
              {crear.isPending ? "Guardando…" : "Guardar e imprimir orden"}
            </Button>
            {estudios.length > 0 ? (
              <Button
                variant="ghost"
                className="gap-2 text-muted-foreground"
                onClick={() => setEstudios([])}
              >
                <Trash2 className="h-4 w-4" /> Vaciar lista
              </Button>
            ) : null}
          </div>
        </section>

        {pacienteId ? <HistorialOrdenesImagen pacienteId={pacienteId} /> : null}
      </div>
    </DashboardShell>
  );
}
