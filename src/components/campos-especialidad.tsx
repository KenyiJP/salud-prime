import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { seccionesDe, type CampoPlantilla, type PlantillaRow } from "@/lib/ehr-schemas";

type Valores = Record<string, unknown>;

/**
 * Renderiza la capa dinámica de la especialidad a partir del JSONB `esquema`
 * de la plantilla; las respuestas se guardan en `campos_especialidad`.
 */
export function CamposEspecialidad({
  plantilla,
  valores,
  onChange,
  soloLectura,
}: {
  plantilla: PlantillaRow | null | undefined;
  valores: Valores;
  onChange: (valores: Valores) => void;
  soloLectura?: boolean;
}) {
  const secciones = seccionesDe(plantilla);

  if (!plantilla) {
    return (
      <p className="rounded-lg border border-dashed border-border/70 px-4 py-6 text-center text-sm text-muted-foreground">
        Elige una plantilla de especialidad para ver sus campos.
      </p>
    );
  }
  if (secciones.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Esta plantilla no define campos adicionales.
      </p>
    );
  }

  const set = (id: string, valor: unknown) => onChange({ ...valores, [id]: valor });

  return (
    <div className="space-y-6">
      {secciones.map((seccion) => (
        <section key={seccion.id} className="space-y-4 rounded-lg border border-border/60 p-4">
          <h3 className="font-display text-sm font-semibold">{seccion.titulo}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {seccion.campos.map((campo) => (
              <div
                key={campo.id}
                className={cn(
                  "space-y-2",
                  (campo.tipo === "textarea" || campo.tipo === "multiselect") &&
                    "sm:col-span-2",
                )}
              >
                <Label htmlFor={`esp-${campo.id}`}>
                  {campo.label}
                  {campo.unit ? (
                    <span className="ml-1 text-xs text-muted-foreground">({campo.unit})</span>
                  ) : null}
                </Label>
                <CampoDinamico
                  campo={campo}
                  valor={valores[campo.id]}
                  onChange={(v) => set(campo.id, v)}
                  soloLectura={soloLectura}
                />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function CampoDinamico({
  campo,
  valor,
  onChange,
  soloLectura,
}: {
  campo: CampoPlantilla;
  valor: unknown;
  onChange: (v: unknown) => void;
  soloLectura?: boolean;
}) {
  const id = `esp-${campo.id}`;

  if (campo.tipo === "textarea") {
    return (
      <Textarea
        id={id}
        rows={campo.filas ?? 3}
        disabled={soloLectura}
        placeholder={campo.placeholder}
        value={(valor as string) ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  if (campo.tipo === "select") {
    return (
      <Select
        value={(valor as string) ?? ""}
        disabled={soloLectura}
        onValueChange={(v) => onChange(v)}
      >
        <SelectTrigger id={id} className="h-10">
          <SelectValue placeholder="Selecciona…" />
        </SelectTrigger>
        <SelectContent>
          {(campo.opciones ?? []).map((op) => (
            <SelectItem key={op} value={op}>
              {op}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (campo.tipo === "multiselect") {
    const seleccion = Array.isArray(valor) ? (valor as string[]) : [];
    return (
      <div className="flex flex-wrap gap-2">
        {(campo.opciones ?? []).map((op) => {
          const activo = seleccion.includes(op);
          return (
            <Button
              key={op}
              type="button"
              size="sm"
              variant={activo ? "default" : "outline"}
              disabled={soloLectura}
              aria-pressed={activo}
              onClick={() =>
                onChange(
                  activo ? seleccion.filter((s) => s !== op) : [...seleccion, op],
                )
              }
            >
              {op}
            </Button>
          );
        })}
      </div>
    );
  }

  return (
    <Input
      id={id}
      type={campo.tipo === "number" ? "number" : campo.tipo === "date" ? "date" : "text"}
      inputMode={campo.tipo === "number" ? "decimal" : undefined}
      step={campo.tipo === "number" ? "any" : undefined}
      disabled={soloLectura}
      placeholder={campo.placeholder}
      value={(valor as string | number | undefined) ?? ""}
      onChange={(e) =>
        onChange(
          campo.tipo === "number"
            ? e.target.value === ""
              ? null
              : Number(e.target.value)
            : e.target.value,
        )
      }
    />
  );
}
