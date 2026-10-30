import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Lecturas de solo consulta para la pantalla de cobranza (Día 29, Etapa 3).
 * Todo pasa por RLS/vistas de la base: facturación ve pagos, citas y datos de
 * facturación del paciente, nunca historia clínica ni recetas. Se consulta desde el
 * cliente autenticado (sin `service_role`), así la base sigue siendo la barrera real.
 */

export type CobroCita = {
  cita_id: string;
  fecha_hora: string;
  estado_pago_reserva: string | null;
  monto_esperado: number | null;
  total_pagado: number;
  saldo_pendiente: number;
  pago_obligatorio: boolean;
  ultimo_pago_en: string | null;
};

export type PacienteFacturacion = {
  id: string;
  nombres: string;
  apellidos: string;
  tipo_documento: string | null;
  documento_identidad: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
};

type Consulta = {
  select: (c: string) => Consulta;
  order: (c: string, o: { ascending: boolean }) => Consulta;
  limit: (n: number) => PromiseLike<{ data: unknown[] | null; error: unknown }>;
};
type Cliente = { from: (t: string) => Consulta };

// La vista `pacientes_facturacion` no está en los tipos generados: único cast permitido.
const db = supabase as unknown as Cliente;

export function useCobrosCitasQuery() {
  return useQuery({
    queryKey: ["cobranza", "cobros"],
    queryFn: async (): Promise<CobroCita[]> => {
      const { data, error } = await db
        .from("citas_resumen_pago")
        .select(
          "cita_id, fecha_hora, estado_pago_reserva, monto_esperado, total_pagado, saldo_pendiente, pago_obligatorio, ultimo_pago_en",
        )
        .order("fecha_hora", { ascending: false })
        .limit(100);
      if (error) throw new Error("No se pudieron cargar los cobros.");
      return (data ?? []) as CobroCita[];
    },
  });
}

export function usePacientesFacturacionQuery() {
  return useQuery({
    queryKey: ["cobranza", "pacientes"],
    queryFn: async (): Promise<PacienteFacturacion[]> => {
      const { data, error } = await db
        .from("pacientes_facturacion")
        .select("id, nombres, apellidos, tipo_documento, documento_identidad, telefono, email, direccion")
        .order("apellidos", { ascending: true })
        .limit(200);
      if (error) throw new Error("No se pudieron cargar los datos de facturación.");
      return (data ?? []) as PacienteFacturacion[];
    },
  });
}
