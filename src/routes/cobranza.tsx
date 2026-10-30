import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { FacturacionHistorialCard } from "@/components/facturacion-historial-card";
import { guardPorRuta } from "@/components/require-ruta";
import { PageHeader } from "@/components/page-primitives";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireSession } from "@/lib/auth-guard";
import { etiquetaEstadoPagoReserva, formatearSoles } from "@/lib/clinica-schemas";
import { useCobrosCitasQuery, usePacientesFacturacionQuery } from "@/lib/cobranza.queries";

const Guard = guardPorRuta("/cobranza");

export const Route = createFileRoute("/cobranza")({
  beforeLoad: () => requireSession(),
  ssr: false,
  head: () => ({
    meta: [
      { title: "Cobranza — MediSuite" },
      { name: "description", content: "Cobros de citas y datos de facturación de pacientes." },
    ],
  }),
  component: CobranzaPage,
});

function fechaHora(iso: string): string {
  return new Date(iso).toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" });
}

function CobranzaPage() {
  return (
    <DashboardShell Guard={Guard}>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Cobranza"
          title="Cobros y facturación"
          description="Estado de pago de las citas y datos para emitir comprobantes. No incluye información clínica."
        />
        <CobrosCard />
        <PacientesCard />
        <FacturacionHistorialCard />
      </div>
    </DashboardShell>
  );
}

function CobrosCard() {
  const cobros = useCobrosCitasQuery();
  const lista = cobros.data ?? [];

  return (
    <Card className="border-border/60 shadow-none">
      <CardHeader>
        <CardTitle>Cobros de citas</CardTitle>
        <CardDescription>Las 100 citas más recientes. El saldo se calcula sobre la tarifa congelada al reservar.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {cobros.isLoading ? <p className="text-sm text-muted-foreground">Cargando…</p> : null}
        {cobros.isError ? (
          <p role="alert" className="text-sm text-destructive">
            No se pudieron cargar los cobros.
          </p>
        ) : null}
        {!cobros.isLoading && !cobros.isError && lista.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aún no hay citas.</p>
        ) : null}
        {lista.map((c) => (
          <div key={c.cita_id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border/60 p-3 text-sm">
            <span className="w-36 tabular-nums">{fechaHora(c.fecha_hora)}</span>
            <Badge variant={c.saldo_pendiente > 0 && c.pago_obligatorio ? "destructive" : "secondary"}>
              {etiquetaEstadoPagoReserva(c.estado_pago_reserva)}
            </Badge>
            <span className="ml-auto flex gap-4 tabular-nums">
              <span className="text-muted-foreground">
                Tarifa {c.monto_esperado === null ? "—" : formatearSoles(Number(c.monto_esperado))}
              </span>
              <span>Pagado {formatearSoles(Number(c.total_pagado))}</span>
              <span className={Number(c.saldo_pendiente) > 0 ? "font-medium" : "text-muted-foreground"}>
                Saldo {formatearSoles(Number(c.saldo_pendiente))}
              </span>
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function PacientesCard() {
  const pacientes = usePacientesFacturacionQuery();
  const [buscar, setBuscar] = useState("");

  const lista = useMemo(() => {
    const q = buscar.trim().toLowerCase();
    const todos = pacientes.data ?? [];
    if (!q) return todos;
    return todos.filter((p) =>
      `${p.nombres} ${p.apellidos} ${p.documento_identidad ?? ""}`.toLowerCase().includes(q),
    );
  }, [pacientes.data, buscar]);

  return (
    <Card className="border-border/60 shadow-none">
      <CardHeader>
        <CardTitle>Datos de facturación de pacientes</CardTitle>
        <CardDescription>Solo identidad y contacto, para emitir comprobantes.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          placeholder="Buscar por nombre o documento"
          value={buscar}
          onChange={(e) => setBuscar(e.target.value)}
          aria-label="Buscar paciente"
        />
        {pacientes.isLoading ? <p className="text-sm text-muted-foreground">Cargando…</p> : null}
        {pacientes.isError ? (
          <p role="alert" className="text-sm text-destructive">
            No se pudieron cargar los datos de facturación.
          </p>
        ) : null}
        {lista.map((p) => (
          <div key={p.id} className="rounded-lg border border-border/60 p-3 text-sm">
            <p className="font-medium">
              {p.apellidos}, {p.nombres}
            </p>
            <p className="text-xs text-muted-foreground">
              {[p.tipo_documento, p.documento_identidad].filter(Boolean).join(" ") || "Sin documento"}
              {p.telefono ? ` · ${p.telefono}` : ""}
              {p.email ? ` · ${p.email}` : ""}
            </p>
            {p.direccion ? <p className="text-xs text-muted-foreground">{p.direccion}</p> : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
