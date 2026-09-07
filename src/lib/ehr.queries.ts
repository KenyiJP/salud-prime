import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import {
  crearAdenda,
  firmarAtencion,
  getAtencion,
  getAtencionesPaciente,
  getMedicoEhr,
  getPlantillas,
  guardarBorradorAtencion,
} from "./ehr.functions";
import type { AtencionInput, NuevaAdendaInput } from "./ehr-schemas";

export const medicoEhrQuery = () =>
  queryOptions({ queryKey: ["medico-ehr"], queryFn: () => getMedicoEhr() });

export const plantillasQuery = () =>
  queryOptions({
    queryKey: ["plantillas-especialidad"],
    queryFn: () => getPlantillas(),
    staleTime: 10 * 60 * 1000,
  });

export const atencionesPacienteKey = (pacienteId: string) =>
  ["atenciones", pacienteId] as const;

export function useAtencionesPaciente(pacienteId: string | null) {
  return useQuery({
    queryKey: atencionesPacienteKey(pacienteId ?? "none"),
    queryFn: () => getAtencionesPaciente({ data: { paciente_id: pacienteId! } }),
    enabled: !!pacienteId,
  });
}

export const atencionKey = (id: string) => ["atencion", id] as const;

export function useAtencion(id: string | null) {
  return useQuery({
    queryKey: atencionKey(id ?? "none"),
    queryFn: () => getAtencion({ data: { id: id! } }),
    enabled: !!id,
    retry: false,
  });
}

export function useGuardarBorrador() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AtencionInput) => guardarBorradorAtencion({ data: input }),
    onSuccess: (row) => {
      queryClient.invalidateQueries({
        queryKey: atencionesPacienteKey(row.paciente_id),
      });
      queryClient.invalidateQueries({ queryKey: atencionKey(row.id) });
      toast.success("Borrador de la atención guardado.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "No se pudo guardar la atención.");
    },
  });
}

export function useFirmarAtencion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => firmarAtencion({ data: { id } }),
    onSuccess: (row) => {
      queryClient.invalidateQueries({
        queryKey: atencionesPacienteKey(row.paciente_id),
      });
      queryClient.invalidateQueries({ queryKey: atencionKey(row.id) });
      toast.success("Atención firmada y cerrada legalmente.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "No se pudo firmar la atención.");
    },
  });
}

export function useCrearAdenda() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NuevaAdendaInput) => crearAdenda({ data: input }),
    onSuccess: (row) => {
      queryClient.invalidateQueries({ queryKey: atencionKey(row.atencion_id) });
      toast.success("Adenda agregada a la historia clínica.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "No se pudo agregar la adenda.");
    },
  });
}
