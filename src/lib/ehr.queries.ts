import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  anularAtencion,
  crearAdenda,
  firmarAtencion,
  getAtencion,
  getAtencionPorToken,
  getAtencionesPaciente,
  getMedicoEhr,
  getPlantillas,
  guardarBorradorAtencion,
} from "./ehr.functions";
import type { AnularAtencionInput, AtencionInput, NuevaAdendaInput } from "./ehr-schemas";

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

export function useAtencionImpresion(id: string, token?: string) {
  return useQuery({
    queryKey: ["atencion-imprimir", id, token ?? "sesion"],
    retry: false,
    queryFn: async () => {
      try {
        if (token) return await getAtencionPorToken({ data: { id, token } });
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          return {
            errorAcceso:
              "Para ver este informe necesitas abrir el enlace del código QR o ingresar con tu cuenta.",
          } as const;
        }
        return await getAtencion({ data: { id } });
      } catch (error) {
        const mensaje = (error as Error)?.message ?? "";
        return {
          errorAcceso: /authorization|unauthorized|401/i.test(mensaje)
            ? "Para ver este informe necesitas abrir el enlace del código QR o ingresar con tu cuenta."
            : mensaje || "No se pudo cargar el informe.",
        } as const;
      }
    },
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

export function useAnularAtencion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AnularAtencionInput) => anularAtencion({ data: input }),
    onSuccess: (row) => {
      queryClient.invalidateQueries({ queryKey: atencionesPacienteKey(row.paciente_id) });
      queryClient.invalidateQueries({ queryKey: atencionKey(row.id) });
      toast.success("Atención anulada y conservada para auditoría.");
    },
    onError: (error: Error) =>
      toast.error(error.message || "No se pudo anular la atención."),
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
