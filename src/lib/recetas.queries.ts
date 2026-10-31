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
  cambiarEstadoReceta,
  crearReceta,
  getMedicoActualReceta,
  getRecetaParaImprimir,
  getRecetaPorToken,
  getRecetasPaciente,
} from "./recetas.functions";
import type {
  CambiarEstadoRecetaInput,
  MedicamentoVademecum,
  NuevaRecetaInput,
} from "./recetas-schemas";

const db = supabase as unknown as SupabaseClient<any>;

/**
 * Autocomplete del buscador de DCI sobre el Vademécum SISMED (Día 8): busca
 * en `medicamentos` por nombre (trigram, acento-insensible via f_unaccent) y
 * trae la forma farmacéutica y vía de administración para el detalle.
 */
export async function buscarMedicamentos(termino: string): Promise<MedicamentoVademecum[]> {
  const q = termino.trim().replace(/[,()%]/g, " ").trim();
  if (!q) return [];
  const { data, error } = await db
    .from("medicamentos")
    .select(
      "id, nombre, presentacion, via_administracion_id, formas_farmaceuticas(nombre), vias_administracion(nombre)",
    )
    .ilike("nombre", `%${q}%`)
    .order("nombre", { ascending: true })
    .limit(10);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: any) => ({
    id: row.id,
    nombre: row.nombre,
    presentacion: row.presentacion,
    forma_farmaceutica: row.formas_farmaceuticas?.nombre ?? null,
    via_administracion_id: row.via_administracion_id,
    via_administracion: row.vias_administracion?.nombre ?? null,
  }));
}

export function useBuscarMedicamentos(termino: string) {
  return useQuery({
    queryKey: ["medicamentos-vademecum", termino],
    queryFn: () => buscarMedicamentos(termino),
    enabled: termino.trim().length > 0,
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
}

export const medicoActualRecetaQuery = () =>
  queryOptions({
    queryKey: claveActiva("medico-actual-receta"),
    queryFn: () => getMedicoActualReceta(),
  });

export const recetasPacienteKey = (pacienteId: string) =>
  claveActiva("recetas", pacienteId);

export function useRecetasPaciente(pacienteId: string | null) {
  return useQuery({
    queryKey: recetasPacienteKey(pacienteId ?? "none"),
    queryFn: () => getRecetasPaciente({ data: { paciente_id: pacienteId! } }),
    enabled: !!pacienteId,
  });
}

export function useRecetaParaImprimir(recetaId: string, token?: string) {
  return useQuery({
    queryKey: claveActiva("receta-imprimir", recetaId, token ?? "sesion"),
    retry: false,
    // El fallo esperado (sin sesión o con token vencido) se convierte en un
    // mensaje mostrable, para que la página nunca quede en blanco.
    queryFn: async () => {
      try {
        if (token) {
          return await getRecetaPorToken({ data: { id: recetaId, token } });
        }
        const { data: sesion } = await supabase.auth.getSession();
        if (!sesion.session) {
          return {
            errorAcceso:
              "Para ver esta receta necesitas abrir el enlace del código QR o ingresar con tu cuenta.",
          } as const;
        }
        return await getRecetaParaImprimir({ data: { id: recetaId } });
      } catch (error) {
        const mensaje = (error as Error)?.message ?? "";
        return {
          errorAcceso: /authorization|unauthorized|401/i.test(mensaje)
            ? "Para ver esta receta necesitas abrir el enlace del código QR o ingresar con tu cuenta."
            : mensaje || "No se pudo cargar la receta.",
        } as const;
      }
    },
  });
}

export function useCrearReceta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NuevaRecetaInput) => crearReceta({ data: input }),
    onSuccess: (_res, input) => {
      queryClient.invalidateQueries({ queryKey: recetasPacienteKey(input.paciente_id) });
      toast.success("Receta emitida correctamente.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "No se pudo emitir la receta.");
    },
  });
}

export function useCambiarEstadoReceta(pacienteId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CambiarEstadoRecetaInput) => cambiarEstadoReceta({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: recetasPacienteKey(pacienteId ?? "none"),
      });
      toast.success("Estado de la receta actualizado.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "No se pudo actualizar la receta.");
    },
  });
}
