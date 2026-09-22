import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getHistorialTransacciones,
  getPasarelaConfig,
  guardarPasarelaConfig,
} from "./facturacion.functions";
import type { GuardarPasarelaConfigInput } from "./facturacion-schemas";

const KEYS = {
  pasarela: ["pasarela-config"] as const,
  historial: ["historial-transacciones"] as const,
};

export function pasarelaConfigQuery() {
  return { queryKey: KEYS.pasarela, queryFn: () => getPasarelaConfig() };
}
export function usePasarelaConfigQuery() {
  return useQuery(pasarelaConfigQuery());
}

export function useGuardarPasarelaConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: GuardarPasarelaConfigInput) => guardarPasarelaConfig({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.pasarela });
      toast.success("Pasarela de pagos guardada. Ya puedes cobrar tus citas con Culqi.");
    },
    onError: (error: Error) =>
      toast.error(error.message || "No se pudo guardar la configuración de pagos."),
  });
}

export function historialTransaccionesQuery() {
  return { queryKey: KEYS.historial, queryFn: () => getHistorialTransacciones() };
}
export function useHistorialTransaccionesQuery() {
  return useQuery(historialTransaccionesQuery());
}
