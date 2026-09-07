import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { buscarCie10, type Cie10 } from "@/lib/cie10";

/**
 * Buscador de diagnósticos CIE-10 con teclado: flechas eligen, Enter agrega,
 * Escape cierra. Si el código no está en la lista, permite registrarlo a mano.
 */
export function BuscadorCie10({
  yaAgregados,
  onAgregar,
  disabled,
}: {
  yaAgregados: string[];
  onAgregar: (dx: Cie10) => void;
  disabled?: boolean;
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

  const resultados = useMemo(() => buscarCie10(debounced), [debounced]);
  const agregados = useMemo(() => new Set(yaAgregados), [yaAgregados]);

  useEffect(() => setIndice(0), [debounced]);

  function agregar(dx: Cie10) {
    if (agregados.has(dx.codigo)) return;
    onAgregar(dx);
    setTexto("");
    setDebounced("");
    setAbierto(false);
    inputRef.current?.focus();
  }

  function agregarManual() {
    const valor = texto.trim();
    if (!valor) return;
    const partes = valor.split(/\s+(.*)/s);
    const codigo = (partes[0] ?? valor).toUpperCase();
    const descripcion = (partes[1] ?? valor).trim();
    agregar({ codigo, descripcion: descripcion || codigo });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setAbierto(false);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const elegido = resultados[indice];
      if (elegido) agregar(elegido);
      else agregarManual();
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
    }
  }

  const mostrar = abierto && debounced.trim().length > 0;

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        ref={inputRef}
        value={texto}
        disabled={disabled}
        onChange={(e) => {
          setTexto(e.target.value);
          setAbierto(true);
        }}
        onFocus={() => setAbierto(true)}
        onKeyDown={onKeyDown}
        placeholder="Diagnóstico o código CIE-10: hipertensión, I10, ITU…"
        aria-label="Buscar diagnóstico CIE-10"
        autoComplete="off"
        className="h-11 pl-9"
      />

      {mostrar ? (
        <ul
          role="listbox"
          className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-border/70 bg-card shadow-xl"
        >
          {resultados.map((dx, i) => {
            const yaEsta = agregados.has(dx.codigo);
            return (
              <li key={dx.codigo} role="option" aria-selected={i === indice}>
                <button
                  type="button"
                  onMouseEnter={() => setIndice(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => agregar(dx)}
                  disabled={yaEsta}
                  className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm ${
                    i === indice ? "bg-primary/15 text-foreground" : "text-foreground/90"
                  } ${yaEsta ? "opacity-60" : ""}`}
                >
                  <span className="shrink-0 font-mono text-[11px] text-primary">
                    {dx.codigo}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{dx.descripcion}</span>
                  {yaEsta ? (
                    <span className="flex shrink-0 items-center gap-1 text-xs text-primary">
                      <Check className="h-3.5 w-3.5" /> Agregado
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}

          <li className="flex items-center justify-between gap-3 border-t border-border/60 px-3 py-2">
            <span className="text-xs text-muted-foreground">
              {resultados.length === 0
                ? "No está en la lista rápida."
                : "¿Otro código?"}
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onMouseDown={(e) => e.preventDefault()}
              onClick={agregarManual}
            >
              Agregar tal como lo escribí
            </Button>
          </li>
        </ul>
      ) : null}
    </div>
  );
}
