import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Pill, Printer, ShieldCheck, Trash2, X } from "lucide-react";
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
import { BuscadorMedicamentos } from "@/components/buscador-medicamentos";
import { HistorialRecetas } from "@/components/historial-recetas";
import { nombrePaciente, pacientesQuery } from "@/lib/pacientes.queries";
import { useCrearReceta } from "@/lib/recetas.queries";
import {
  VIAS_ADMINISTRACION,
  medicamentoVacio,
  type MedicamentoSeleccionado,
} from "@/lib/recetas-schemas";
import type { MedicamentoVademecum } from "@/lib/recetas-schemas";

export const Route = createFileRoute("/recetario")({
  beforeLoad: () => requireSession(),
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    paciente: typeof search.paciente === "string" ? search.paciente : undefined,
    atencion: typeof search.atencion === "string" ? search.atencion : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Recetario Inteligente — MediSuite" },
      {
        name: "description",
        content:
          "Emite recetas digitales con buscador de DCI sobre el Vademécum e imprímelas con membrete y QR.",
      },
      { property: "og:title", content: "Recetario Inteligente — MediSuite" },
      {
        property: "og:description",
        content: "Recetario para consultorios independientes en Perú, con Vademécum SISMED.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(pacientesQuery());
  },
  component: RecetarioPage,
  errorComponent: ({ error }) => (
    <DashboardShell>
      <div role="alert" className="rounded-xl border border-destructive/40 bg-card p-6 text-sm">
        No se pudo cargar el recetario: {error.message}
      </div>
    </DashboardShell>
  ),
  notFoundComponent: () => (
    <DashboardShell>
      <p className="text-sm text-muted-foreground">Sin información disponible.</p>
    </DashboardShell>
  ),
});

function RecetarioPage() {
  const { paciente: pacienteInicial, atencion } = Route.useSearch();
  const { data: pacientes } = useSuspenseQuery(pacientesQuery());
  const [pacienteId, setPacienteId] = useState<string>(pacienteInicial ?? "");
  const [medicamentos, setMedicamentos] = useState<MedicamentoSeleccionado[]>([]);
  const [diagnostico, setDiagnostico] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [vigenciaDias, setVigenciaDias] = useState("30");
  const [descripcionLibre, setDescripcionLibre] = useState("");
  const crear = useCrearReceta();

  const puedeGuardar = !!pacienteId && medicamentos.length > 0 && !crear.isPending;

  function agregarDelVademecum(medicamento: MedicamentoVademecum) {
    setMedicamentos((prev) => [
      ...prev,
      {
        ...medicamentoVacio(),
        medicamento_id: medicamento.id,
        nombre_display: medicamento.nombre,
        via_administracion_id: medicamento.via_administracion_id,
      },
    ]);
  }

  function agregarLibre() {
    const texto = descripcionLibre.trim();
    if (!texto) return;
    setMedicamentos((prev) => [
      ...prev,
      { ...medicamentoVacio(), descripcion_libre: texto, nombre_display: texto },
    ]);
    setDescripcionLibre("");
  }

  function actualizarMedicamento(i: number, cambios: Partial<MedicamentoSeleccionado>) {
    setMedicamentos((prev) => prev.map((m, idx) => (idx === i ? { ...m, ...cambios } : m)));
  }

  function quitarMedicamento(i: number) {
    setMedicamentos((prev) => prev.filter((_, idx) => idx !== i));
  }

  function guardar() {
    if (!puedeGuardar) return;
    crear.mutate(
      {
        paciente_id: pacienteId,
        atencion_id: atencion ?? null,
        diagnostico_presuntivo: diagnostico,
        observaciones,
        vigencia_dias: Number(vigenciaDias) || 30,
        medicamentos: medicamentos.map((m) => ({
          medicamento_id: m.medicamento_id,
          descripcion_libre: m.descripcion_libre || undefined,
          dosis: m.dosis,
          via_administracion_id: m.via_administracion_id,
          frecuencia: m.frecuencia,
          duracion: m.duracion,
          cantidad: m.cantidad,
          indicaciones: m.indicaciones,
        })),
      },
      {
        onSuccess: () => {
          setMedicamentos([]);
          setDiagnostico("");
          setObservaciones("");
          setVigenciaDias("30");
        },
      },
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Prescripción"
          title="Recetario Inteligente"
          description="Busca por DCI en el Vademécum, arma la receta y emítela con membrete, CMP/RNE y QR de verificación."
        />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="space-y-5 rounded-xl border border-border/60 bg-card p-5">
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
              <Label>Buscar medicamento (DCI)</Label>
              <BuscadorMedicamentos onAgregar={agregarDelVademecum} />
              <p className="text-xs text-muted-foreground">
                Flechas para elegir, Enter para agregar. Fórmulas magistrales: usa el campo de
                abajo.
              </p>
            </div>

            <div className="flex gap-2">
              <Input
                value={descripcionLibre}
                onChange={(e) => setDescripcionLibre(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    agregarLibre();
                  }
                }}
                placeholder="Fórmula magistral o medicamento fuera del Vademécum…"
                className="h-10"
              />
              <Button type="button" variant="outline" onClick={agregarLibre}>
                Agregar
              </Button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-sm font-semibold">Medicamentos prescritos</h2>
                <span className="text-xs text-muted-foreground">
                  {medicamentos.length} en la receta
                </span>
              </div>

              {medicamentos.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border/70 px-4 py-6 text-center text-sm text-muted-foreground">
                  Aún no agregaste medicamentos.
                </p>
              ) : (
                <ol className="space-y-3">
                  {medicamentos.map((m, i) => (
                    <li
                      key={i}
                      className="space-y-3 rounded-lg border border-border/60 px-3 py-3 text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 shrink-0 text-xs text-muted-foreground">
                          {i + 1}.
                        </span>
                        <span className="min-w-0 flex-1 truncate font-medium">
                          {m.nombre_display}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Quitar ${m.nombre_display}`}
                          onClick={() => quitarMedicamento(i)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        <Input
                          placeholder="Dosis (ej. 500 mg)"
                          value={m.dosis}
                          onChange={(e) => actualizarMedicamento(i, { dosis: e.target.value })}
                        />
                        <Select
                          value={m.via_administracion_id ? String(m.via_administracion_id) : ""}
                          onValueChange={(v) =>
                            actualizarMedicamento(i, { via_administracion_id: Number(v) })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Vía" />
                          </SelectTrigger>
                          <SelectContent>
                            {VIAS_ADMINISTRACION.map((v) => (
                              <SelectItem key={v.id} value={String(v.id)}>
                                {v.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          placeholder="Frecuencia (ej. cada 8 horas)"
                          value={m.frecuencia}
                          onChange={(e) =>
                            actualizarMedicamento(i, { frecuencia: e.target.value })
                          }
                        />
                        <Input
                          placeholder="Duración (ej. 7 días)"
                          value={m.duracion}
                          onChange={(e) => actualizarMedicamento(i, { duracion: e.target.value })}
                        />
                        <Input
                          placeholder="Cantidad (ej. 21 tabletas)"
                          value={m.cantidad}
                          onChange={(e) => actualizarMedicamento(i, { cantidad: e.target.value })}
                        />
                        <Input
                          placeholder="Indicaciones específicas"
                          value={m.indicaciones}
                          onChange={(e) =>
                            actualizarMedicamento(i, { indicaciones: e.target.value })
                          }
                        />
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="diagnostico">Diagnóstico presuntivo (opcional)</Label>
                <Textarea
                  id="diagnostico"
                  rows={3}
                  value={diagnostico}
                  onChange={(e) => setDiagnostico(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="observaciones">Observaciones (opcional)</Label>
                <Textarea
                  id="observaciones"
                  rows={3}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vigencia">Vigencia (días)</Label>
                <Input
                  id="vigencia"
                  type="number"
                  min={1}
                  max={365}
                  value={vigenciaDias}
                  onChange={(e) => setVigenciaDias(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button className="gap-2" disabled={!puedeGuardar} onClick={guardar}>
                <Pill className="h-4 w-4" />
                {crear.isPending ? "Emitiendo…" : "Emitir receta"}
              </Button>
              {medicamentos.length > 0 ? (
                <Button
                  variant="ghost"
                  className="gap-2 text-muted-foreground"
                  onClick={() => setMedicamentos([])}
                >
                  <Trash2 className="h-4 w-4" /> Vaciar lista
                </Button>
              ) : null}
            </div>
          </section>

          <aside className="space-y-3 rounded-xl border border-border/60 bg-card/60 p-5">
            <h2 className="font-display text-sm font-semibold">Cómo usarlo en consulta</h2>
            <p className="text-sm text-muted-foreground">
              Escribe el DCI (nombre genérico) tal como lo dices en voz alta. Presiona Enter y
              sigue con el siguiente sin soltar el teclado.
            </p>
            <p className="text-sm text-muted-foreground">
              Al emitir, la receta queda en el historial del paciente lista para imprimir en A4
              con tu membrete, CMP/RNE y QR de verificación.
            </p>
            <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-background/50 px-3 py-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
              Cumple los requisitos formales DIGEMID/MINSA: DCI, CMP, RNE, fecha y vigencia.
            </div>
            <Button asChild variant="outline" className="w-full gap-2">
              <Link to="/fichas">
                <Printer className="h-4 w-4" /> Ir a fichas clínicas
              </Link>
            </Button>
          </aside>
        </div>

        {pacienteId ? <HistorialRecetas pacienteId={pacienteId} /> : null}
      </div>
    </DashboardShell>
  );
}
