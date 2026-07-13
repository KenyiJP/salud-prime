import { createFileRoute } from "@tanstack/react-router";
import { Receipt, FileText, Landmark } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { PageHeader, PlaceholderCard } from "@/components/page-primitives";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/facturacion")({
  head: () => ({ meta: [{ title: "Facturación — MediSuite" }] }),
  component: FacturacionPage,
});

function FacturacionPage() {
  return (
    <DashboardShell>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Finanzas"
          title="Facturación electrónica"
          description="Emite boletas y facturas electrónicas conforme a SUNAT, controla cobros y concilia tus pagos."
          actions={
            <Button className="gap-2">
              <Receipt className="h-4 w-4" /> Emitir comprobante
            </Button>
          }
        />

        <div className="grid gap-4 md:grid-cols-3">
          <PlaceholderCard
            icon={<FileText className="h-5 w-5" />}
            title="Comprobantes emitidos"
            description="Listado de boletas y facturas con estado SUNAT en tiempo real."
          />
          <PlaceholderCard
            icon={<Landmark className="h-5 w-5" />}
            title="Conciliación bancaria"
            description="Cruce automático de depósitos, Yape y Plin con tus comprobantes."
          />
          <PlaceholderCard
            icon={<Receipt className="h-5 w-5" />}
            title="Reportes tributarios"
            description="Exporta el registro de ventas listo para tu contador."
          />
        </div>
      </div>
    </DashboardShell>
  );
}
