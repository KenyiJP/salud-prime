import { AlertTriangle, MessageSquareText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTriajePaciente, type UrgenciaTriaje } from "@/lib/ehr.queries";

const ETIQUETA: Record<UrgenciaTriaje, string> = {
  baja: "Urgencia baja",
  media: "Urgencia media",
  alta: "Urgencia alta",
  "alerta-urgencia": "ALERTA: posible urgencia",
};

/**
 * Triaje pre-consulta enviado por el paciente por WhatsApp. Todo lo mostrado
 * es AUTOREPORTADO y NO verificado; la urgencia es una sugerencia automática,
 * no un diagnóstico. Si no hay triaje completado, no se renderiza nada.
 */
export function TriajePrecitaCard({ pacienteId }: { pacienteId: string }) {
  const { data } = useTriajePaciente(pacienteId);
  const triaje = data?.[0];
  if (!triaje) return null;

  const urgente = triaje.urgencia_sugerida === "alerta-urgencia" || triaje.banderas_rojas_detectadas;
  const fecha = triaje.fecha_triaje
    ? new Date(triaje.fecha_triaje).toLocaleString("es-PE", {
        timeZone: "America/Lima",
        dateStyle: "short",
        timeStyle: "short",
      })
    : null;

  return (
    <section
      aria-label="Triaje pre-consulta"
      className={`space-y-2 rounded-lg border p-4 text-sm ${
        urgente ? "border-destructive bg-destructive/5" : "bg-muted/30"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        {urgente ? (
          <AlertTriangle className="h-4 w-4 text-destructive" aria-hidden />
        ) : (
          <MessageSquareText className="h-4 w-4 text-muted-foreground" aria-hidden />
        )}
        <h3 className="font-semibold">Triaje pre-consulta (WhatsApp)</h3>
        {triaje.urgencia_sugerida ? (
          <Badge variant={urgente ? "destructive" : "secondary"}>
            {ETIQUETA[triaje.urgencia_sugerida]}
          </Badge>
        ) : (
          <Badge variant="outline">Sin clasificar</Badge>
        )}
        {fecha ? <span className="text-xs text-muted-foreground">{fecha}</span> : null}
      </div>

      {triaje.banderas && triaje.banderas.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {triaje.banderas.map((b) => (
            <Badge key={b} variant="outline">
              {b}
            </Badge>
          ))}
        </div>
      ) : null}

      {triaje.resumen ? <p>{triaje.resumen}</p> : null}
      {triaje.motivo_reportado_paciente ? (
        <p className="text-muted-foreground">
          <span className="font-medium">Texto del paciente:</span> “
          {triaje.motivo_reportado_paciente}”
        </p>
      ) : null}

      <p className="text-xs font-medium text-muted-foreground">
        Reportado por paciente, no verificado. Sugerencia automática: no es un diagnóstico ni
        reemplaza tu evaluación clínica.
      </p>
    </section>
  );
}
