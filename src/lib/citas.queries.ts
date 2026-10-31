import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { claveActiva } from "@/lib/query-scope";
import { toast } from "sonner";
import { MENSAJE_PAGO_GENERICO, mensajePagoPresencial } from "@/lib/pago-presencial";
import {
  actualizarCita,
  cambiarEstadoCita,
  crearCita,
  eliminarCita,
  getCitas,
  getMovimientosPagoCita,
  getResumenPagoCita,
  registrarPagoPresencial,
} from "./citas.functions";
import type {
  ActualizarCitaInput,
  CambiarEstadoCitaInput,
  CitaResumenPagoRow,
  CitaRow,
  EliminarCitaInput,
  EstadoCita,
  NuevaCitaInput,
  PagoCitaRow,
  RegistrarPagoPresencialInput,
} from "./clinica-schemas";

export type { CitaResumenPagoRow, CitaRow, EstadoCita, PagoCitaRow };

export const citasQueryKey = () => claveActiva("citas-propias");

export const citasQuery = () =>
  queryOptions({ queryKey: citasQueryKey(), queryFn: () => getCitas() });

export function useCitas() {
  return useSuspenseQuery(citasQuery());
}

export function useCrearCita() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NuevaCitaInput) => crearCita({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: citasQueryKey() });
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
      queryClient.invalidateQueries({ queryKey: citasQueryKey() });
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
      queryClient.invalidateQueries({ queryKey: citasQueryKey() });
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
      queryClient.invalidateQueries({ queryKey: citasQueryKey() });
      toast.success("Cita eliminada.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "No se pudo eliminar la cita.");
    },
  });
}

// --- Cobro de citas (Día 22B) --------------------------------------------
// Regla de oro: `total_pagado` / `saldo_pendiente` se leen tal cual de
// `citas_resumen_pago`, nunca se recalculan sumando `pagos_cita` en cliente.

export const resumenPagoCitaQueryKey = (citaId: string) => claveActiva("cita-resumen-pago", citaId);

export const resumenPagoCitaQuery = (citaId: string) =>
  queryOptions({
    queryKey: resumenPagoCitaQueryKey(citaId),
    queryFn: () => getResumenPagoCita({ data: { citaId } }),
    enabled: Boolean(citaId),
  });

export function useResumenPagoCita(citaId: string) {
  return useQuery(resumenPagoCitaQuery(citaId));
}

export const movimientosPagoCitaQueryKey = (citaId: string) =>
  claveActiva("cita-movimientos-pago", citaId);

export function useMovimientosPagoCita(citaId: string) {
  return useQuery({
    queryKey: movimientosPagoCitaQueryKey(citaId),
    queryFn: () => getMovimientosPagoCita({ data: { citaId } }),
    enabled: Boolean(citaId),
  });
}

/**
 * La RPC nunca lanza excepción de negocio: siempre resuelve con
 * `{ ok, error_codigo, error_mensaje, pago_id, estado_pago }`. El llamador
 * decide qué hacer con `ok === false` (mostrar el mensaje fijo de `error_codigo`); esta
 * mutation solo propaga errores reales de red/infraestructura via onError.
 */
export function useRegistrarPagoPresencial(citaId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RegistrarPagoPresencialInput) => registrarPagoPresencial({ data: input }),
    onSuccess: (resultado) => {
      if (!resultado.ok) {
        // Texto fijo por código (R6): nunca se muestra `error_mensaje` crudo.
        toast.error(mensajePagoPresencial(resultado.error_codigo));
        return;
      }
      queryClient.invalidateQueries({ queryKey: resumenPagoCitaQueryKey(citaId) });
      queryClient.invalidateQueries({ queryKey: movimientosPagoCitaQueryKey(citaId) });
      queryClient.invalidateQueries({ queryKey: citasQueryKey() });
      toast.success("Cobro registrado correctamente.");
    },
    onError: (error: Error) => {
      // El servidor ya lanza un texto fijo; no se hace eco de otros errores.
      toast.error(MENSAJE_PAGO_GENERICO);
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
