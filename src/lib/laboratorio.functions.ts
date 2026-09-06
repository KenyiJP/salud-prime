import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  cambiarEstadoOrdenSchema,
  nuevaOrdenSchema,
  ordenPorIdSchema,
  ordenesPacienteSchema,
  type MedicoActual,
  type OrdenLaboratorio,
} from "./laboratorio-schemas";
import type { PacienteRow } from "./clinica-schemas";

// The generated Supabase types do not include the laboratory tables yet, so
// queries go through an untyped view of the same authenticated client (RLS
// still applies as the signed-in user).
const untyped = (client: unknown) => client as SupabaseClient<any>;

const SELECT_ORDEN =
  "id, paciente_id, medico_id, fecha_orden, estado, diagnostico_presuntivo, observaciones, orden_laboratorio_examenes(orden, examen_id, examenes_laboratorio(nombre_display))";

type FilaDetalle = {
  orden: number;
  examen_id: string;
  examenes_laboratorio: { nombre_display: string } | null;
};

function normalizarOrden(row: any): OrdenLaboratorio {
  const detalle = (row.orden_laboratorio_examenes ?? []) as FilaDetalle[];
  return {
    id: row.id,
    paciente_id: row.paciente_id,
    medico_id: row.medico_id,
    fecha_orden: row.fecha_orden,
    estado: row.estado,
    diagnostico_presuntivo: row.diagnostico_presuntivo,
    observaciones: row.observaciones,
    examenes: detalle
      .slice()
      .sort((a, b) => a.orden - b.orden)
      .map((d) => ({
        orden: d.orden,
        examen_id: d.examen_id,
        nombre_display: d.examenes_laboratorio?.nombre_display ?? "Examen",
      })),
  };
}

export const getMedicoActual = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { resolveMedicoContext } = await import("./clinica-tenant.server");
    const { medicoId } = await resolveMedicoContext(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("medicos")
      .select("id, nombres, apellidos, cmp, rne, especialidad")
      .eq("id", medicoId)
      .single();
    if (error) throw new Error(error.message);
    return data as MedicoActual;
  });

export const getOrdenesPaciente = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(ordenesPacienteSchema.parse)
  .handler(async ({ context, data }) => {
    const { resolveMedicoContext } = await import("./clinica-tenant.server");
    const { medicoId } = await resolveMedicoContext(context.supabase, context.userId);
    const { data: rows, error } = await untyped(context.supabase)
      .from("ordenes_laboratorio")
      .select(SELECT_ORDEN)
      .eq("medico_id", medicoId)
      .eq("paciente_id", data.paciente_id)
      .order("fecha_orden", { ascending: false });
    if (error) throw new Error(error.message);
    return (rows ?? []).map(normalizarOrden);
  });

export const crearOrdenLaboratorio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(nuevaOrdenSchema.parse)
  .handler(async ({ context, data }) => {
    const { resolveMedicoContext } = await import("./clinica-tenant.server");
    const { medicoId, tenantId } = await resolveMedicoContext(
      context.supabase,
      context.userId,
    );

    // RLS only checks tenant membership, so ownership of the paciente is
    // verified here before writing anything.
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

    const db = untyped(context.supabase);
    const { data: cabecera, error } = await db
      .from("ordenes_laboratorio")
      .insert({
        tenant_id: tenantId,
        medico_id: medicoId,
        paciente_id: data.paciente_id,
        diagnostico_presuntivo: data.diagnostico_presuntivo || null,
        observaciones: data.observaciones || null,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    const renglones = data.examen_ids.map((examen_id, i) => ({
      tenant_id: tenantId,
      orden_id: cabecera.id,
      examen_id,
      orden: i + 1,
    }));

    const { error: detalleError } = await db
      .from("orden_laboratorio_examenes")
      .insert(renglones);
    if (detalleError) {
      // Never leave an orphan header behind.
      await db.from("ordenes_laboratorio").delete().eq("id", cabecera.id);
      throw new Error(
        `No se pudieron guardar los exámenes de la orden: ${detalleError.message}`,
      );
    }

    return { id: cabecera.id as string };
  });

export const cambiarEstadoOrden = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(cambiarEstadoOrdenSchema.parse)
  .handler(async ({ context, data }) => {
    const { resolveMedicoContext } = await import("./clinica-tenant.server");
    const { medicoId } = await resolveMedicoContext(context.supabase, context.userId);
    const { data: row, error } = await untyped(context.supabase)
      .from("ordenes_laboratorio")
      .update({ estado: data.estado })
      .eq("id", data.id)
      .eq("medico_id", medicoId)
      .select(SELECT_ORDEN)
      .single();
    if (error) throw new Error(error.message);
    return normalizarOrden(row);
  });

export const getOrdenParaImprimir = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(ordenPorIdSchema.parse)
  .handler(async ({ context, data }) => {
    const { resolveMedicoContext } = await import("./clinica-tenant.server");
    const { medicoId } = await resolveMedicoContext(context.supabase, context.userId);

    const { data: row, error } = await untyped(context.supabase)
      .from("ordenes_laboratorio")
      .select(SELECT_ORDEN)
      .eq("id", data.id)
      .eq("medico_id", medicoId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("La orden no existe o no pertenece a tu consultorio.");

    const orden = normalizarOrden(row);

    const { data: paciente, error: pacienteError } = await context.supabase
      .from("pacientes")
      .select("*")
      .eq("id", orden.paciente_id)
      .single();
    if (pacienteError) throw new Error(pacienteError.message);

    const { data: medico, error: medicoError } = await context.supabase
      .from("medicos")
      .select("id, nombres, apellidos, cmp, rne, especialidad")
      .eq("id", medicoId)
      .single();
    if (medicoError) throw new Error(medicoError.message);

    return {
      orden,
      paciente: paciente as PacienteRow,
      medico: medico as MedicoActual,
    };
  });
