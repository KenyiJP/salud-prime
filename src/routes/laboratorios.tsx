import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { FlaskConical, Printer, Trash2, X } from "lucide-react";
import { requireSession } from "@/lib/auth-guard";
import { DashboardShell } from "@/components/dashboard-shell";
import { PageHeader } from "@/components/page-primitives";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BuscadorExamenes } from "@/components/buscador-examenes";
import { HistorialOrdenes } from "@/components/historial-ordenes-lab";
import { nombrePaciente, pacientesQuery } from "@/lib/pacientes.queries";
import { useCrearOrden } from "@/lib/laboratorio.queries";
import type { ExamenLaboratorio } from "@/lib/laboratorio-schemas";

export const Route = createFileRoute("/laboratorios")({
  beforeLoad: () => requireSession(),
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    paciente: typeof search.paciente === "string" ? search.paciente : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Laboratorios — MediSuite" },
      {
        name: "description",
        content:
          "Crea órdenes de laboratorio con búsqueda inteligente de exámenes e imprímelas para tu paciente.",
      },
      { property: "og:title", content: "Laboratorios — MediSuite" },
      {
        property: "og:description",
        content:
          "Órdenes de laboratorio con autocompletado de exámenes para consultorios en Perú.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(pacientesQuery());
  },
  component: LaboratoriosPage,
  errorComponent: ({ error }) => (
    <DashboardShell>
      <div role="alert" className="rounded-xl border border-destructive/40 bg-card p-6 text-sm">
        No se pudo cargar el módulo de laboratorios: {error.message}
      </div>
    </DashboardShell>
  ),
  notFoundComponent: () => (
    <DashboardShell>
      <p className="text-sm text-muted-foreground">Sin información disponible.</p>
    </DashboardShell>
  ),
});

function LaboratoriosPage() {
  const { paciente: pacienteInicial } = Route.useSearch();
  const { data: pacientes } = useSuspenseQuery(pacientesQuery());
  const [pacienteId, setPacienteId] = useState<string>(pacienteInicial ?? "");
  const [examenes, setExamenes] = useState<ExamenLaboratorio[]>([]);
  const [diagnostico, setDiagnostico] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const crear = useCrearOrden();

  const ids = useMemo(() => examenes.map((e) => e.id), [examenes]);
  const puedeGuardar = !!pacienteId && examenes.length > 0 && !crear.isPending;

  function guardar() {
    if (!puedeGuardar) return;
    crear.mutate(
      {
        paciente_id: pacienteId,
        diagnostico_presuntivo: diagnostico,
        observaciones,
        examen_ids: ids,
      },
      {
        onSuccess: () => {
          setExamenes([]);
          setDiagnostico("");
          setObservaciones("");
        },
      },
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Órdenes clínicas"
          title="Laboratorios"
          description="Busca exámenes por su nombre o abreviatura, arma la orden y guárdala para el paciente."
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
              <Label>Buscar examen</Label>
              <BuscadorExamenes
                yaAgregados={ids}
                onAgregar={(examen) => setExamenes((prev) => [...prev, examen])}
              />
              <p className="text-xs text-muted-foreground">
                Flechas para elegir, Enter para agregar, Escape para cerrar.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-sm font-semibold">
                  Exámenes solicitados
                </h2>
                <span className="text-xs text-muted-foreground">
                  {examenes.length} en la orden
                </span>
              </div>

              {examenes.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border/70 px-4 py-6 text-center text-sm text-muted-foreground">
                  Aún no agregaste exámenes.
                </p>
              ) : (
                <ol className="divide-y divide-border/50 overflow-hidden rounded-lg border border-border/60">
                  {examenes.map((e, i) => (
                    <li key={e.id} className="flex items-center gap-3 px-3 py-2.5 text-sm">
                      <span className="w-6 shrink-0 text-xs text-muted-foreground">
                        {i + 1}.
                      </span>
                      <span className="min-w-0 flex-1 truncate">{e.nombre_display}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Quitar ${e.nombre_display}`}
                        onClick={() =>
                          setExamenes((prev) => prev.filter((x) => x.id !== e.id))
                        }
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
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
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button className="gap-2" disabled={!puedeGuardar} onClick={guardar}>
                <FlaskConical className="h-4 w-4" />
                {crear.isPending ? "Guardando…" : "Guardar orden"}
              </Button>
              {examenes.length > 0 ? (
                <Button
                  variant="ghost"
                  className="gap-2 text-muted-foreground"
                  onClick={() => setExamenes([])}
                >
                  <Trash2 className="h-4 w-4" /> Vaciar lista
                </Button>
              ) : null}
            </div>
          </section>

          <aside className="space-y-3 rounded-xl border border-border/60 bg-card/60 p-5">
            <h2 className="font-display text-sm font-semibold">Cómo usarlo en consulta</h2>
            <p className="text-sm text-muted-foreground">
              Escribe el examen como lo dices en voz alta. Presiona Enter y sigue con el
              siguiente sin soltar el teclado.
            </p>
            <p className="text-sm text-muted-foreground">
              Al guardar, la orden queda en el historial del paciente y puedes imprimirla
              en formato A4 con tus datos y firma.
            </p>
            <Button asChild variant="outline" className="w-full gap-2">
              <Link to="/fichas">
                <Printer className="h-4 w-4" /> Ir a fichas clínicas
              </Link>
            </Button>
          </aside>
        </div>

        {pacienteId ? <HistorialOrdenes pacienteId={pacienteId} /> : null}
      </div>
    </DashboardShell>
  );
}
