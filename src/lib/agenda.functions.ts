import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  eliminarBloqueoSchema,
  nuevoBloqueoSchema,
  nuevoHorarioSchema,
  toggleHorarioSchema,
  type BloqueoHorarioRow,
  type HorarioAtencionRow,
  type TipoConsultaRow,
} from "./agenda-schemas";

export const getTiposConsulta = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { resolveMedicoContext } = await import("./clinica-tenant.server");
    const { tenantId } = await resolveMedicoContext(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("tipos_consulta")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("activo", true)
      .order("nombre");
    if (error) throw new Error(error.message);
    return (data ?? []) as TipoConsultaRow[];
  });

export const getHorarios = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { resolveMedicoContext } = await import("./clinica-tenant.server");
    const { medicoId } = await resolveMedicoContext(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("horarios_atencion")
      .select("*")
      .eq("medico_id", medicoId)
      .order("dia_semana")
      .order("hora_inicio");
    if (error) throw new Error(error.message);
    return (data ?? []) as HorarioAtencionRow[];
  });

export const crearHorario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(nuevoHorarioSchema.parse)
  .handler(async ({ context, data }) => {
    const { resolveMedicoContext } = await import("./clinica-tenant.server");
    const { medicoId, tenantId } = await resolveMedicoContext(
      context.supabase,
      context.userId,
    );
    const { data: row, error } = await context.supabase
      .from("horarios_atencion")
      .insert({
        tenant_id: tenantId,
        medico_id: medicoId,
        dia_semana: data.dia_semana,
        hora_inicio: data.hora_inicio,
        hora_fin: data.hora_fin,
        duracion_slot_minutos: data.duracion_slot_minutos,
        activo: true,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row as HorarioAtencionRow;
  });

export const toggleHorario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(toggleHorarioSchema.parse)
  .handler(async ({ context, data }) => {
    const { resolveMedicoContext } = await import("./clinica-tenant.server");
    const { medicoId } = await resolveMedicoContext(context.supabase, context.userId);
    const { data: row, error } = await context.supabase
      .from("horarios_atencion")
      .update({ activo: data.activo })
      .eq("id", data.id)
      .eq("medico_id", medicoId)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row as HorarioAtencionRow;
  });

export const getBloqueos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { resolveMedicoContext } = await import("./clinica-tenant.server");
    const { medicoId } = await resolveMedicoContext(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("bloqueos_horario")
      .select("*")
      .eq("medico_id", medicoId)
      .order("fecha_inicio");
    if (error) throw new Error(error.message);
    return (data ?? []) as BloqueoHorarioRow[];
  });

export const crearBloqueo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(nuevoBloqueoSchema.parse)
  .handler(async ({ context, data }) => {
    const { resolveMedicoContext } = await import("./clinica-tenant.server");
    const { medicoId, tenantId } = await resolveMedicoContext(
      context.supabase,
      context.userId,
    );
    const { data: row, error } = await context.supabase
      .from("bloqueos_horario")
      .insert({
        tenant_id: tenantId,
        medico_id: medicoId,
        fecha_inicio: new Date(data.fecha_inicio).toISOString(),
        fecha_fin: new Date(data.fecha_fin).toISOString(),
        motivo: data.motivo || null,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row as BloqueoHorarioRow;
  });

export const eliminarBloqueo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(eliminarBloqueoSchema.parse)
  .handler(async ({ context, data }) => {
    const { resolveMedicoContext } = await import("./clinica-tenant.server");
    const { medicoId } = await resolveMedicoContext(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("bloqueos_horario")
      .delete()
      .eq("id", data.id)
      .eq("medico_id", medicoId);
    if (error) throw new Error(error.message);
    return { id: data.id };
  });
