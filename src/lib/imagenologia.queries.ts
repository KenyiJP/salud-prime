import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { claveActiva } from "@/lib/query-scope";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  cambiarEstadoOrdenImagen,
  crearOrdenImagen,
  getMedicoImpresion,
  getOrdenImagenParaImprimir,
  getOrdenImagenPorToken,
  getOrdenesImagenPaciente,
  guardarFirmaMedico,
} from "./imagenologia.functions";
import type {
  CambiarEstadoOrdenImagenInput,
  EstudioImagen,
  NuevaOrdenImagenInput,
} from "./imagenologia-schemas";

const COLUMNAS_ESTUDIO =
  "id, nombre_display, modalidad, region, lateralidad, requiere_contraste, requiere_preparacion, instrucciones_preparacion, rank_uso";

/**
 * Catálogo global de estudios: busca en `nombre_display` y `sinonimos`
 * (los sinónimos nunca se muestran), ordena por `rank_uso` ascendente.
 */
export async function buscarEstudios(
  termino: string,
  modalidad: string | null,
): Promise<EstudioImagen[]> {
  const q = termino.trim().replace(/[,()%]/g, " ").trim();
  let query = supabase
    .from("estudios_imagen")
    .select(COLUMNAS_ESTUDIO)
    .eq("activo", true);
  if (modalidad) query = query.eq("modalidad", modalidad);
  if (q) query = query.or(`nombre_display.ilike.%${q}%,sinonimos.ilike.%${q}%`);
  const { data, error } = await query
    .order("rank_uso", { ascending: true })
    .limit(q ? 8 : 12);
  if (error) throw new Error(error.message);
  return (data ?? []) as EstudioImagen[];
}

export function useBuscarEstudios(termino: string, modalidad: string | null) {
  return useQuery({
    queryKey: ["estudios-imagen", termino, modalidad],
    queryFn: () => buscarEstudios(termino, modalidad),
    enabled: termino.trim().length > 0 || !!modalidad,
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
}

export const ordenesImagenKey = (pacienteId: string) =>
  claveActiva("ordenes-imagen", pacienteId);

export function useOrdenesImagenPaciente(pacienteId: string | null) {
  return useQuery({
    queryKey: ordenesImagenKey(pacienteId ?? "none"),
    queryFn: () => getOrdenesImagenPaciente({ data: { paciente_id: pacienteId! } }),
    enabled: !!pacienteId,
  });
}

export function useOrdenImagenImpresion(ordenId: string, token?: string) {
  return useQuery({
    queryKey: claveActiva("orden-imagen-imprimir", ordenId, token ?? "sesion"),
    retry: false,
    // El fallo esperado (sin sesión o con token vencido/manipulado) se convierte
    // en un mensaje mostrable, para que la página nunca quede en blanco.
    queryFn: async () => {
      try {
        return token
          ? await getOrdenImagenPorToken({ data: { id: ordenId, token } })
          : await getOrdenImagenParaImprimir({ data: { id: ordenId } });
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



export function useMedicoImpresion() {
  return useQuery({ queryKey: claveActiva("medico-impresion"), queryFn: () => getMedicoImpresion() });
}

export function useCrearOrdenImagen() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NuevaOrdenImagenInput) => crearOrdenImagen({ data: input }),
    onSuccess: (_res, input) => {
      queryClient.invalidateQueries({ queryKey: ordenesImagenKey(input.paciente_id) });
      toast.success("Orden de imagenología guardada.");
    },
    onError: (error: Error) =>
      toast.error(error.message || "No se pudo guardar la orden."),
  });
}

export function useCambiarEstadoOrdenImagen(pacienteId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CambiarEstadoOrdenImagenInput) =>
      cambiarEstadoOrdenImagen({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ordenesImagenKey(pacienteId ?? "none"),
      });
      toast.success("Estado de la orden actualizado.");
    },
    onError: (error: Error) =>
      toast.error(error.message || "No se pudo actualizar la orden."),
  });
}

/** Sube la imagen al bucket privado y guarda la URL firmada en la ficha. */
export function useSubirFirma() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (archivo: Blob) => {
      const { data: sesion } = await supabase.auth.getUser();
      const userId = sesion.user?.id;
      if (!userId) throw new Error("Tu sesión expiró, vuelve a ingresar.");
      const { error } = await supabase.storage
        .from("firmas-medicos")
        .upload(`${userId}/firma.png`, archivo, {
          upsert: true,
          contentType: "image/png",
        });
      if (error) throw new Error(error.message);
      return guardarFirmaMedico();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: claveActiva("medico-impresion") });
      toast.success("Firma guardada. Aparecerá en tus órdenes impresas.");
    },
    onError: (error: Error) => toast.error(error.message || "No se pudo guardar la firma."),
  });
}
