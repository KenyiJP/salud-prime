import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  mensajeErrorSeguimiento,
  seguimientoPlanSchema,
  type EstadoHitoSeguimiento,
  type SeguimientoPlanInput,
  type TipoHitoSeguimiento,
} from "./seguimiento-cronico-schemas";

export interface SeguimientoHito {
  id: string;
  tenant_id: string;
  seguimiento_id: string;
  tipo: TipoHitoSeguimiento;
  descripcion_control: string | null;
  fecha_programada: string;
  estado: EstadoHitoSeguimiento;
  cita_id: string;
  creado_at: string;
}

export interface SeguimientoPlan {
  id: string;
  tenant_id: string;
  medico_id: string;
  paciente_id: string;
  atencion_origen_id: string | null;
  tipo_consulta_id: string | null;
  condicion: string;
  notas_adherencia: string | null;
  periodicidad_dias: number;
  proxima_fecha: string;
  activo: boolean;
  creado_at: string;
  seguimiento_hitos?: SeguimientoHito[];
}

export interface TipoConsultaSeguimiento {
  id: string;
  nombre: string;
  duracion_minutos: number;
  precio_consulta: number | null;
  requiere_pago_adelantado: boolean | null;
}

type ClienteRpc = {
  rpc: (nombre: string, args: object) => PromiseLike<{ data: unknown; error: unknown }>;
};

export const seguimientosPacienteKey = (pacienteId: string) =>
  ["seguimientos-paciente", pacienteId] as const;

export function useSeguimientosPaciente(pacienteId: string | null | undefined) {
  return useQuery({
    queryKey: seguimientosPacienteKey(pacienteId ?? "none"),
    enabled: Boolean(pacienteId),
    queryFn: async () => {
      const { data, error } = await (supabase as unknown as {
        from: (t: string) => {
          select: (q: string) => {
            eq: (c: string, v: string) => {
              order: (c2: string, o: { ascending: boolean }) => PromiseLike<{
                data: unknown;
                error: unknown;
              }>;
            };
          };
        };
      })
        .from("seguimientos_cronicos")
        .select("*, seguimiento_hitos(*)")
        .eq("paciente_id", pacienteId!)
        .order("creado_at", { ascending: false });

      if (error) {
        throw new Error("No se pudieron cargar los planes de seguimiento.");
      }
      return (data ?? []) as SeguimientoPlan[];
    },
  });
}

export function useTiposConsultaSeguimiento() {
  return useQuery({
    queryKey: ["tipos-consulta-seguimiento"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tipos_consulta")
        .select("id, nombre, duracion_minutos, precio_consulta, requiere_pago_adelantado")
        .eq("activo", true)
        .order("nombre", { ascending: true });
      if (error) return [] as TipoConsultaSeguimiento[];
      return (data ?? []) as TipoConsultaSeguimiento[];
    },
  });
}

export function useCrearSeguimientoPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rawInput: SeguimientoPlanInput) => {
      const parsed = seguimientoPlanSchema.safeParse(rawInput);
      if (!parsed.success) {
        const primerMensaje = parsed.error.issues[0]?.message ?? "Datos de seguimiento inválidos.";
        throw new Error(primerMensaje);
      }
      const input = parsed.data;

      const { data, error } = await (supabase as unknown as ClienteRpc).rpc(
        "seguimiento_crear_plan",
        {
          p_paciente_id: input.paciente_id,
          p_condicion: input.condicion,
          p_periodicidad_dias: input.periodicidad_dias,
          p_proxima_fecha: input.proxima_fecha,
          p_tipo_consulta_id: input.tipo_consulta_id || null,
          p_tipo_hito: input.tipo_hito ?? "control_medico",
          p_notas_adherencia: input.notas_adherencia || null,
          p_atencion_origen_id: input.atencion_origen_id || null,
        },
      );

      if (error) {
        throw new Error(mensajeErrorSeguimiento());
      }

      const resultado = data as {
        ok?: boolean;
        codigo?: string;
        seguimiento_id?: string;
        hito_id?: string;
        cita_id?: string;
      } | null;

      if (!resultado?.ok) {
        throw new Error(mensajeErrorSeguimiento(resultado?.codigo));
      }

      return resultado;
    },
    onSuccess: (_res, vars) => {
      queryClient.invalidateQueries({ queryKey: seguimientosPacienteKey(vars.paciente_id) });
      queryClient.invalidateQueries({ queryKey: ["citas"] });
      toast.success("Plan de seguimiento crónico y cita de control programados.");
    },
  });
}

export function useCambiarEstadoPlan(pacienteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ seguimientoId, activo }: { seguimientoId: string; activo: boolean }) => {
      const { data, error } = await (supabase as unknown as ClienteRpc).rpc(
        "seguimiento_cambiar_estado_plan",
        {
          p_seguimiento_id: seguimientoId,
          p_activo: activo,
        },
      );
      if (error) throw new Error(mensajeErrorSeguimiento());
      const res = data as { ok?: boolean; codigo?: string } | null;
      if (!res?.ok) throw new Error(mensajeErrorSeguimiento(res?.codigo));
      return res;
    },
    onSuccess: (_res, vars) => {
      queryClient.invalidateQueries({ queryKey: seguimientosPacienteKey(pacienteId) });
      toast.success(vars.activo ? "Plan de seguimiento reactivado." : "Plan de seguimiento en pausa.");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useActualizarHitoSeguimiento(pacienteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      hitoId,
      nuevoEstado,
    }: {
      hitoId: string;
      nuevoEstado: "completado" | "cancelado";
    }) => {
      const { data, error } = await (supabase as unknown as ClienteRpc).rpc(
        "seguimiento_actualizar_hito",
        {
          p_hito_id: hitoId,
          p_nuevo_estado: nuevoEstado,
        },
      );
      if (error) throw new Error(mensajeErrorSeguimiento());
      const res = data as { ok?: boolean; codigo?: string; siguiente_hito_id?: string | null } | null;
      if (!res?.ok) throw new Error(mensajeErrorSeguimiento(res?.codigo));
      return res;
    },
    onSuccess: (res, vars) => {
      queryClient.invalidateQueries({ queryKey: seguimientosPacienteKey(pacienteId) });
      queryClient.invalidateQueries({ queryKey: ["citas"] });
      if (vars.nuevoEstado === "completado") {
        toast.success(
          res?.siguiente_hito_id
            ? "Control completado y siguiente cita periódica agendada automáticamente."
            : "Control marcado como completado.",
        );
      } else {
        toast.success("Control cancelado.");
      }
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}
