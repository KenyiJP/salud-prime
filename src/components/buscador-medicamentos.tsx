import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useBuscarMedicamentos } from "@/lib/recetas.queries";
import type { MedicamentoVademecum } from "@/lib/recetas-schemas";

/**
 * Buscador de DCI (Denominación Común Internacional) en tiempo real sobre el
 * Vademécum (Día 8): el médico escribe, flechas mueven el resaltado, Enter
 * agrega el medicamento a la receta y limpia el campo sin perder el foco.
 */
export function BuscadorMedicamentos({
  onAgregar,
}: {
  onAgregar: (medicamento: MedicamentoVademecum) => void;
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

  const { data, isFetching } = useBuscarMedicamentos(debounced);
  const resultados = useMemo(() => data ?? [], [data]);

  useEffect(() => setIndice(0), [debounced]);

  function agregar(medicamento: MedicamentoVademecum) {
    onAgregar(medicamento);
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
        placeholder="Escribe el DCI: amoxicilina, paracetamol, losartán…"
        aria-label="Buscar medicamento por DCI"
        autoComplete="off"
        className="h-11 pl-9"
      />

      {mostrar ? (
        <ul
          role="listbox"
          className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-border/70 bg-card shadow-xl"
        >
          {resultados.map((med, i) => (
            <li key={med.id} role="option" aria-selected={i === indice}>
              <button
                type="button"
                onMouseEnter={() => setIndice(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => agregar(med)}
                className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm ${
                  i === indice ? "bg-primary/15 text-foreground" : "text-foreground/90"
                }`}
              >
                <span className="min-w-0 flex-1 truncate">{med.nombre}</span>
                {med.presentacion ? (
                  <span className="shrink-0 text-[11px] text-muted-foreground">
                    {med.presentacion}
                  </span>
                ) : null}
              </button>
            </li>
          ))}

          {resultados.length === 0 ? (
            <li className="px-3 py-3 text-sm text-muted-foreground">
              {isFetching
                ? "Buscando…"
                : "Sin resultados en el Vademécum. Puedes agregarlo como descripción libre."}
            </li>
          ) : null}
        </ul>
      ) : null}

      {resultados.length === 0 && !isFetching ? (
        <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
          <Check className="h-3 w-3" /> Fórmulas magistrales o productos fuera de SISMED van en
          "descripción libre" al agregar.
        </p>
      ) : null}
    </div>
  );
}
