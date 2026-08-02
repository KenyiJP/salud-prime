import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { cambiarEstadoCita, crearCita, getCitas } from "./citas.functions";
import type {
  CambiarEstadoCitaInput,
  CitaRow,
  EstadoCita,
  NuevaCitaInput,
} from "./clinica-schemas";

export type { CitaRow, EstadoCita };

export const citasQueryKey = ["citas-propias"] as const;

export const citasQuery = () =>
  queryOptions({ queryKey: citasQueryKey, queryFn: () => getCitas() });

export function useCitas() {
  return useSuspenseQuery(citasQuery());
}

export function useCrearCita() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NuevaCitaInput) => crearCita({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: citasQueryKey });
      toast.success("Cita agendada correctamente.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "No se pudo agendar la cita.");
    },
  });
}

export function useCambiarEstadoCita() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CambiarEstadoCitaInput) => cambiarEstadoCita({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: citasQueryKey });
      toast.success("Estado de la cita actualizado.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "No se pudo actualizar el estado de la cita.");
    },
  });
}

export function fechaCorta(iso: string) {
  return new Date(iso).toLocaleDateString("es-PE", { day: "2-digit", month: "short" });
}

export function horaCorta(iso: string) {
  return new Date(iso).toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
