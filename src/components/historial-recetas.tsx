import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Ban, ChevronDown, ChevronRight, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmarEliminar } from "@/components/confirmar-eliminar";
import {
  useCambiarEstadoReceta,
  useRecetasPaciente,
} from "@/lib/recetas.queries";
import {
  ETIQUETA_ESTADO_RECETA,
  fechaLargaReceta,
  fechaVencimiento,
  type RecetaConDetalle,
} from "@/lib/recetas-schemas";

export function HistorialRecetas({ pacienteId }: { pacienteId: string }) {
  const { data: recetas, isLoading, error } = useRecetasPaciente(pacienteId);
  const cambiarEstado = useCambiarEstadoReceta(pacienteId);
  const [abierta, setAbierta] = useState<string | null>(null);
  const [verAnuladas, setVerAnuladas] = useState(false);

  const activas = (recetas ?? []).filter((r) => r.estado !== "anulada");
  const anuladas = (recetas ?? []).filter((r) => r.estado === "anulada");

  function renderReceta(receta: RecetaConDetalle) {
    const anulada = receta.estado === "anulada";
    const expandida = abierta === receta.id;
    const vence = fechaVencimiento(receta.fecha_emision, receta.vigencia_dias);
    return (
      <article
        key={receta.id}
        className={`rounded-xl border border-border/60 bg-card p-4 ${
          anulada ? "opacity-70" : ""
        }`}
      >
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setAbierta(expandida ? null : receta.id)}
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
              {fechaLargaReceta(receta.fecha_emision)}
            </span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {receta.medicamentos.length} medicamentos
            </span>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] ${
                anulada ? "bg-destructive/15 text-destructive" : "bg-primary/15 text-primary"
              }`}
            >
              {ETIQUETA_ESTADO_RECETA[receta.estado]}
            </span>
          </button>

          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="gap-2">
              <Link to="/receta/$recetaId" params={{ recetaId: receta.id }}>
                <Printer className="h-4 w-4" /> Imprimir receta
              </Link>
            </Button>

            {!anulada ? (
              <ConfirmarEliminar
                title="¿Anular esta receta?"
                description="La receta no se borra: queda registrada como anulada y podrás consultarla en el apartado de recetas anuladas."
                confirmLabel="Anular receta"
                onConfirm={() =>
                  cambiarEstado.mutate({ id: receta.id, estado: "anulada" })
                }
                disabled={cambiarEstado.isPending}
                trigger={
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Anular receta"
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
            {anulada ? (
              <p className="text-sm text-destructive">
                Receta anulada — documento sin validez médica. Se conserva solo para
                auditoría.
              </p>
            ) : (
              <p className="text-sm">
                <span className="text-muted-foreground">Vigente hasta: </span>
                {fechaLargaReceta(vence.toISOString())}
              </p>
            )}
            {receta.diagnostico_presuntivo ? (
              <p className="text-sm">
                <span className="text-muted-foreground">Diagnóstico presuntivo: </span>
                {receta.diagnostico_presuntivo}
              </p>
            ) : null}
            {receta.observaciones ? (
              <p className="text-sm">
                <span className="text-muted-foreground">Observaciones: </span>
                {receta.observaciones}
              </p>
            ) : null}
            <ol className="space-y-1.5 text-sm">
              {receta.medicamentos.map((m) => (
                <li key={m.id} className="flex gap-2">
                  <span className="w-6 text-xs text-muted-foreground">{m.orden}.</span>
                  <span>
                    <span className="font-medium">{m.nombre_display}</span>
                    {[m.dosis, m.via_administracion, m.frecuencia, m.duracion, m.cantidad]
                      .filter(Boolean)
                      .length > 0 ? (
                      <span className="text-muted-foreground">
                        {" — "}
                        {[m.dosis, m.via_administracion, m.frecuencia, m.duracion, m.cantidad]
                          .filter(Boolean)
                          .join(" · ")}
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
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <h2 className="font-display text-lg font-semibold">Recetas del paciente</h2>
        {recetas ? (
          <span className="text-xs text-muted-foreground">{activas.length} vigentes</span>
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

      {recetas && activas.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/70 px-4 py-6 text-center text-sm text-muted-foreground">
          Este paciente todavía no tiene recetas vigentes.
        </p>
      ) : null}

      <div className="space-y-3">{activas.map(renderReceta)}</div>

      {anuladas.length > 0 ? (
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setVerAnuladas((v) => !v)}
            aria-expanded={verAnuladas}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
          >
            {verAnuladas ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
            Ver recetas anuladas ({anuladas.length})
          </button>
          {verAnuladas ? (
            <div className="mt-3 space-y-3">{anuladas.map(renderReceta)}</div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
