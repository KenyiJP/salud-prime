import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  actualizarCita,
  cambiarEstadoCita,
  crearCita,
  eliminarCita,
  getCitas,
} from "./citas.functions";
import type {
  ActualizarCitaInput,
  CambiarEstadoCitaInput,
  CitaRow,
  EliminarCitaInput,
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

export function useActualizarCita() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ActualizarCitaInput) => actualizarCita({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: citasQueryKey });
      toast.success("Cita actualizada correctamente.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "No se pudo actualizar la cita.");
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

export function useEliminarCita() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: EliminarCitaInput) => eliminarCita({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: citasQueryKey });
      toast.success("Cita eliminada.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "No se pudo eliminar la cita.");
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

/** ISO timestamp -> value usable by <input type="datetime-local"> (local time). */
export function isoAInputLocal(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
