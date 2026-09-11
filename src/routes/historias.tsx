import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ChevronDown, ClipboardPlus, FileText, FlaskConical, Scan, Search, Stethoscope } from "lucide-react";
import { requireSession } from "@/lib/auth-guard";
import { DashboardShell } from "@/components/dashboard-shell";
import { PageHeader } from "@/components/page-primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AtencionForm } from "@/components/atencion-form";
import { nombrePaciente, pacientesQuery } from "@/lib/pacientes.queries";
import {
  medicoEhrQuery,
  plantillasQuery,
  useAtencion,
  useAtencionesPaciente,
} from "@/lib/ehr.queries";
import {
  ETIQUETA_ESTADO_ATENCION,
  diagnosticosDe,
  edadEnAnios,
  etiqueta,
  type AtencionRow,
  type EstadoAtencion,
} from "@/lib/ehr-schemas";
import type { PacienteRow } from "@/lib/clinica-schemas";

export const Route = createFileRoute("/historias")({
  beforeLoad: () => requireSession(),
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    paciente: typeof search.paciente === "string" ? search.paciente : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Expediente clínico — MediSuite" },
      {
        name: "description",
        content:
          "Registra la consulta médica completa con triaje, anamnesis, diagnósticos CIE-10 y firma legal según NTS 139.",
      },
      { property: "og:title", content: "Expediente clínico — MediSuite" },
      {
        property: "og:description",
        content:
          "Historia clínica electrónica para consultorios en Perú: consulta, plantillas por especialidad y firma legal.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(pacientesQuery());
    context.queryClient.ensureQueryData(medicoEhrQuery());
    context.queryClient.ensureQueryData(plantillasQuery());
  },
  component: HistoriasPage,
  errorComponent: ({ error }) => (
    <DashboardShell>
      <div role="alert" className="rounded-xl border border-destructive/40 bg-card p-6 text-sm">
        No se pudo cargar el expediente clínico: {error.message}
      </div>
    </DashboardShell>
  ),
  notFoundComponent: () => (
    <DashboardShell>
      <p className="text-sm text-muted-foreground">Sin información disponible.</p>
    </DashboardShell>
  ),
});

function HistoriasPage() {
  const { paciente: pacienteInicial } = Route.useSearch();
  const { data: pacientes } = useSuspenseQuery(pacientesQuery());
  const { data: medico } = useSuspenseQuery(medicoEhrQuery());
  const { data: plantillas } = useSuspenseQuery(plantillasQuery());

  const [busqueda, setBusqueda] = useState("");
  const [pacienteId, setPacienteId] = useState<string>(pacienteInicial ?? "");
  const [atencionId, setAtencionId] = useState<string | null>(null);
  const [modo, setModo] = useState<"historial" | "consulta">("historial");

  const atenciones = useAtencionesPaciente(pacienteId || null);
  const detalle = useAtencion(atencionId);

  const paciente = pacientes.find((p) => p.id === pacienteId) ?? null;

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return pacientes;
    return pacientes.filter((p) =>
      `${p.nombres} ${p.apellidos} ${p.documento_identidad ?? ""} ${p.numero_historia_clinica}`
        .toLowerCase()
        .includes(q),
    );
  }, [pacientes, busqueda]);

  function nuevaConsulta() {
    setAtencionId(null);
    setModo("consulta");
  }

  function abrirAtencion(id: string) {
    setAtencionId(id);
    setModo("consulta");
  }

  return (
    <DashboardShell>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Historia clínica"
          title="Expediente clínico"
          description="Registra el acto médico completo: triaje, anamnesis, examen físico, diagnósticos y plan, con cierre firmado."
          actions={
            paciente ? (
              <Button className="gap-2" onClick={nuevaConsulta}>
                <ClipboardPlus className="h-4 w-4" /> Nueva consulta
              </Button>
            ) : null
          }
        />

        <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="space-y-3 rounded-xl border border-border/60 bg-card p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Nombre, documento o N° de HC"
                aria-label="Buscar paciente"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>

            <ul className="max-h-[60vh] space-y-1 overflow-y-auto">
              {filtrados.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setPacienteId(p.id);
                      setAtencionId(null);
                      setModo("historial");
                    }}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                      p.id === pacienteId
                        ? "bg-primary/15 text-foreground"
                        : "hover:bg-muted/60"
                    }`}
                  >
                    <span className="block truncate font-medium">{nombrePaciente(p)}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      HC {p.numero_historia_clinica}
                    </span>
                  </button>
                </li>
              ))}
              {filtrados.length === 0 ? (
                <li className="px-3 py-4 text-sm text-muted-foreground">
                  Sin pacientes que coincidan.
                </li>
              ) : null}
            </ul>
          </aside>

          <section className="min-w-0">
            {!paciente ? (
              <div className="rounded-xl border border-dashed border-border/70 bg-card/40 p-8 text-center">
                <Stethoscope className="mx-auto h-8 w-8 text-primary" />
                <p className="mt-3 text-sm text-muted-foreground">
                  Elige un paciente de la lista para ver su historial o iniciar una consulta.
                </p>
              </div>
            ) : modo === "historial" ? (
              <Historial
                paciente={paciente}
                atenciones={atenciones.data ?? []}
                cargando={atenciones.isLoading}
                onAbrir={abrirAtencion}
                onNueva={nuevaConsulta}
              />
            ) : atencionId && detalle.isLoading ? (
              <p className="text-sm text-muted-foreground">Cargando atención…</p>
            ) : atencionId && detalle.error ? (
              <p role="alert" className="text-sm text-destructive">
                {(detalle.error as Error).message}
              </p>
            ) : (
              <div className="space-y-4">
                <Button variant="ghost" size="sm" onClick={() => setModo("historial")}>
                  ← Volver al historial
                </Button>
                <AtencionForm
                  key={atencionId ?? "nueva"}
                  paciente={detalle.data?.paciente ?? paciente}
                  medico={medico}
                  plantillas={plantillas}
                  atencion={detalle.data?.atencion ?? null}
                  adendas={detalle.data?.adendas ?? []}
                  onGuardado={(row) => setAtencionId(row.id)}
                />
                {detalle.data ? (
                  <OrdenesVinculadas
                    laboratorios={detalle.data.ordenesLaboratorio}
                    imagenes={detalle.data.ordenesImagen}
                  />
                ) : null}
              </div>
            )}
          </section>
        </div>
      </div>
    </DashboardShell>
  );
}

function Historial({
  paciente,
  atenciones,
  cargando,
  onAbrir,
  onNueva,
}: {
  paciente: PacienteRow;
  atenciones: AtencionRow[];
  cargando: boolean;
  onAbrir: (id: string) => void;
  onNueva: () => void;
}) {
  const edad = edadEnAnios(paciente.fecha_nacimiento);

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border/60 bg-card p-5">
        <h2 className="font-display text-lg font-semibold">{nombrePaciente(paciente)}</h2>
        <p className="text-sm text-muted-foreground">
          HC {paciente.numero_historia_clinica} · {paciente.tipo_documento}{" "}
          {paciente.documento_identidad ?? "—"} ·{" "}
          {edad !== null ? `${edad} años` : "Edad no registrada"} ·{" "}
          {paciente.sexo ?? "Sexo no registrado"}
        </p>
      </div>

      {cargando ? (
        <p className="text-sm text-muted-foreground">Cargando atenciones…</p>
      ) : atenciones.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/70 bg-card/40 p-8 text-center">
          <FileText className="mx-auto h-8 w-8 text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">
            Este paciente todavía no tiene atenciones registradas.
          </p>
          <Button className="mt-4 gap-2" onClick={onNueva}>
            <ClipboardPlus className="h-4 w-4" /> Registrar primera consulta
          </Button>
        </div>
      ) : (
        <ol className="space-y-3">
          {atenciones.map((a) => {
            const dx = diagnosticosDe(a);
            const principal = dx.find((d) => d.es_principal) ?? dx[0];
            return (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => onAbrir(a.id)}
                  className="w-full rounded-xl border border-border/60 bg-card p-4 text-left transition hover:border-primary/50"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="font-medium">
                      {new Date(`${a.fecha_atencion}T${a.hora_atencion}`).toLocaleString(
                        "es-PE",
                        { dateStyle: "long", timeStyle: "short" },
                      )}
                    </span>
                    <Badge
                      variant={
                        a.estado === "anulada"
                          ? "destructive"
                          : a.estado === "firmada"
                            ? "default"
                            : "secondary"
                      }
                    >
                      {ETIQUETA_ESTADO_ATENCION[a.estado as EstadoAtencion] ?? a.estado}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {etiqueta(a.tipo_atencion)} · {a.motivo_consulta ?? "Sin motivo registrado"}
                  </p>
                  {principal ? (
                    <p className="mt-1 text-sm">
                      <span className="font-mono text-[11px] text-primary">
                        {principal.codigo_cie10}
                      </span>{" "}
                      {principal.descripcion}
                    </p>
                  ) : null}
                  {a.estado === "anulada" && a.motivo_anulacion ? (
                    <p className="mt-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      Motivo de anulación: {a.motivo_anulacion}
                    </p>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

type OrdenVinculada = {
  id: string;
  estado: string;
  fecha_orden: string;
  orden_laboratorio_examenes?: Array<{
    examenes_laboratorio?: { nombre_display?: string } | null;
  }>;
  orden_imagen_estudios?: Array<{
    estudios_imagen?: { nombre_display?: string; modalidad?: string } | null;
  }>;
};

function OrdenesVinculadas({
  laboratorios,
  imagenes,
}: {
  laboratorios: OrdenVinculada[];
  imagenes: OrdenVinculada[];
}) {
  const todas = [
    ...laboratorios.map((orden) => ({ ...orden, tipo: "Laboratorio" as const })),
    ...imagenes.map((orden) => ({ ...orden, tipo: "Imagenología" as const })),
  ].sort((a, b) => b.fecha_orden.localeCompare(a.fecha_orden));
  const vigentes = todas.filter((orden) => orden.estado !== "anulada");
  const anuladas = todas.filter((orden) => orden.estado === "anulada");

  const renderOrden = (orden: (typeof todas)[number]) => {
    const items = orden.tipo === "Laboratorio"
      ? orden.orden_laboratorio_examenes?.map(
          (item) => item.examenes_laboratorio?.nombre_display ?? "Examen",
        )
      : orden.orden_imagen_estudios?.map(
          (item) => item.estudios_imagen?.nombre_display ?? "Estudio",
        );
    return (
      <li key={`${orden.tipo}-${orden.id}`} className="rounded-lg border border-border/60 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-sm font-medium">
            {orden.tipo === "Laboratorio" ? (
              <FlaskConical className="h-4 w-4 text-primary" />
            ) : (
              <Scan className="h-4 w-4 text-primary" />
            )}
            {orden.tipo}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {new Date(orden.fecha_orden).toLocaleString("es-PE")}
            </span>
            <Badge variant={orden.estado === "anulada" ? "destructive" : "secondary"}>
              {orden.estado === "anulada" ? "Anulada" : orden.estado}
            </Badge>
          </div>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{items?.join(" · ") || "Sin detalle"}</p>
      </li>
    );
  };

  if (todas.length === 0) return null;
  return (
    <section className="space-y-3 rounded-xl border border-border/60 bg-card p-5">
      <h3 className="font-display text-sm font-semibold">Órdenes emitidas en esta consulta</h3>
      {vigentes.length > 0 ? <ul className="space-y-2">{vigentes.map(renderOrden)}</ul> : (
        <p className="text-sm text-muted-foreground">No hay órdenes vigentes vinculadas.</p>
      )}
      {anuladas.length > 0 ? (
        <details className="group border-t border-border/60 pt-3">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-sm text-muted-foreground">
            <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
            Ver órdenes anuladas ({anuladas.length})
          </summary>
          <ul className="mt-3 space-y-2">{anuladas.map(renderOrden)}</ul>
        </details>
      ) : null}
    </section>
  );
}
