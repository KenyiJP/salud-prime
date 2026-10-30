import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  actualizarTipoConsultaSchema,
  eliminarBloqueoSchema,
  nuevoBloqueoSchema,
  nuevoHorarioSchema,
  nuevoTipoConsultaSchema,
  toggleHorarioSchema,
  toggleTipoConsultaSchema,
  type BloqueoHorarioRow,
  type HorarioAtencionRow,
  type TipoConsultaRow,
} from "./agenda-schemas";

// Lista completa (activos e inactivos): el panel de gestión necesita mostrar
// también los desactivados para poder reactivarlos. `getTiposConsulta` (solo
// activos) sigue existiendo para los consumidores que arman formularios de
// citas, donde no tiene sentido ofrecer un tipo apagado.
export const getTiposConsultaAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { resolveContextoConsultorio } = await import("./clinica-tenant.server");
    const { tenantId } = await resolveContextoConsultorio(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("tipos_consulta")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("nombre");
    if (error) throw new Error(error.message);
    return (data ?? []) as TipoConsultaRow[];
  });

export const getTiposConsulta = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { resolveContextoConsultorio } = await import("./clinica-tenant.server");
    const { tenantId } = await resolveContextoConsultorio(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("tipos_consulta")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("activo", true)
      .order("nombre");
    if (error) throw new Error(error.message);
    return (data ?? []) as TipoConsultaRow[];
  });

export const crearTipoConsulta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(nuevoTipoConsultaSchema.parse)
  .handler(async ({ context, data }) => {
    const { resolveMedicoTitular } = await import("./clinica-tenant.server");
    const { tenantId } = await resolveMedicoTitular(context.supabase, context.userId);
    const { data: row, error } = await context.supabase
      .from("tipos_consulta")
      .insert({
        tenant_id: tenantId,
        nombre: data.nombre,
        duracion_minutos: data.duracion_minutos,
        precio_consulta: data.precio_consulta,
        requiere_pago_adelantado: data.requiere_pago_adelantado,
        porcentaje_adelanto: data.porcentaje_adelanto,
        activo: true,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row as TipoConsultaRow;
  });

export const actualizarTipoConsulta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(actualizarTipoConsultaSchema.parse)
  .handler(async ({ context, data }) => {
    const { resolveMedicoTitular } = await import("./clinica-tenant.server");
    const { tenantId } = await resolveMedicoTitular(context.supabase, context.userId);
    const { data: row, error } = await context.supabase
      .from("tipos_consulta")
      .update({
        nombre: data.nombre,
        duracion_minutos: data.duracion_minutos,
        precio_consulta: data.precio_consulta,
        requiere_pago_adelantado: data.requiere_pago_adelantado,
        porcentaje_adelanto: data.porcentaje_adelanto,
      })
      .eq("id", data.id)
      .eq("tenant_id", tenantId)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row as TipoConsultaRow;
  });

// Sin DELETE: `citas.tipo_consulta_id` puede referenciar filas históricas
// (Día 18). Desactivar retira el tipo de los formularios sin romper citas
// ya agendadas ni el historial clínico.
export const toggleTipoConsulta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(toggleTipoConsultaSchema.parse)
  .handler(async ({ context, data }) => {
    const { resolveMedicoTitular } = await import("./clinica-tenant.server");
    const { tenantId } = await resolveMedicoTitular(context.supabase, context.userId);
    const { data: row, error } = await context.supabase
      .from("tipos_consulta")
      .update({ activo: data.activo })
      .eq("id", data.id)
      .eq("tenant_id", tenantId)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row as TipoConsultaRow;
  });

export const getHorarios = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { resolveContextoConsultorio } = await import("./clinica-tenant.server");
    const { medicoId } = await resolveContextoConsultorio(context.supabase, context.userId);
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
    const { resolveMedicoTitular } = await import("./clinica-tenant.server");
    const { medicoId, tenantId } = await resolveMedicoTitular(context.supabase, context.userId);
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
    const { resolveMedicoTitular } = await import("./clinica-tenant.server");
    const { medicoId } = await resolveMedicoTitular(context.supabase, context.userId);
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
    const { resolveContextoConsultorio } = await import("./clinica-tenant.server");
    const { medicoId } = await resolveContextoConsultorio(context.supabase, context.userId);
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
    const { resolveContextoConsultorio } = await import("./clinica-tenant.server");
    const { medicoId, tenantId } = await resolveContextoConsultorio(context.supabase, context.userId);
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
    const { resolveContextoConsultorio } = await import("./clinica-tenant.server");
    const { medicoId } = await resolveContextoConsultorio(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("bloqueos_horario")
      .delete()
      .eq("id", data.id)
      .eq("medico_id", medicoId);
    if (error) throw new Error(error.message);
    return { id: data.id };
  });
