import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  cambiarEstadoCitaSchema,
  nuevaCitaSchema,
  type CitaRow,
} from "./clinica-schemas";

export const getCitas = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { resolveMedicoId } = await import("./clinica-tenant.server");
    const medicoId = await resolveMedicoId(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("citas")
      .select("*, pacientes(id, nombre_completo, dni)")
      .eq("medico_id", medicoId)
      .order("fecha_hora");
    if (error) throw new Error(error.message);
    return (data ?? []) as CitaRow[];
  });

export const crearCita = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(nuevaCitaSchema.parse)
  .handler(async ({ context, data }) => {
    const { resolveMedicoId } = await import("./clinica-tenant.server");
    const medicoId = await resolveMedicoId(context.supabase, context.userId);

    // RLS on `citas` only checks medico_id, not that paciente_id belongs to
    // this médico — verify ownership here so a médico can never schedule a
    // cita against another médico's patient.
    const { data: paciente, error: pacienteError } = await context.supabase
      .from("pacientes")
      .select("id")
      .eq("id", data.paciente_id)
      .eq("medico_id", medicoId)
      .maybeSingle();
    if (pacienteError) throw new Error(pacienteError.message);
    if (!paciente) {
      throw new Error("El paciente seleccionado no pertenece a tu consultorio.");
    }

    const { data: row, error } = await context.supabase
      .from("citas")
      .insert({
        medico_id: medicoId,
        paciente_id: data.paciente_id,
        fecha_hora: new Date(data.fecha_hora).toISOString(),
        motivo_consulta: data.motivo_consulta || null,
        monto_pago: data.monto_pago,
      })
      .select("*, pacientes(id, nombre_completo, dni)")
      .single();
    if (error) throw new Error(error.message);
    return row as CitaRow;
  });

export const cambiarEstadoCita = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(cambiarEstadoCitaSchema.parse)
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase
      .from("citas")
      .update({ estado: data.estado })
      .eq("id", data.id)
      .select("*, pacientes(id, nombre_completo, dni)")
      .single();
    if (error) throw new Error(error.message);
    return row as CitaRow;
  });
