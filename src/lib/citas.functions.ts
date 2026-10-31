import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  actualizarCitaSchema,
  cambiarEstadoCitaSchema,
  eliminarCitaSchema,
  nuevaCitaSchema,
  registrarPagoPresencialSchema,
  type CitaResumenPagoRow,
  type CitaRow,
  type PagoCitaRow,
} from "./clinica-schemas";

const SELECT_CITA =
  "*, pacientes(id, nombres, apellidos, documento_identidad), tipos_consulta(id, nombre, duracion_minutos)";

export const getCitas = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { resolveContextoConsultorio } = await import("./clinica-tenant.server");
    const { medicoId } = await resolveContextoConsultorio(context.supabase, context.userId);
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
    const { resolveContextoConsultorio } = await import("./clinica-tenant.server");
    const { medicoId, tenantId } = await resolveContextoConsultorio(context.supabase, context.userId);

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
    const { resolveContextoConsultorio } = await import("./clinica-tenant.server");
    const { medicoId } = await resolveContextoConsultorio(context.supabase, context.userId);

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
    const { resolveContextoConsultorio } = await import("./clinica-tenant.server");
    const { medicoId } = await resolveContextoConsultorio(context.supabase, context.userId);
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
    const { resolveMedicoTitular, citaTieneRegistros } = await import("./clinica-tenant.server");
    const { medicoId } = await resolveMedicoTitular(context.supabase, context.userId);
    // Borrar arrastraría pagos (CASCADE) y desvincularía la atención: se exige cancelar en su lugar.
    if (await citaTieneRegistros(context.supabase, data.id)) {
      throw new Error("Esta cita tiene pagos, atención u otros registros y no se puede eliminar. Cámbiala a «cancelada».");
    }
    const { data: borradas, error } = await context.supabase
      .from("citas")
      .delete()
      .eq("id", data.id)
      .eq("medico_id", medicoId)
      .select("id");
    if (error) throw new Error("No se pudo eliminar la cita.");
    if (!borradas || borradas.length === 0) throw new Error("No se encontró la cita o no tienes permiso para eliminarla.");
    return { id: data.id };
  });

// Regla de oro financiera: el frontend jamás suma/resta montos de pagos por
// su cuenta. `citas_resumen_pago` (security_invoker, hereda RLS de `citas`)
// es la única fuente de `total_pagado` / `saldo_pendiente`.
export const getResumenPagoCita = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ citaId: z.string().uuid() }).parse)
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase
      .from("citas_resumen_pago")
      .select("*")
      .eq("cita_id", data.citaId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row as CitaResumenPagoRow | null;
  });

export const getMovimientosPagoCita = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ citaId: z.string().uuid() }).parse)
  .handler(async ({ context, data }) => {
    const { data: rows, error } = await context.supabase
      .from("pagos_cita")
      .select("*")
      .eq("cita_id", data.citaId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (rows ?? []) as PagoCitaRow[];
  });

// La RPC es SECURITY DEFINER y nunca lanza RAISE: siempre responde
// `{ ok, error_codigo, error_mensaje, pago_id, estado_pago }`. Un `ok: false`
// NO es una excepción de red — es una regla de negocio rechazada
// (método/concepto/monto inválido, cita ajena) que la UI traduce a un mensaje
// fijo según `error_codigo` (ver `pago-presencial.ts`); `error_mensaje` crudo
// solo viaja como respaldo y no se muestra si el código es conocido.
export const registrarPagoPresencial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(registrarPagoPresencialSchema.parse)
  .handler(async ({ context, data }) => {
    const { data: rows, error } = await context.supabase.rpc("registrar_pago_presencial_cita", {
      p_cita_id: data.cita_id,
      p_monto: data.monto,
      p_metodo: data.metodo,
      p_concepto: data.concepto,
      p_nota: data.nota || undefined,
    });
    if (error) throw new Error("No se pudo registrar el cobro. Inténtalo de nuevo.");
    const resultado = rows?.[0];
    if (!resultado) throw new Error("No se pudo registrar el cobro. Inténtalo de nuevo.");
    return resultado;
  });
