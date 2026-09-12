import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  cambiarEstadoRecetaSchema,
  nuevaRecetaSchema,
  recetaPorIdSchema,
  recetaPublicaSchema,
  recetasPacienteSchema,
  type MedicoActualReceta,
  type RecetaConDetalle,
} from "./recetas-schemas";
import type { PacienteRow } from "./clinica-schemas";

const untyped = (client: unknown) => client as SupabaseClient<any>;

const SELECT_RECETA =
  "id, paciente_id, medico_id, cita_id, atencion_id, fecha_emision, vigencia_dias, diagnostico_presuntivo, observaciones, estado, motivo_anulacion, receta_medicamentos(id, medicamento_id, descripcion_libre, dosis, via_administracion_id, frecuencia, duracion, cantidad, indicaciones, orden, medicamentos(nombre), vias_administracion(nombre))";

type FilaDetalle = {
  id: string;
  medicamento_id: string | null;
  descripcion_libre: string | null;
  dosis: string | null;
  via_administracion_id: number | null;
  frecuencia: string | null;
  duracion: string | null;
  cantidad: string | null;
  indicaciones: string | null;
  orden: number;
  medicamentos: { nombre: string } | null;
  vias_administracion: { nombre: string } | null;
};

function normalizarReceta(row: any): RecetaConDetalle {
  const detalle = (row.receta_medicamentos ?? []) as FilaDetalle[];
  return {
    id: row.id,
    paciente_id: row.paciente_id,
    medico_id: row.medico_id,
    cita_id: row.cita_id ?? null,
    atencion_id: row.atencion_id ?? null,
    fecha_emision: row.fecha_emision,
    vigencia_dias: row.vigencia_dias,
    diagnostico_presuntivo: row.diagnostico_presuntivo,
    observaciones: row.observaciones,
    estado: row.estado,
    motivo_anulacion: row.motivo_anulacion,
    medicamentos: detalle
      .slice()
      .sort((a, b) => a.orden - b.orden)
      .map((d) => ({
        id: d.id,
        medicamento_id: d.medicamento_id,
        descripcion_libre: d.descripcion_libre,
        nombre_display: d.medicamentos?.nombre ?? d.descripcion_libre ?? "Medicamento",
        dosis: d.dosis,
        via_administracion: d.vias_administracion?.nombre ?? null,
        frecuencia: d.frecuencia,
        duracion: d.duracion,
        cantidad: d.cantidad,
        indicaciones: d.indicaciones,
        orden: d.orden,
      })),
  };
}

export const getMedicoActualReceta = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { resolveMedicoContext } = await import("./clinica-tenant.server");
    const { medicoId } = await resolveMedicoContext(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("medicos")
      .select("id, nombres, apellidos, cmp, rne, especialidad, firma_url")
      .eq("id", medicoId)
      .single();
    if (error) throw new Error(error.message);
    return data as MedicoActualReceta;
  });

export const getRecetasPaciente = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(recetasPacienteSchema.parse)
  .handler(async ({ context, data }) => {
    const { resolveMedicoContext } = await import("./clinica-tenant.server");
    const { medicoId } = await resolveMedicoContext(context.supabase, context.userId);
    const { data: rows, error } = await untyped(context.supabase)
      .from("recetas")
      .select(SELECT_RECETA)
      .eq("medico_id", medicoId)
      .eq("paciente_id", data.paciente_id)
      .order("fecha_emision", { ascending: false });
    if (error) throw new Error(error.message);
    return (rows ?? []).map(normalizarReceta);
  });

export const crearReceta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(nuevaRecetaSchema.parse)
  .handler(async ({ context, data }) => {
    const { resolveMedicoContext } = await import("./clinica-tenant.server");
    const { medicoId, tenantId } = await resolveMedicoContext(
      context.supabase,
      context.userId,
    );

    // RLS solo verifica el tenant, así que la pertenencia del paciente al
    // médico se comprueba aquí antes de escribir nada.
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

    if (data.atencion_id) {
      const { data: atencion, error: atencionError } = await context.supabase
        .from("atenciones_medicas")
        .select("id")
        .eq("id", data.atencion_id)
        .eq("medico_id", medicoId)
        .eq("paciente_id", data.paciente_id)
        .maybeSingle();
      if (atencionError) throw new Error(atencionError.message);
      if (!atencion) throw new Error("La atención no corresponde al paciente seleccionado.");
    }

    const db = untyped(context.supabase);
    const { data: cabecera, error } = await db
      .from("recetas")
      .insert({
        tenant_id: tenantId,
        medico_id: medicoId,
        paciente_id: data.paciente_id,
        atencion_id: data.atencion_id ?? null,
        cita_id: data.cita_id ?? null,
        diagnostico_presuntivo: data.diagnostico_presuntivo || null,
        observaciones: data.observaciones || null,
        vigencia_dias: data.vigencia_dias,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    const renglones = data.medicamentos.map((m, i) => ({
      tenant_id: tenantId,
      receta_id: cabecera.id,
      medicamento_id: m.medicamento_id ?? null,
      descripcion_libre: m.descripcion_libre || null,
      dosis: m.dosis || null,
      via_administracion_id: m.via_administracion_id ?? null,
      frecuencia: m.frecuencia || null,
      duracion: m.duracion || null,
      cantidad: m.cantidad || null,
      indicaciones: m.indicaciones || null,
      orden: i + 1,
    }));

    const { error: detalleError } = await db
      .from("receta_medicamentos")
      .insert(renglones);
    if (detalleError) {
      await db.from("recetas").update({ estado: "anulada" }).eq("id", cabecera.id);
      throw new Error(
        `No se pudieron guardar los medicamentos de la receta: ${detalleError.message}`,
      );
    }

    return { id: cabecera.id as string };
  });

export const cambiarEstadoReceta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(cambiarEstadoRecetaSchema.parse)
  .handler(async ({ context, data }) => {
    const { resolveMedicoContext } = await import("./clinica-tenant.server");
    const { medicoId } = await resolveMedicoContext(context.supabase, context.userId);
    const { data: row, error } = await untyped(context.supabase)
      .from("recetas")
      .update({
        estado: data.estado,
        motivo_anulacion: data.estado === "anulada" ? data.motivo_anulacion || null : null,
      })
      .eq("id", data.id)
      .eq("medico_id", medicoId)
      .select(SELECT_RECETA)
      .single();
    if (error) throw new Error(error.message);
    return normalizarReceta(row);
  });

export const getRecetaParaImprimir = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(recetaPorIdSchema.parse)
  .handler(async ({ context, data }) => {
    const { resolveMedicoContext } = await import("./clinica-tenant.server");
    const { medicoId } = await resolveMedicoContext(context.supabase, context.userId);

    const { data: row, error } = await untyped(context.supabase)
      .from("recetas")
      .select(SELECT_RECETA)
      .eq("id", data.id)
      .eq("medico_id", medicoId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("La receta no existe o no pertenece a tu consultorio.");

    const receta = normalizarReceta(row);

    const { data: paciente, error: pacienteError } = await context.supabase
      .from("pacientes")
      .select("*")
      .eq("id", receta.paciente_id)
      .single();
    if (pacienteError) throw new Error(pacienteError.message);

    const { data: medico, error: medicoError } = await context.supabase
      .from("medicos")
      .select("id, nombres, apellidos, cmp, rne, especialidad, firma_url")
      .eq("id", medicoId)
      .single();
    if (medicoError) throw new Error(medicoError.message);

    const { crearTokenReceta } = await import("./receta-token.server");

    return {
      receta,
      paciente: paciente as PacienteRow,
      medico: medico as MedicoActualReceta,
      token: await crearTokenReceta(receta.id),
    };
  });

/**
 * Lectura pública SOLO con token firmado: es la puerta por la que la farmacia
 * o el paciente abren la receta desde el QR sin tener cuenta. Solo expone los
 * datos que ya están impresos en el papel.
 */
export const getRecetaPorToken = createServerFn({ method: "POST" })
  .inputValidator(recetaPublicaSchema.parse)
  .handler(async ({ data }) => {
    const { verificarTokenReceta } = await import("./receta-token.server");
    if (!(await verificarTokenReceta(data.id, data.token))) {
      throw new Error("El enlace de la receta no es válido o ya venció.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = untyped(supabaseAdmin);

    const { data: row, error } = await db
      .from("recetas")
      .select(SELECT_RECETA)
      .eq("id", data.id)
      .maybeSingle();
    if (error) {
      if (/permission denied/i.test(error.message)) {
        throw new Error(
          "El acceso por QR todavía no está habilitado en la base de datos (falta el permiso de lectura del rol de servicio sobre las recetas).",
        );
      }
      throw new Error(error.message);
    }
    if (!row) throw new Error("La receta no existe.");

    const receta = normalizarReceta(row);

    const { data: paciente, error: pacienteError } = await db
      .from("pacientes")
      .select("*")
      .eq("id", receta.paciente_id)
      .single();
    if (pacienteError) throw new Error(pacienteError.message);

    const { data: medico, error: medicoError } = await db
      .from("medicos")
      .select("id, nombres, apellidos, cmp, rne, especialidad, firma_url")
      .eq("id", receta.medico_id)
      .single();
    if (medicoError) throw new Error(medicoError.message);

    return {
      receta,
      paciente: paciente as PacienteRow,
      medico: medico as MedicoActualReceta,
      token: data.token,
    };
  });
