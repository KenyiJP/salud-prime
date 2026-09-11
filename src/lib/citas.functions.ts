import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  actualizarCitaSchema,
  cambiarEstadoCitaSchema,
  eliminarCitaSchema,
  nuevaCitaSchema,
  type CitaRow,
} from "./clinica-schemas";

const SELECT_CITA =
  "*, pacientes(id, nombres, apellidos, documento_identidad), tipos_consulta(id, nombre, duracion_minutos)";

export const getCitas = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { resolveMedicoContext } = await import("./clinica-tenant.server");
    const { medicoId } = await resolveMedicoContext(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("citas")
      .select(SELECT_CITA)
      .eq("medico_id", medicoId)
      .order("fecha_hora");
    if (error) throw new Error(error.message);
    return (data ?? []) as CitaRow[];
  });

export const crearCita = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(nuevaCitaSchema.parse)
  .handler(async ({ context, data }) => {
    const { resolveMedicoContext } = await import("./clinica-tenant.server");
    const { medicoId, tenantId } = await resolveMedicoContext(
      context.supabase,
      context.userId,
    );

    // RLS on `citas` only checks tenant membership, not that paciente_id
    // belongs to this médico — verify ownership here.
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
        tenant_id: tenantId,
        medico_id: medicoId,
        paciente_id: data.paciente_id,
        fecha_hora: new Date(data.fecha_hora).toISOString(),
        motivo: data.motivo || null,
        tipo_consulta_id: data.tipo_consulta_id || null,
      })
      .select(SELECT_CITA)
      .single();
    if (error) throw new Error(error.message);
    return row as CitaRow;
  });

export const actualizarCita = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(actualizarCitaSchema.parse)
  .handler(async ({ context, data }) => {
    const { resolveMedicoContext } = await import("./clinica-tenant.server");
    const { medicoId } = await resolveMedicoContext(context.supabase, context.userId);

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
      .update({
        paciente_id: data.paciente_id,
        fecha_hora: new Date(data.fecha_hora).toISOString(),
        motivo: data.motivo || null,
        tipo_consulta_id: data.tipo_consulta_id || null,
        ...(data.estado ? { estado: data.estado } : {}),
      })
      .eq("id", data.id)
      .eq("medico_id", medicoId)
      .select(SELECT_CITA)
      .single();
    if (error) throw new Error(error.message);
    return row as CitaRow;
  });

export const cambiarEstadoCita = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(cambiarEstadoCitaSchema.parse)
  .handler(async ({ context, data }) => {
    const { resolveMedicoContext } = await import("./clinica-tenant.server");
    const { medicoId } = await resolveMedicoContext(context.supabase, context.userId);
    const { data: row, error } = await context.supabase
      .from("citas")
      .update({ estado: data.estado })
      .eq("id", data.id)
      .eq("medico_id", medicoId)
      .select(SELECT_CITA)
      .single();
    if (error) throw new Error(error.message);
    return row as CitaRow;
  });

export const eliminarCita = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(eliminarCitaSchema.parse)
  .handler(async ({ context, data }) => {
    const { resolveMedicoContext } = await import("./clinica-tenant.server");
    const { medicoId } = await resolveMedicoContext(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("citas")
      .delete()
      .eq("id", data.id)
      .eq("medico_id", medicoId);
    if (error) throw new Error(error.message);
    return { id: data.id };
  });
