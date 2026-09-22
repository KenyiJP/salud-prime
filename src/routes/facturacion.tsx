import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, CreditCard, Landmark, Loader2, Receipt } from "lucide-react";
import { requireSession } from "@/lib/auth-guard";
import { DashboardShell } from "@/components/dashboard-shell";
import { PageHeader } from "@/components/page-primitives";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FacturacionPasarelaCard } from "@/components/facturacion-pasarela-card";
import { FacturacionHistorialCard } from "@/components/facturacion-historial-card";
import { usePlanesSuscripcionQuery, useSuscripcionActualQuery } from "@/lib/landing-marca.queries";
import { formatearMonto } from "@/lib/facturacion-schemas";

export const Route = createFileRoute("/facturacion")({
  ssr: false,
  beforeLoad: () => requireSession(),
  head: () => ({ meta: [{ title: "Facturación — MediSuite" }] }),
  component: FacturacionPage,
});

// Culqi Checkout v4 cobra la suscripción SaaS con la llave PÚBLICA de MATEO
// (nunca la del médico — esa es la BYOK, ver `FacturacionPasarelaCard`). El
// checkout real se activa cuando MATEO tenga su cuenta Culqi aprobada con
// RUC 10 (ver auditoría Día 21 en HERMES.md); mientras esa variable no
// exista, este tab queda en modo informativo/comparativo — el mismo scope
// de solo-lectura que tenía el panel del Día 19.
const CULQI_PUBLIC_KEY = import.meta.env.VITE_CULQI_PUBLIC_KEY as string | undefined;

function FacturacionPage() {
  return (
    <DashboardShell>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Finanzas"
          title="Facturación y pagos"
          description="Gestiona tu plan MATEO, tu pasarela de cobro a pacientes y el historial de tus pagos."
        />

        <Tabs defaultValue="plan" className="w-full">
          <TabsList>
            <TabsTrigger value="plan" className="gap-2">
              <CreditCard className="h-4 w-4" /> Mi plan
            </TabsTrigger>
            <TabsTrigger value="pasarela" className="gap-2">
              <Landmark className="h-4 w-4" /> Cobro a pacientes
            </TabsTrigger>
            <TabsTrigger value="historial" className="gap-2">
              <Receipt className="h-4 w-4" /> Historial
            </TabsTrigger>
          </TabsList>

          <TabsContent value="plan">
            <PlanSuscripcionTab />
          </TabsContent>
          <TabsContent value="pasarela">
            <FacturacionPasarelaCard />
          </TabsContent>
          <TabsContent value="historial">
            <FacturacionHistorialCard />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  );
}

function PlanSuscripcionTab() {
  const suscripcion = useSuscripcionActualQuery();
  const planes = usePlanesSuscripcionQuery();

  if (suscripcion.isPending || planes.isPending) {
    return (
      <div className="flex min-h-24 items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando tu plan…
      </div>
    );
  }

  if (suscripcion.isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>No se pudo cargar tu suscripción</AlertTitle>
        <AlertDescription>{suscripcion.error.message}</AlertDescription>
      </Alert>
    );
  }

  const planActualId = suscripcion.data?.suscripcion.plan_id;

  return (
    <div className="space-y-6">
      {!CULQI_PUBLIC_KEY ? (
        <Alert>
          <AlertTitle>Pago en línea próximamente</AlertTitle>
          <AlertDescription>
            El cambio de plan con tarjeta (Culqi) se habilita en cuanto MATEO active su cuenta de
            cobro. Mientras tanto, escríbenos para activar o cambiar tu plan manualmente.
          </AlertDescription>
        </Alert>
      ) : null}

      {suscripcion.data ? (
        <Card className="max-w-3xl border-border/60 shadow-none">
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>Plan actual: {suscripcion.data.plan.nombre}</CardTitle>
              <Badge
                variant={suscripcion.data.suscripcion.estado === "activa" ? "default" : "secondary"}
              >
                {suscripcion.data.suscripcion.estado === "trial"
                  ? "Periodo de prueba"
                  : suscripcion.data.suscripcion.estado}
              </Badge>
            </div>
            <CardDescription>
              {formatearMonto(suscripcion.data.plan.precio_mensual, suscripcion.data.plan.moneda)} /
              mes · {suscripcion.data.usuarios_actuales} de {suscripcion.data.plan.max_usuarios}{" "}
              usuarios usados
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <p className="text-sm text-muted-foreground">
          Tu cuenta aún no tiene una suscripción activa registrada.
        </p>
      )}

      {planes.isError ? (
        <Alert variant="destructive">
          <AlertTitle>No se pudo cargar el catálogo de planes</AlertTitle>
          <AlertDescription>{planes.error.message}</AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {(planes.data ?? []).map((plan) => (
            <Card
              key={plan.id}
              className={
                plan.id === planActualId
                  ? "border-primary/60 shadow-none ring-1 ring-primary/30"
                  : "border-border/60 shadow-none"
              }
            >
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">{plan.nombre}</CardTitle>
                  {plan.id === planActualId ? (
                    <Badge className="gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Actual
                    </Badge>
                  ) : null}
                </div>
                <CardDescription>
                  {formatearMonto(plan.precio_mensual, plan.moneda)} / mes · hasta{" "}
                  {plan.max_usuarios} usuarios
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-1.5 text-sm text-muted-foreground">
                {plan.incluye_agente_whatsapp_ia ? <p>✓ Agente WhatsApp IA</p> : null}
                {plan.incluye_voice_scribe ? <p>✓ Voice Scribe (dictado clínico)</p> : null}
                {plan.incluye_facturacion_sunat ? <p>✓ Facturación SUNAT</p> : null}
                {plan.incluye_landing_personalizable ? <p>✓ Landing personalizable</p> : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
