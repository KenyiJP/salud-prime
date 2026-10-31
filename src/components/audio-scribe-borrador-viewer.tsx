import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { claveActiva } from "@/lib/query-scope";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, AlertTriangle, FileText } from "lucide-react";

type CampoSoap = { valor: unknown; estado?: string; verificar?: boolean };
type BorradorFila = { trabajo_id: string; borrador: Record<string, CampoSoap | undefined> | null; generado_en: string };
type ConsultaScribe = {
  select: (c: string) => ConsultaScribe;
  eq: (c: string, v: string) => ConsultaScribe;
  is: (c: string, v: null) => ConsultaScribe;
  order: (c: string, o: { ascending: boolean }) => ConsultaScribe;
  limit: (n: number) => PromiseLike<{ data: unknown[] | null; error: unknown }>;
};
type ClienteTablas = { from: (t: string) => ConsultaScribe };

function textoDe(c: CampoSoap | undefined): string | null {
  const v = c?.valor;
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "string") return v;
  return JSON.stringify(v, null, 2);
}

type Props = {
  atencionId: string;
  onAplicarCampo: (campo: string, valor: any) => void;
};

export function AudioScribeBorradorViewer({ atencionId, onAplicarCampo }: Props) {
  const [aplicados, setAplicados] = useState<Record<string, boolean>>({});

  const { data: borradorData, isLoading } = useQuery({
    queryKey: claveActiva("scribe-borrador", atencionId),
    enabled: !!atencionId,
    queryFn: async () => {
      // Los tipos generados aún no incluyen scribe_*: único cast permitido.
      const { data, error } = await (supabase as unknown as ClienteTablas)
        .from("scribe_borradores")
        .select("trabajo_id, borrador, generado_en")
        .eq("atencion_id", atencionId)
        .is("descartado_en", null)
        .is("purgado_en", null)
        .order("generado_en", { ascending: false })
        .limit(1);
      if (error || !data || data.length === 0) return null;
      return data[0] as BorradorFila;
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

  const b = borradorData.borrador ?? {};
  const ETIQUETAS: Array<[string, string]> = [
    ["motivo_consulta", "Motivo de Consulta"],
    ["relato_cronologico", "Anamnesis / Enfermedad Actual"],
    ["antecedentes_alergicos", "Alergias"],
    ["medicacion_habitual", "Medicación habitual"],
    ["examen_general", "Examen Físico"],
    ["diagnosticos", "Diagnósticos"],
    ["plan_trabajo", "Plan de trabajo"],
    ["tratamiento", "Tratamiento"],
    ["indicaciones_generales", "Indicaciones"],
    ["proximo_control", "Próximo control"],
  ];
  const soapFields = ETIQUETAS.map(([key, label]) => ({
    key,
    label,
    valor: textoDe(b[key]),
    verificar: b[key]?.verificar === true,
  }));

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
                  {field.verificar ? (
                    <span className="ml-2 normal-case text-amber-600 dark:text-amber-400">· verificar con el paciente</span>
                  ) : null}
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
