import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  cambiarEstadoOrden,
  crearOrdenLaboratorio,
  getMedicoActual,
  getOrdenParaImprimir,
  getOrdenesPaciente,
} from "./laboratorio.functions";
import type {
  CambiarEstadoOrdenInput,
  ExamenLaboratorio,
  NuevaOrdenInput,
} from "./laboratorio-schemas";

const db = supabase as unknown as SupabaseClient<any>;

/**
 * Autocomplete search over the global LOINC catalogue. `sinonimos` is searched
 * but never displayed; `nombre_es` and `muestra` are never shown to the médico.
 */
export async function buscarExamenes(termino: string): Promise<ExamenLaboratorio[]> {
  const q = termino.trim().replace(/[,()%]/g, " ").trim();
  if (!q) return [];
  const { data, error } = await db
    .from("examenes_laboratorio")
    .select("id, loinc_num, nombre_display, rank_loinc")
    .eq("activo", true)
    .or(`nombre_display.ilike.%${q}%,sinonimos.ilike.%${q}%`)
    .order("rank_loinc", { ascending: true, nullsFirst: false })
    .limit(8);
  if (error) throw new Error(error.message);
  return (data ?? []) as ExamenLaboratorio[];
}

export function useBuscarExamenes(termino: string) {
  return useQuery({
    queryKey: ["examenes-laboratorio", termino],
    queryFn: () => buscarExamenes(termino),
    enabled: termino.trim().length > 0,
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
}

export const medicoActualQuery = () =>
  queryOptions({ queryKey: ["medico-actual"], queryFn: () => getMedicoActual() });

export const ordenesPacienteKey = (pacienteId: string) =>
  ["ordenes-laboratorio", pacienteId] as const;

export function useOrdenesPaciente(pacienteId: string | null) {
  return useQuery({
    queryKey: ordenesPacienteKey(pacienteId ?? "none"),
    queryFn: () => getOrdenesPaciente({ data: { paciente_id: pacienteId! } }),
    enabled: !!pacienteId,
  });
}

export function useOrdenParaImprimir(ordenId: string) {
  return useQuery({
    queryKey: ["orden-laboratorio-imprimir", ordenId],
    queryFn: () => getOrdenParaImprimir({ data: { id: ordenId } }),
  });
}

export function useCrearOrden() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NuevaOrdenInput) => crearOrdenLaboratorio({ data: input }),
    onSuccess: (_res, input) => {
      queryClient.invalidateQueries({ queryKey: ordenesPacienteKey(input.paciente_id) });
      toast.success("Orden de laboratorio guardada.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "No se pudo guardar la orden.");
    },
  });
}

export function useCambiarEstadoOrden(pacienteId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CambiarEstadoOrdenInput) => cambiarEstadoOrden({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ordenesPacienteKey(pacienteId ?? "none"),
      });
      toast.success("Estado de la orden actualizado.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "No se pudo actualizar la orden.");
    },
  });
}
