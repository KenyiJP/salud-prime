import { Check, Minus, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ETIQUETA_ESTADO_SUSCRIPCION,
  type EstadoSuscripcion,
  type PlanSuscripcionRow,
} from "@/lib/landing-marca-schemas";
import {
  usePlanesSuscripcionQuery,
  useSuscripcionActualQuery,
} from "@/lib/landing-marca.queries";

function formatearPrecio(valor: number, moneda: string): string {
  const simbolo = moneda === "PEN" ? "S/" : moneda;
  return `${simbolo} ${valor.toFixed(2)}`;
}

const CARACTERISTICAS: {
  etiqueta: string;
  incluida: (plan: PlanSuscripcionRow) => boolean;
}[] = [
  { etiqueta: "Historia clínica y agenda", incluida: () => true },
  { etiqueta: "Landing pública personalizable", incluida: (p) => p.incluye_landing_personalizable },
  { etiqueta: "Facturación electrónica SUNAT", incluida: (p) => p.incluye_facturacion_sunat },
  { etiqueta: "Recordatorios por WhatsApp (IA)", incluida: (p) => p.incluye_agente_whatsapp_ia },
  { etiqueta: "Transcripción de consulta (Voice Scribe)", incluida: (p) => p.incluye_voice_scribe },
];

function TarjetaPlan({
  plan,
  esPlanActual,
}: {
  plan: PlanSuscripcionRow;
  esPlanActual: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-2xl border p-6",
        esPlanActual ? "border-primary bg-primary/5 ring-1 ring-primary/40" : "border-border/60 bg-card",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-display text-base font-semibold">{plan.nombre}</h3>
          <p className="mt-1 text-2xl font-semibold tracking-tight">
            {formatearPrecio(plan.precio_mensual, plan.moneda)}
            <span className="text-sm font-normal text-muted-foreground"> + IGV / mes</span>
          </p>
        </div>
        {esPlanActual ? (
          <Badge className="gap-1 bg-primary text-primary-foreground hover:bg-primary">
            <Sparkles className="h-3 w-3" /> Tu plan
          </Badge>
        ) : null}
      </div>

      <p className="text-xs text-muted-foreground">
        {plan.max_usuarios != null
          ? `Hasta ${plan.max_usuarios} usuario${plan.max_usuarios === 1 ? "" : "s"} del consultorio.`
          : "Usuarios ilimitados."}
      </p>

      <ul className="space-y-2 text-sm">
        {CARACTERISTICAS.map((c) => {
          const incluida = c.incluida(plan);
          return (
            <li key={c.etiqueta} className="flex items-center gap-2">
              {incluida ? (
                <Check className="h-4 w-4 shrink-0 text-primary" />
              ) : (
                <Minus className="h-4 w-4 shrink-0 text-muted-foreground/50" />
              )}
              <span className={incluida ? "" : "text-muted-foreground/70"}>{c.etiqueta}</span>
            </li>
          );
        })}
      </ul>

      {plan.permite_addon_marca_personal ? (
        <div className="rounded-lg border border-dashed border-border/70 px-3 py-2 text-xs text-muted-foreground">
          + Add-on Marca Personal: gestión de contenido y redes por el equipo de MATEO,{" "}
          {plan.precio_addon_marca_personal != null
            ? formatearPrecio(plan.precio_addon_marca_personal, plan.moneda)
            : ""}{" "}
          + IGV / mes.
        </div>
      ) : null}
    </div>
  );
}

export function MarcaSuscripcionTab() {
  const { data: planes, isLoading: cargandoPlanes } = usePlanesSuscripcionQuery();
  const { data: suscripcionInfo, isLoading: cargandoSuscripcion } = useSuscripcionActualQuery();

  const cargando = cargandoPlanes || cargandoSuscripcion;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Plan y suscripción
        </h3>
        <p className="text-sm text-muted-foreground">
          Consulta tu plan actual, el uso de tu límite de usuarios y las opciones disponibles.
          El cambio de plan autogestionado y el cobro recurrente llegan en una etapa posterior.
        </p>
      </div>

      {cargando ? (
        <p className="text-sm text-muted-foreground">Cargando información de tu suscripción…</p>
      ) : suscripcionInfo ? (
        <div className="rounded-xl border border-border/60 bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Suscripción actual
              </p>
              <p className="mt-1 font-display text-lg font-semibold">
                {suscripcionInfo.plan.nombre}
                {suscripcionInfo.suscripcion.addon_marca_personal ? " + Marca Personal" : ""}
              </p>
            </div>
            <Badge variant="outline">
              {ETIQUETA_ESTADO_SUSCRIPCION[suscripcionInfo.suscripcion.estado as EstadoSuscripcion] ??
                suscripcionInfo.suscripcion.estado}
            </Badge>
          </div>

          {suscripcionInfo.plan.max_usuarios != null ? (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Usuarios del consultorio</span>
                <span>
                  {suscripcionInfo.usuarios_actuales} de {suscripcionInfo.plan.max_usuarios}
                </span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full",
                    suscripcionInfo.usuarios_actuales >= suscripcionInfo.plan.max_usuarios
                      ? "bg-destructive"
                      : "bg-primary",
                  )}
                  style={{
                    width: `${Math.min(
                      100,
                      (suscripcionInfo.usuarios_actuales / suscripcionInfo.plan.max_usuarios) * 100,
                    )}%`,
                  }}
                />
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-border/70 px-4 py-6 text-center text-sm text-muted-foreground">
          Tu consultorio todavía no tiene una suscripción registrada.
        </p>
      )}

      <div>
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Planes disponibles
        </h4>
        {cargando ? (
          <p className="text-sm text-muted-foreground">Cargando planes…</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {(planes ?? []).map((plan) => (
              <TarjetaPlan
                key={plan.id}
                plan={plan}
                esPlanActual={suscripcionInfo?.plan.id === plan.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
