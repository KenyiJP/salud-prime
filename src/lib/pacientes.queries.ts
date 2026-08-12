import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  actualizarPaciente,
  crearPaciente,
  eliminarPaciente,
  getPacientes,
} from "./pacientes.functions";
import {
  nombrePaciente,
  type ActualizarPacienteInput,
  type EliminarPacienteInput,
  type NuevoPacienteInput,
  type PacienteRow,
} from "./clinica-schemas";

export type { PacienteRow };
export { nombrePaciente };

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
      toast.success(`Paciente ${nombrePaciente(paciente)} registrado correctamente.`);
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
      toast.success(`Datos de ${nombrePaciente(paciente)} actualizados.`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "No se pudo actualizar el paciente.");
    },
  });
}

export function useEliminarPaciente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: EliminarPacienteInput) => eliminarPaciente({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pacientesQueryKey });
      queryClient.invalidateQueries({ queryKey: ["citas-propias"] });
      toast.success("Paciente eliminado junto con sus citas.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "No se pudo eliminar el paciente.");
    },
  });
}
