import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { claveActiva } from "@/lib/query-scope";
import { toast } from "sonner";
import {
  actualizarTipoConsulta,
  crearBloqueo,
  crearHorario,
  crearTipoConsulta,
  eliminarBloqueo,
  getBloqueos,
  getHorarios,
  getTiposConsulta,
  getTiposConsultaAdmin,
  toggleHorario,
  toggleTipoConsulta,
} from "./agenda.functions";
import type {
  ActualizarTipoConsultaInput,
  EliminarBloqueoInput,
  NuevoBloqueoInput,
  NuevoHorarioInput,
  NuevoTipoConsultaInput,
  ToggleHorarioInput,
  ToggleTipoConsultaInput,
} from "./agenda-schemas";

export const tiposConsultaQueryKey = () => claveActiva("tipos-consulta");
export const tiposConsultaAdminQueryKey = () => claveActiva("tipos-consulta", "admin");
export const horariosQueryKey = () => claveActiva("horarios-atencion");
export const bloqueosQueryKey = () => claveActiva("bloqueos-horario");

export const tiposConsultaQuery = () =>
  queryOptions({ queryKey: tiposConsultaQueryKey(), queryFn: () => getTiposConsulta() });

export const tiposConsultaAdminQuery = () =>
  queryOptions({ queryKey: tiposConsultaAdminQueryKey(), queryFn: () => getTiposConsultaAdmin() });

export const horariosQuery = () =>
  queryOptions({ queryKey: horariosQueryKey(), queryFn: () => getHorarios() });

export const bloqueosQuery = () =>
  queryOptions({ queryKey: bloqueosQueryKey(), queryFn: () => getBloqueos() });

export function useTiposConsulta() {
  return useSuspenseQuery(tiposConsultaQuery());
}

export function useTiposConsultaAdmin() {
  return useSuspenseQuery(tiposConsultaAdminQuery());
}

export function useHorarios() {
  return useSuspenseQuery(horariosQuery());
}

export function useBloqueos() {
  return useSuspenseQuery(bloqueosQuery());
}

function invalidateTiposConsulta(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: tiposConsultaQueryKey() });
  queryClient.invalidateQueries({ queryKey: tiposConsultaAdminQueryKey() });
}

export function useCrearTipoConsulta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NuevoTipoConsultaInput) => crearTipoConsulta({ data: input }),
    onSuccess: () => {
      invalidateTiposConsulta(queryClient);
      toast.success("Tipo de consulta agregado.");
    },
    onError: (error: Error) =>
      toast.error(error.message || "No se pudo agregar el tipo de consulta."),
  });
}

export function useActualizarTipoConsulta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ActualizarTipoConsultaInput) => actualizarTipoConsulta({ data: input }),
    onSuccess: () => {
      invalidateTiposConsulta(queryClient);
      toast.success("Tipo de consulta actualizado.");
    },
    onError: (error: Error) =>
      toast.error(error.message || "No se pudo actualizar el tipo de consulta."),
  });
}

export function useToggleTipoConsulta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ToggleTipoConsultaInput) => toggleTipoConsulta({ data: input }),
    onSuccess: (row) => {
      invalidateTiposConsulta(queryClient);
      toast.success(row.activo ? "Tipo de consulta activado." : "Tipo de consulta desactivado.");
    },
    onError: (error: Error) =>
      toast.error(error.message || "No se pudo actualizar el tipo de consulta."),
  });
}

export function useCrearHorario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NuevoHorarioInput) => crearHorario({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: horariosQueryKey() });
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
      queryClient.invalidateQueries({ queryKey: horariosQueryKey() });
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
      queryClient.invalidateQueries({ queryKey: bloqueosQueryKey() });
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
      queryClient.invalidateQueries({ queryKey: bloqueosQueryKey() });
      toast.success("Bloqueo eliminado.");
    },
    onError: (error: Error) => toast.error(error.message || "No se pudo eliminar el bloqueo."),
  });
}
