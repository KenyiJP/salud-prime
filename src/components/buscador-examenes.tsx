import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useBuscarExamenes } from "@/lib/laboratorio.queries";
import type { ExamenLaboratorio } from "@/lib/laboratorio-schemas";

/**
 * Keyboard-first autocomplete: the médico types, arrows move the highlight,
 * Enter adds the exam and clears the field keeping focus, Escape closes.
 */
export function BuscadorExamenes({
  yaAgregados,
  onAgregar,
}: {
  yaAgregados: string[];
  onAgregar: (examen: ExamenLaboratorio) => void;
}) {
  const [texto, setTexto] = useState("");
  const [debounced, setDebounced] = useState("");
  const [abierto, setAbierto] = useState(false);
  const [indice, setIndice] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(texto), 150);
    return () => clearTimeout(t);
  }, [texto]);

  const { data, isFetching } = useBuscarExamenes(debounced);
  const resultados = useMemo(() => data ?? [], [data]);
  const agregados = useMemo(() => new Set(yaAgregados), [yaAgregados]);

  useEffect(() => setIndice(0), [debounced]);

  function agregar(examen: ExamenLaboratorio) {
    if (agregados.has(examen.id)) return;
    onAgregar(examen);
    setTexto("");
    setDebounced("");
    setAbierto(false);
    inputRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setAbierto(false);
      return;
    }
    if (!resultados.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setAbierto(true);
      setIndice((i) => (i + 1) % resultados.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setAbierto(true);
      setIndice((i) => (i - 1 + resultados.length) % resultados.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const elegido = resultados[indice];
      if (elegido) agregar(elegido);
    }
  }

  const mostrar = abierto && debounced.trim().length > 0;

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        ref={inputRef}
        value={texto}
        onChange={(e) => {
          setTexto(e.target.value);
          setAbierto(true);
        }}
        onFocus={() => setAbierto(true)}
        onKeyDown={onKeyDown}
        placeholder="Escribe el examen: hemograma, creatinina, glucosa…"
        aria-label="Buscar examen de laboratorio"
        autoComplete="off"
        className="h-11 pl-9"
      />

      {mostrar ? (
        <ul
          role="listbox"
          className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-border/70 bg-card shadow-xl"
        >
          {resultados.map((examen, i) => {
            const yaEsta = agregados.has(examen.id);
            return (
              <li key={examen.id} role="option" aria-selected={i === indice}>
                <button
                  type="button"
                  onMouseEnter={() => setIndice(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => agregar(examen)}
                  disabled={yaEsta}
                  className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm ${
                    i === indice ? "bg-primary/15 text-foreground" : "text-foreground/90"
                  } ${yaEsta ? "opacity-60" : ""}`}
                >
                  <span className="min-w-0 flex-1 truncate">{examen.nombre_display}</span>
                  {yaEsta ? (
                    <span className="flex shrink-0 items-center gap-1 text-xs text-primary">
                      <Check className="h-3.5 w-3.5" /> Agregado
                    </span>
                  ) : (
                    <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                      {examen.loinc_num}
                    </span>
                  )}
                </button>
              </li>
            );
          })}

          {resultados.length === 0 ? (
            <li className="px-3 py-3 text-sm text-muted-foreground">
              {isFetching
                ? "Buscando…"
                : "Sin resultados. Prueba con otro nombre o abreviatura."}
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
