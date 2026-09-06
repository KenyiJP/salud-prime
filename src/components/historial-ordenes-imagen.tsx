import { useState } from "react";
import { Ban, ChevronDown, ChevronRight, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmarEliminar } from "@/components/confirmar-eliminar";
import {
  useCambiarEstadoOrdenImagen,
  useOrdenesImagenPaciente,
} from "@/lib/imagenologia.queries";
import {
  ETIQUETA_ESTADO_IMAGEN,
  etiquetaModalidad,
  type OrdenImagen,
} from "@/lib/imagenologia-schemas";
import { fechaLarga } from "@/lib/laboratorio-schemas";

export function HistorialOrdenesImagen({ pacienteId }: { pacienteId: string }) {
  const { data: ordenes, isLoading, error } = useOrdenesImagenPaciente(pacienteId);
  const cambiarEstado = useCambiarEstadoOrdenImagen(pacienteId);
  const [abierta, setAbierta] = useState<string | null>(null);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <h2 className="font-display text-lg font-semibold">
          Órdenes de imagenología del paciente
        </h2>
        {ordenes ? (
          <span className="text-xs text-muted-foreground">{ordenes.length} en total</span>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          No se pudo cargar el historial: {(error as Error).message}
        </p>
      ) : null}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando historial…</p>
      ) : null}
      {ordenes && ordenes.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/70 px-4 py-6 text-center text-sm text-muted-foreground">
          Este paciente todavía no tiene órdenes de imagenología.
        </p>
      ) : null}

      <div className="space-y-3">
        {(ordenes ?? []).map((orden: OrdenImagen) => {
          const anulada = orden.estado === "anulada";
          const expandida = abierta === orden.id;
          return (
            <article
              key={orden.id}
              className={`rounded-xl border border-border/60 bg-card p-4 ${
                anulada ? "opacity-60" : ""
              }`}
            >
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setAbierta(expandida ? null : orden.id)}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  aria-expanded={expandida}
                >
                  {expandida ? (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <span
                    className={`truncate text-sm font-medium ${anulada ? "line-through" : ""}`}
                  >
                    {fechaLarga(orden.fecha_orden)}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {orden.estudios.length} estudios
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] ${
                      orden.estado === "realizada"
                        ? "bg-primary/15 text-primary"
                        : anulada
                          ? "bg-muted text-muted-foreground"
                          : "bg-accent text-accent-foreground"
                    }`}
                  >
                    {ETIQUETA_ESTADO_IMAGEN[orden.estado]}
                  </span>
                </button>

                <div className="flex items-center gap-2">
                  {!anulada ? (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={cambiarEstado.isPending}
                      onClick={() =>
                        cambiarEstado.mutate({
                          id: orden.id,
                          estado:
                            orden.estado === "pendiente" ? "realizada" : "pendiente",
                        })
                      }
                    >
                      {orden.estado === "pendiente"
                        ? "Marcar realizada"
                        : "Marcar pendiente"}
                    </Button>
                  ) : null}

                  <Button variant="ghost" size="sm" className="gap-2" asChild>
                    <a href={`/orden-imagen/${orden.id}`} target="_blank" rel="noreferrer">
                      <Printer className="h-4 w-4" /> Imprimir
                    </a>
                  </Button>

                  {!anulada ? (
                    <ConfirmarEliminar
                      title="¿Anular esta orden?"
                      description="La orden no se borra: queda registrada como anulada y aparecerá tachada en el historial."
                      confirmLabel="Anular orden"
                      onConfirm={() =>
                        cambiarEstado.mutate({ id: orden.id, estado: "anulada" })
                      }
                      disabled={cambiarEstado.isPending}
                      trigger={
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Anular orden"
                          className="text-destructive hover:text-destructive"
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                      }
                    />
                  ) : null}
                </div>
              </div>

              {expandida ? (
                <div className="mt-4 space-y-3 border-t border-border/50 pt-4">
                  <p className="text-sm">
                    <span className="text-muted-foreground">Pregunta al radiólogo: </span>
                    {orden.indicacion_clinica}
                  </p>
                  {orden.diagnostico_presuntivo ? (
                    <p className="text-sm">
                      <span className="text-muted-foreground">
                        Diagnóstico presuntivo:{" "}
                      </span>
                      {orden.diagnostico_presuntivo}
                    </p>
                  ) : null}
                  <ol className="space-y-1.5 text-sm">
                    {orden.estudios.map((e) => (
                      <li key={e.estudio_id} className="flex gap-2">
                        <span className="w-6 text-xs text-muted-foreground">
                          {e.orden}.
                        </span>
                        <span className="min-w-0">
                          {e.nombre_display}{" "}
                          <span className="text-xs text-muted-foreground">
                            ({etiquetaModalidad(e.modalidad)})
                          </span>
                          {e.nota ? (
                            <span className="block text-xs text-muted-foreground">
                              Nota: {e.nota}
                            </span>
                          ) : null}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
