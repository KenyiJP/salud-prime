import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CampoSigno } from "./signos-vitales";

type Respuesta = { ok: true; atencion_id?: string } | { ok: false; codigo: string };
type Rpc = (
  nombre: string,
  args: Record<string, unknown>,
) => PromiseLike<{ data: unknown; error: unknown }>;

// Los tipos generados no incluyen las RPC del Día 29: único cast permitido.
const rpc = (supabase as unknown as { rpc: Rpc }).rpc.bind(supabase);

/** Llama a `atencion_registrar_signos_vitales`. Los rechazos llegan como dato (`ok:false`). */
export async function registrarSignosVitales(
  citaId: string,
  datos: Partial<Record<CampoSigno, number>>,
): Promise<Respuesta> {
  const { data, error } = await rpc("atencion_registrar_signos_vitales", {
    p_cita_id: citaId,
    p_datos: datos,
  });
  if (error || !data || typeof data !== "object") return { ok: false, codigo: "error" };
  return data as Respuesta;
}

export function useRegistrarSignosVitales() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { citaId: string; datos: Partial<Record<CampoSigno, number>> }) =>
      registrarSignosVitales(v.citaId, v.datos),
    onSuccess: (r) => {
      if (r.ok) void qc.invalidateQueries({ queryKey: ["atenciones"] });
    },
  });
}
