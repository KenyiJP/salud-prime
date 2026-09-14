import { useEffect, useState } from "react";
import { CheckCircle2, ExternalLink, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SLUG_REGEX, slugSchema } from "@/lib/landing-marca-schemas";
import {
  useActualizarTenantSlug,
  useTenantSlugQuery,
  useVerificarSlugDisponible,
} from "@/lib/landing-marca.queries";

/** Convierte texto libre en un slug candidato (no valida, solo sugiere). */
function normalizarCandidato(valor: string): string {
  return valor
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function MarcaSlugTab() {
  const { data, isLoading } = useTenantSlugQuery();
  const verificar = useVerificarSlugDisponible();
  const actualizar = useActualizarTenantSlug();

  const [valor, setValor] = useState("");
  const [estado, setEstado] = useState<"idle" | "checking" | "disponible" | "ocupado" | "invalido">(
    "idle",
  );

  useEffect(() => {
    if (data?.slug) setValor(data.slug);
  }, [data]);

  useEffect(() => {
    if (!valor) {
      setEstado("idle");
      return;
    }
    if (valor === data?.slug) {
      setEstado("idle");
      return;
    }
    const parsed = slugSchema.safeParse(valor);
    if (!parsed.success) {
      setEstado("invalido");
      return;
    }
    setEstado("checking");
    const timeout = setTimeout(async () => {
      try {
        const resultado = await verificar.mutateAsync(parsed.data);
        setEstado(resultado.disponible ? "disponible" : "ocupado");
      } catch {
        setEstado("idle");
      }
    }, 450);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor, data?.slug]);

  const candidatoNormalizado = normalizarCandidato(valor);
  const puedeGuardar = estado === "disponible";

  async function guardar() {
    if (!puedeGuardar) return;
    await actualizar.mutateAsync(valor);
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Dirección pública de tu landing
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Tus pacientes accederán a tu web en{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            mateo.pe/dr-{candidatoNormalizado || "tu-slug"}
          </code>
          .
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="slug-input">Subdominio / slug</Label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">mateo.pe/dr-</span>
            <Input
              id="slug-input"
              value={valor}
              onChange={(e) => setValor(normalizarCandidato(e.target.value))}
              placeholder="juan-perez"
              className="font-mono"
            />
            {estado === "checking" ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
            ) : estado === "disponible" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
            ) : estado === "ocupado" || estado === "invalido" ? (
              <XCircle className="h-4 w-4 shrink-0 text-destructive" />
            ) : null}
          </div>

          {estado === "invalido" ? (
            <p className="text-sm font-medium text-destructive">
              Solo minúsculas, números y guiones simples entre palabras (3 a 63 caracteres).
            </p>
          ) : estado === "ocupado" ? (
            <p className="text-sm font-medium text-destructive">
              Ese slug ya está en uso por otro consultorio.
            </p>
          ) : estado === "disponible" ? (
            <p className="text-sm font-medium text-green-600">Disponible.</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Formato: {SLUG_REGEX.source} — se usa tal como lo definas, sin espacios ni acentos.
            </p>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button onClick={guardar} disabled={!puedeGuardar || actualizar.isPending}>
              {actualizar.isPending ? "Guardando…" : "Guardar slug"}
            </Button>
            {data?.slug ? (
              <a
                href={`/dr-${data.slug}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                Ver landing actual <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
