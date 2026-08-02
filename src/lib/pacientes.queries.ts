import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  actualizarPaciente,
  crearPaciente,
  getPacientes,
} from "./pacientes.functions";
import type {
  ActualizarPacienteInput,
  NuevoPacienteInput,
  PacienteRow,
} from "./clinica-schemas";

export type { PacienteRow };

export const pacientesQueryKey = ["pacientes-propios"] as const;

export const pacientesQuery = () =>
  queryOptions({ queryKey: pacientesQueryKey, queryFn: () => getPacientes() });

export function usePacientes() {
  return useSuspenseQuery(pacientesQuery());
}

export function useCrearPaciente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NuevoPacienteInput) => crearPaciente({ data: input }),
    onSuccess: (paciente) => {
      queryClient.invalidateQueries({ queryKey: pacientesQueryKey });
      toast.success(`Paciente ${paciente.nombre_completo} registrado correctamente.`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "No se pudo registrar el paciente.");
    },
  });
}

export function useActualizarPaciente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ActualizarPacienteInput) => actualizarPaciente({ data: input }),
    onSuccess: (paciente) => {
      queryClient.invalidateQueries({ queryKey: pacientesQueryKey });
      toast.success(`Datos de ${paciente.nombre_completo} actualizados.`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "No se pudo actualizar el paciente.");
    },
  });
}
