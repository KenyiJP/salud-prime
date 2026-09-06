import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useBuscarEstudios } from "@/lib/imagenologia.queries";
import {
  MODALIDADES,
  etiquetaModalidad,
  type EstudioImagen,
} from "@/lib/imagenologia-schemas";

/**
 * Chips de modalidad + autocompletado, ambos visibles a la vez. El chip activo
 * restringe la búsqueda; sin texto, muestra los estudios más frecuentes de esa
 * modalidad. Enter agrega y mantiene el foco en el campo.
 */
export function BuscadorEstudios({
  yaAgregados,
  onAgregar,
}: {
  yaAgregados: string[];
  onAgregar: (estudio: EstudioImagen) => void;
}) {
  const [texto, setTexto] = useState("");
  const [debounced, setDebounced] = useState("");
  const [modalidad, setModalidad] = useState<string | null>(null);
  const [indice, setIndice] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(texto), 150);
    return () => clearTimeout(t);
  }, [texto]);

  const { data, isFetching } = useBuscarEstudios(debounced, modalidad);
  const resultados = useMemo(() => data ?? [], [data]);
  const agregados = useMemo(() => new Set(yaAgregados), [yaAgregados]);

  useEffect(() => setIndice(0), [debounced, modalidad]);

  function agregar(estudio: EstudioImagen) {
    if (agregados.has(estudio.id)) return;
    onAgregar(estudio);
    setTexto("");
    setDebounced("");
    inputRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setTexto("");
      setDebounced("");
      return;
    }
    if (!resultados.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndice((i) => (i + 1) % resultados.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndice((i) => (i - 1 + resultados.length) % resultados.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const elegido = resultados[indice];
      if (elegido) agregar(elegido);
    }
  }

  const mostrarLista = debounced.trim().length > 0 || !!modalidad;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {MODALIDADES.map((m) => {
          const activo = modalidad === m;
          return (
            <button
              key={m}
              type="button"
              onClick={() => setModalidad(activo ? null : m)}
              aria-pressed={activo}
              className={`flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition ${
                activo
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border/70 text-muted-foreground hover:text-foreground"
              }`}
            >
              {etiquetaModalidad(m)}
              {activo ? <X className="h-3 w-3" /> : null}
            </button>
          );
        })}
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Escribe el estudio: tórax, abdomen, resonancia de rodilla…"
          aria-label="Buscar estudio de imagen"
          autoComplete="off"
          className="h-11 pl-9 pr-24"
        />
        {modalidad ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 gap-1 text-xs text-primary"
            onClick={() => setModalidad(null)}
          >
            {etiquetaModalidad(modalidad)} <X className="h-3 w-3" />
          </Button>
        ) : null}
      </div>

      {mostrarLista ? (
        <ul
          role="listbox"
          className="divide-y divide-border/50 overflow-hidden rounded-xl border border-border/70 bg-card"
        >
          {resultados.map((estudio, i) => {
            const yaEsta = agregados.has(estudio.id);
            return (
              <li key={estudio.id} role="option" aria-selected={i === indice}>
                <button
                  type="button"
                  onMouseEnter={() => setIndice(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => agregar(estudio)}
                  disabled={yaEsta}
                  className={`flex w-full items-start gap-3 px-3 py-2.5 text-left text-sm ${
                    i === indice ? "bg-primary/10" : ""
                  } ${yaEsta ? "opacity-60" : ""}`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{estudio.nombre_display}</span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span className="rounded bg-muted px-1.5 py-0.5">
                        {etiquetaModalidad(estudio.modalidad)}
                      </span>
                      {estudio.region ? <span>{estudio.region}</span> : null}
                      {estudio.requiere_contraste ? (
                        <span className="rounded bg-primary/15 px-1.5 py-0.5 text-primary">
                          Con contraste
                        </span>
                      ) : null}
                      {estudio.requiere_preparacion ? (
                        <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-amber-500">
                          Requiere preparación
                        </span>
                      ) : null}
                    </span>
                  </span>
                  {yaEsta ? (
                    <span className="flex shrink-0 items-center gap-1 text-xs text-primary">
                      <Check className="h-3.5 w-3.5" /> Agregado
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}

          {resultados.length === 0 ? (
            <li className="px-3 py-3 text-sm text-muted-foreground">
              {isFetching ? "Buscando…" : "Sin resultados. Prueba otro nombre o modalidad."}
            </li>
          ) : null}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">
          Elige una modalidad o escribe el nombre del estudio. Flechas para elegir, Enter
          para agregar.
        </p>
      )}
    </div>
  );
}
