import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { claveActiva } from "@/lib/query-scope";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  cambiarEstadoOrden,
  crearOrdenLaboratorio,
  getMedicoActual,
  getOrdenLaboratorioPorToken,
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
  queryOptions({ queryKey: claveActiva("medico-actual"), queryFn: () => getMedicoActual() });

export const ordenesPacienteKey = (pacienteId: string) =>
  claveActiva("ordenes-laboratorio", pacienteId);

export function useOrdenesPaciente(pacienteId: string | null) {
  return useQuery({
    queryKey: ordenesPacienteKey(pacienteId ?? "none"),
    queryFn: () => getOrdenesPaciente({ data: { paciente_id: pacienteId! } }),
    enabled: !!pacienteId,
  });
}

export function useOrdenParaImprimir(ordenId: string, token?: string) {
  return useQuery({
    queryKey: claveActiva("orden-laboratorio-imprimir", ordenId, token ?? "sesion"),
    retry: false,
    // El fallo esperado (sin sesión o con token vencido) se convierte en un
    // mensaje mostrable, para que la página nunca quede en blanco.
    queryFn: async () => {
      try {
        if (token) {
          return await getOrdenLaboratorioPorToken({ data: { id: ordenId, token } });
        }
        // Sin token, la lectura exige sesión: si no hay ninguna, no llamamos al
        // server function autenticado (evita el error 401 y la pantalla blanca).
        const { data: sesion } = await supabase.auth.getSession();
        if (!sesion.session) {
          return {
            errorAcceso:
              "Para ver esta orden necesitas abrir el enlace del código QR o ingresar con tu cuenta.",
          } as const;
        }
        return await getOrdenParaImprimir({ data: { id: ordenId } });
      } catch (error) {
        const mensaje = (error as Error)?.message ?? "";
        return {
          errorAcceso: /authorization|unauthorized|401/i.test(mensaje)
            ? "Para ver esta orden necesitas abrir el enlace del código QR o ingresar con tu cuenta."
            : mensaje || "No se pudo cargar la orden.",
        } as const;
      }
    },
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
