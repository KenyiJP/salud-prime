import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { HeartPulse } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard-shell";
import { guardPorRuta } from "@/components/require-ruta";
import { PageHeader } from "@/components/page-primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireSession } from "@/lib/auth-guard";
import { citasQuery, horaCorta, type CitaRow } from "@/lib/citas.queries";
import { nombrePaciente } from "@/lib/pacientes.queries";
import { CAMPOS_SIGNOS, mensajeSignos, prepararSignos, type CampoSigno } from "@/lib/signos-vitales";
import { useRegistrarSignosVitales } from "@/lib/signos-vitales.queries";

const Guard = guardPorRuta("/enfermeria");

export const Route = createFileRoute("/enfermeria")({
  beforeLoad: () => requireSession(),
  ssr: false,
  head: () => ({
    meta: [
      { title: "Enfermería — MediSuite" },
      { name: "description", content: "Citas del día y registro de signos vitales." },
    ],
  }),
  component: EnfermeriaPage,
});

function esHoy(iso: string): boolean {
  const d = new Date(iso);
  const h = new Date();
  return d.getFullYear() === h.getFullYear() && d.getMonth() === h.getMonth() && d.getDate() === h.getDate();
}

function EnfermeriaPage() {
  const citas = useQuery(citasQuery());
  const [seleccionada, setSeleccionada] = useState<CitaRow | null>(null);

  const delDia = useMemo(
    () =>
      (citas.data ?? [])
        .filter((c) => esHoy(c.fecha_hora) && c.estado !== "cancelada")
        .sort((a, b) => a.fecha_hora.localeCompare(b.fecha_hora)),
    [citas.data],
  );

  return (
    <DashboardShell Guard={Guard}>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Enfermería"
          title="Citas de hoy"
          description="Registra los signos vitales antes de la consulta. El médico los verá en la historia clínica."
        />

        {citas.isLoading ? <p className="text-sm text-muted-foreground">Cargando citas…</p> : null}
        {citas.isError ? (
          <p role="alert" className="text-sm text-destructive">
            No se pudieron cargar las citas.
          </p>
        ) : null}
        {!citas.isLoading && !citas.isError && delDia.length === 0 ? (
          <p className="rounded-lg border border-border/60 p-6 text-sm text-muted-foreground">
            No hay citas para hoy.
          </p>
        ) : null}

        <div className="space-y-2">
          {delDia.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border/60 p-3">
              <span className="w-14 text-sm font-medium tabular-nums">{horaCorta(c.fecha_hora)}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{nombrePaciente(c.pacientes)}</p>
              </div>
              <Badge variant="outline" className="capitalize">
                {c.estado}
              </Badge>
              <Button type="button" size="sm" onClick={() => setSeleccionada(c)}>
                <HeartPulse className="mr-2 h-4 w-4" /> Signos vitales
              </Button>
            </div>
          ))}
        </div>
      </div>

      <SignosDialog cita={seleccionada} onCerrar={() => setSeleccionada(null)} />
    </DashboardShell>
  );
}

function SignosDialog({ cita, onCerrar }: { cita: CitaRow | null; onCerrar: () => void }) {
  const registrar = useRegistrarSignosVitales();
  const [valores, setValores] = useState<Partial<Record<CampoSigno, string>>>({});
  const [errores, setErrores] = useState<Partial<Record<CampoSigno | "general", string>>>({});

  function cerrar() {
    setValores({});
    setErrores({});
    onCerrar();
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!cita) return;
    const prep = prepararSignos(valores);
    if (!prep.ok) {
      setErrores(prep.errores);
      return;
    }
    setErrores({});
    const r = await registrar.mutateAsync({ citaId: cita.id, datos: prep.datos });
    if (!r.ok) {
      setErrores({ general: mensajeSignos(r.codigo) });
      return;
    }
    toast.success("Signos vitales registrados.");
    cerrar();
  }

  return (
    <Dialog open={cita !== null} onOpenChange={(abierto) => (abierto ? undefined : cerrar())}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Signos vitales</DialogTitle>
          <DialogDescription>
            {cita ? nombrePaciente(cita.pacientes) : ""} · deja en blanco lo que no midas. La talla va en cm.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={guardar} className="grid gap-3 sm:grid-cols-2" noValidate>
          {CAMPOS_SIGNOS.map((c) => (
            <div key={c.clave} className="space-y-1">
              <Label htmlFor={`sv-${c.clave}`}>
                {c.etiqueta} <span className="text-muted-foreground">({c.unidad})</span>
              </Label>
              <Input
                id={`sv-${c.clave}`}
                inputMode="decimal"
                autoComplete="off"
                value={valores[c.clave] ?? ""}
                aria-invalid={errores[c.clave] ? true : undefined}
                onChange={(e) => setValores((v) => ({ ...v, [c.clave]: e.target.value }))}
              />
              {errores[c.clave] ? <p className="text-xs text-destructive">{errores[c.clave]}</p> : null}
            </div>
          ))}
          {errores.general ? (
            <p role="alert" className="text-sm text-destructive sm:col-span-2">
              {errores.general}
            </p>
          ) : null}
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="ghost" onClick={cerrar} disabled={registrar.isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={registrar.isPending}>
              {registrar.isPending ? "Guardando…" : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
