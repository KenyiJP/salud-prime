import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  crearBloqueo,
  crearHorario,
  eliminarBloqueo,
  getBloqueos,
  getHorarios,
  getTiposConsulta,
  toggleHorario,
} from "./agenda.functions";
import type {
  EliminarBloqueoInput,
  NuevoBloqueoInput,
  NuevoHorarioInput,
  ToggleHorarioInput,
} from "./agenda-schemas";

export const tiposConsultaQueryKey = ["tipos-consulta"] as const;
export const horariosQueryKey = ["horarios-atencion"] as const;
export const bloqueosQueryKey = ["bloqueos-horario"] as const;

export const tiposConsultaQuery = () =>
  queryOptions({ queryKey: tiposConsultaQueryKey, queryFn: () => getTiposConsulta() });

export const horariosQuery = () =>
  queryOptions({ queryKey: horariosQueryKey, queryFn: () => getHorarios() });

export const bloqueosQuery = () =>
  queryOptions({ queryKey: bloqueosQueryKey, queryFn: () => getBloqueos() });

export function useTiposConsulta() {
  return useSuspenseQuery(tiposConsultaQuery());
}

export function useHorarios() {
  return useSuspenseQuery(horariosQuery());
}

export function useBloqueos() {
  return useSuspenseQuery(bloqueosQuery());
}

export function useCrearHorario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NuevoHorarioInput) => crearHorario({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: horariosQueryKey });
      toast.success("Turno agregado a tu horario semanal.");
    },
    onError: (error: Error) => toast.error(error.message || "No se pudo agregar el turno."),
  });
}

export function useToggleHorario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ToggleHorarioInput) => toggleHorario({ data: input }),
    onSuccess: (row) => {
      queryClient.invalidateQueries({ queryKey: horariosQueryKey });
      toast.success(row.activo ? "Turno activado." : "Turno desactivado.");
    },
    onError: (error: Error) => toast.error(error.message || "No se pudo actualizar el turno."),
  });
}

export function useCrearBloqueo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NuevoBloqueoInput) => crearBloqueo({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bloqueosQueryKey });
      toast.success("Bloqueo registrado.");
    },
    onError: (error: Error) => toast.error(error.message || "No se pudo registrar el bloqueo."),
  });
}

export function useEliminarBloqueo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: EliminarBloqueoInput) => eliminarBloqueo({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bloqueosQueryKey });
      toast.success("Bloqueo eliminado.");
    },
    onError: (error: Error) => toast.error(error.message || "No se pudo eliminar el bloqueo."),
  });
}
