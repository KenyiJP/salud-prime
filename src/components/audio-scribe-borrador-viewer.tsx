import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, AlertTriangle, FileText } from "lucide-react";

type Props = {
  atencionId: string;
  onAplicarCampo: (campo: string, valor: any) => void;
};

export function AudioScribeBorradorViewer({ atencionId, onAplicarCampo }: Props) {
  const [aplicados, setAplicados] = useState<Record<string, boolean>>({});

  const { data: borradorData, isLoading } = useQuery({
    queryKey: ["scribe-borrador", atencionId],
    enabled: !!atencionId,
    queryFn: async () => {
      const { data: trabajos, error: errT } = await supabase
        .from("scribe_trabajos")
        .select("id, estado, creado_en")
        .eq("atencion_id", atencionId)
        .eq("estado", "listo")
        .order("creado_en", { ascending: false })
        .limit(1);

      if (errT || !trabajos || trabajos.length === 0) return null;
      const trabajoId = trabajos[0].id;

      const { data: borrador, error: errB } = await supabase
        .from("scribe_borradores")
        .select("*")
        .eq("trabajo_id", trabajoId)
        .maybeSingle();

      if (errB || !borrador) return null;
      return borrador;
    },
  });

  if (isLoading) {
    return <div className="text-sm text-muted-foreground p-4">Buscando borrador de IA...</div>;
  }

  if (!borradorData) {
    return (
      <div className="p-4 border rounded-lg bg-card text-card-foreground text-center space-y-2">
        <FileText className="w-8 h-8 mx-auto text-muted-foreground opacity-60" />
        <p className="text-sm font-medium">No hay borrador SOAP generado por IA para esta atención aún.</p>
        <p className="text-xs text-muted-foreground">
          Grabe y finalice la sesión de voz para procesar el audio y obtener el borrador SOAP automático.
        </p>
      </div>
    );
  }

  const soapFields = [
    { key: "motivo_consulta", label: "Motivo de Consulta", valor: borradorData.motivo_consulta },
    { key: "enfermedad_actual", label: "Anamnesis / Enfermedad Actual", valor: borradorData.enfermedad_actual },
    { key: "examen_fisico", label: "Examen Físico", valor: borradorData.examen_fisico },
    { key: "diagnosticos", label: "Diagnósticos CIE-10", valor: JSON.stringify(borradorData.diagnosticos, null, 2) },
    { key: "plan_tratamiento", label: "Plan / Tratamiento", valor: borradorData.plan_tratamiento },
  ];

  const handleAplicar = (key: string, valor: any) => {
    onAplicarCampo(key, valor);
    setAplicados((prev) => ({ ...prev, [key]: true }));
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4 shadow-sm">
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-base">Borrador SOAP de Voz</h3>
        </div>
        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 font-medium flex items-center gap-1.5 px-2.5 py-1">
          <AlertTriangle className="w-3.5 h-3.5" />
          Generado por IA – pendiente de revisión
        </Badge>
      </div>

      <div className="space-y-3">
        {soapFields.map((field) => {
          if (!field.valor) return null;
          const isApplied = aplicados[field.key];
          return (
            <div key={field.key} className="rounded-md border p-3 space-y-2 bg-muted/30">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {field.label}
                </span>
                <Button
                  size="sm"
                  variant={isApplied ? "outline" : "default"}
                  className="h-7 text-xs gap-1"
                  onClick={() => handleAplicar(field.key, field.valor)}
                >
                  <Check className="w-3.5 h-3.5" />
                  {isApplied ? "Aplicado" : "Aplicar a consulta"}
                </Button>
              </div>
              <p className="text-sm whitespace-pre-wrap text-foreground/90 bg-background p-2.5 rounded border">
                {field.valor}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
