import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  atencionPorIdSchema,
  atencionPublicaSchema,
  atencionSchema,
  atencionesPacienteSchema,
  anularAtencionSchema,
  nuevaAdendaSchema,
  type AdendaRow,
  type AtencionInput,
  type AtencionRow,
  type PlantillaRow,
} from "./ehr-schemas";
import type { PacienteRow } from "./clinica-schemas";
import type { TablesInsert } from "@/integrations/supabase/types";

export type MedicoEhr = {
  id: string;
  nombres: string;
  apellidos: string;
  cmp: string | null;
  rne: string | null;
  especialidad: string | null;
  firma_url: string | null;
};

const SELECT_MEDICO = "id, nombres, apellidos, cmp, rne, especialidad, firma_url";

const SELECT_ORDEN_LAB =
  "id, atencion_id, fecha_orden, estado, diagnostico_presuntivo, observaciones, orden_laboratorio_examenes(orden, examen_id, examenes_laboratorio(nombre_display))";
const SELECT_ORDEN_IMAGEN =
  "id, atencion_id, fecha_orden, estado, diagnostico_presuntivo, indicacion_clinica, observaciones, orden_imagen_estudios(orden, estudio_id, nota, estudios_imagen(nombre_display, modalidad))";

async function cargarComplementosAtencion(db: any, atencion: AtencionRow) {
  const [pacienteRes, medicoRes, adendasRes, plantillaRes, laboratorioRes, imagenRes] =
    await Promise.all([
      db.from("pacientes").select("*").eq("id", atencion.paciente_id).single(),
      db.from("medicos").select(SELECT_MEDICO).eq("id", atencion.medico_id).single(),
      db
        .from("atencion_adendas")
        .select("*")
        .eq("atencion_id", atencion.id)
        .order("created_at", { ascending: true }),
      atencion.plantilla_id
        ? db.from("plantillas_especialidad").select("*").eq("id", atencion.plantilla_id).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      db
        .from("ordenes_laboratorio")
        .select(SELECT_ORDEN_LAB)
        .eq("atencion_id", atencion.id)
        .order("fecha_orden", { ascending: false }),
      db
        .from("ordenes_imagen")
        .select(SELECT_ORDEN_IMAGEN)
        .eq("atencion_id", atencion.id)
        .order("fecha_orden", { ascending: false }),
    ]);

  const fallo = [pacienteRes, medicoRes, adendasRes, plantillaRes, laboratorioRes, imagenRes]
    .map((resultado) => resultado.error)
    .find(Boolean);
  if (fallo) throw new Error(fallo.message);

  return {
    atencion,
    paciente: pacienteRes.data as PacienteRow,
    medico: medicoRes.data as MedicoEhr,
    adendas: (adendasRes.data ?? []) as AdendaRow[],
    plantilla: (plantillaRes.data ?? null) as PlantillaRow | null,
    ordenesLaboratorio: laboratorioRes.data ?? [],
    ordenesImagen: imagenRes.data ?? [],
  };
}

/** Campos que se escriben en la base; `imc` y `estado_nutricional` los calcula un trigger. */
function filaDesdeInput(data: AtencionInput) {
  const vacioANull = (v?: string | null) => {
    const s = (v ?? "").trim();
    return s === "" ? null : s;
  };
  return {
    paciente_id: data.paciente_id,
    cita_id: data.cita_id ?? null,
    tipo_atencion: data.tipo_atencion,
    plantilla_id: data.plantilla_id ?? null,
    plantilla_version: data.plantilla_version ?? null,
    presion_arterial_sistolica: data.presion_arterial_sistolica ?? null,
    presion_arterial_diastolica: data.presion_arterial_diastolica ?? null,
    frecuencia_cardiaca: data.frecuencia_cardiaca ?? null,
    frecuencia_respiratoria: data.frecuencia_respiratoria ?? null,
    saturacion_oxigeno: data.saturacion_oxigeno ?? null,
    temperatura: data.temperatura ?? null,
    peso: data.peso ?? null,
    talla: data.talla ?? null,
    perimetro_abdominal: data.perimetro_abdominal ?? null,
    funciones_biologicas: data.funciones_biologicas ?? {},
    motivo_consulta: vacioANull(data.motivo_consulta),
    tiempo_enfermedad: vacioANull(data.tiempo_enfermedad),
    forma_inicio: vacioANull(data.forma_inicio),
    curso_enfermedad: vacioANull(data.curso_enfermedad),
    relato_cronologico: vacioANull(data.relato_cronologico),
    antecedentes_personales: vacioANull(data.antecedentes_personales),
    antecedentes_patologicos: vacioANull(data.antecedentes_patologicos),
    antecedentes_quirurgicos: vacioANull(data.antecedentes_quirurgicos),
    antecedentes_familiares: vacioANull(data.antecedentes_familiares),
    antecedentes_alergicos: vacioANull(data.antecedentes_alergicos),
    medicacion_habitual: vacioANull(data.medicacion_habitual),
    estado_general: vacioANull(data.estado_general),
    examen_general: vacioANull(data.examen_general),
    examen_regional: data.examen_regional ?? {},
    diagnosticos: data.diagnosticos ?? [],
    plan_trabajo: vacioANull(data.plan_trabajo),
    tratamiento: vacioANull(data.tratamiento),
    indicaciones_generales: vacioANull(data.indicaciones_generales),
    proximo_control: vacioANull(data.proximo_control),
    campos_especialidad: data.campos_especialidad ?? {},
  } as unknown as TablesInsert<"atenciones_medicas">;
}

export const getMedicoEhr = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { resolveMedicoContext } = await import("./clinica-tenant.server");
    const { medicoId } = await resolveMedicoContext(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("medicos")
      .select(SELECT_MEDICO)
      .eq("id", medicoId)
      .single();
    if (error) throw new Error(error.message);
    return data as MedicoEhr;
  });

/** Plantillas de sistema (tenant_id null) + las del propio tenant; RLS ya filtra. */
export const getPlantillas = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("plantillas_especialidad")
      .select("*")
      .eq("activo", true)
      .order("especialidad", { ascending: true })
      .order("es_default", { ascending: false })
      .order("nombre", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as PlantillaRow[];
  });

export const getAtencionesPaciente = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(atencionesPacienteSchema.parse)
  .handler(async ({ context, data }) => {
    const { resolveMedicoContext } = await import("./clinica-tenant.server");
    const { medicoId } = await resolveMedicoContext(context.supabase, context.userId);
    const { data: rows, error } = await context.supabase
      .from("atenciones_medicas")
      .select("*")
      .eq("medico_id", medicoId)
      .eq("paciente_id", data.paciente_id)
      .order("fecha_atencion", { ascending: false })
      .order("hora_atencion", { ascending: false });
    if (error) throw new Error(error.message);
    return (rows ?? []) as AtencionRow[];
  });

export const getAtencion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(atencionPorIdSchema.parse)
  .handler(async ({ context, data }) => {
    const { resolveMedicoContext } = await import("./clinica-tenant.server");
    const { medicoId } = await resolveMedicoContext(context.supabase, context.userId);

    const { data: atencion, error } = await context.supabase
      .from("atenciones_medicas")
      .select("*")
      .eq("id", data.id)
      .eq("medico_id", medicoId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!atencion) {
      throw new Error("La atención no existe o no pertenece a tu consultorio.");
    }

    const detalle = await cargarComplementosAtencion(
      context.supabase,
      atencion as AtencionRow,
    );
    const { crearTokenOrden } = await import("./orden-token.server");
    return { ...detalle, token: await crearTokenOrden(atencion.id) };
  });

export const getAtencionPorToken = createServerFn({ method: "POST" })
  .inputValidator(atencionPublicaSchema.parse)
  .handler(async ({ data }) => {
    const { verificarTokenOrden } = await import("./orden-token.server");
    if (!(await verificarTokenOrden(data.id, data.token))) {
      throw new Error("El enlace del informe no es válido o ya venció.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: atencion, error } = await supabaseAdmin
      .from("atenciones_medicas")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!atencion) throw new Error("La atención no existe.");
    return {
      ...(await cargarComplementosAtencion(supabaseAdmin, atencion as AtencionRow)),
      token: data.token,
    };
  });

/**
 * Crea o actualiza el borrador. `tenant_id` y `medico_id` nunca vienen del
 * cliente: se resuelven de la sesión. Una atención firmada no se puede editar
 * (la base también lo bloquea con un trigger).
 */
export const guardarBorradorAtencion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(atencionSchema.parse)
  .handler(async ({ context, data }) => {
    const { resolveMedicoContext } = await import("./clinica-tenant.server");
    const { medicoId, tenantId } = await resolveMedicoContext(
      context.supabase,
      context.userId,
    );

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

    const fila = filaDesdeInput(data);

    if (data.id) {
      const { data: actual, error: actualError } = await context.supabase
        .from("atenciones_medicas")
        .select("estado")
        .eq("id", data.id)
        .eq("medico_id", medicoId)
        .maybeSingle();
      if (actualError) throw new Error(actualError.message);
      if (!actual) throw new Error("La atención no existe o no es tuya.");
      if (actual.estado !== "borrador") {
        throw new Error(
          "Esta atención ya fue firmada: por normativa solo puede completarse con una adenda.",
        );
      }
      const { data: row, error } = await context.supabase
        .from("atenciones_medicas")
        .update(fila)
        .eq("id", data.id)
        .eq("medico_id", medicoId)
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      return row as AtencionRow;
    }

    const ahora = new Date();
    const { data: row, error } = await context.supabase
      .from("atenciones_medicas")
      .insert({
        ...fila,
        tenant_id: tenantId,
        medico_id: medicoId,
        estado: "borrador",
        fecha_atencion: ahora.toISOString().slice(0, 10),
        hora_atencion: ahora.toTimeString().slice(0, 8),
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row as AtencionRow;
  });

export const firmarAtencion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(atencionPorIdSchema.parse)
  .handler(async ({ context, data }) => {
    const { resolveMedicoContext } = await import("./clinica-tenant.server");
    const { medicoId } = await resolveMedicoContext(context.supabase, context.userId);

    const { data: atencion, error: leerError } = await context.supabase
      .from("atenciones_medicas")
      .select("*")
      .eq("id", data.id)
      .eq("medico_id", medicoId)
      .maybeSingle();
    if (leerError) throw new Error(leerError.message);
    if (!atencion) throw new Error("La atención no existe o no es tuya.");
    if (atencion.estado === "firmada") return atencion as AtencionRow;
    if (atencion.estado === "anulada") {
      throw new Error("Una atención anulada no puede firmarse.");
    }

    const { data: medico, error: medicoError } = await context.supabase
      .from("medicos")
      .select(SELECT_MEDICO)
      .eq("id", medicoId)
      .single();
    if (medicoError) throw new Error(medicoError.message);

    // Huella del contenido clínico al momento de la firma: permite demostrar
    // después que el registro no fue alterado.
    const material = JSON.stringify({
      id: atencion.id,
      paciente_id: atencion.paciente_id,
      medico_id: atencion.medico_id,
      fecha: atencion.fecha_atencion,
      motivo: atencion.motivo_consulta,
      relato: atencion.relato_cronologico,
      diagnosticos: atencion.diagnosticos,
      tratamiento: atencion.tratamiento,
      campos: atencion.campos_especialidad,
    });
    const digest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(material),
    );
    const firma_hash = Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const { data: row, error } = await context.supabase
      .from("atenciones_medicas")
      .update({
        estado: "firmada",
        firmado_at: new Date().toISOString(),
        firma_digital_url: (medico as MedicoEhr).firma_url ?? null,
        firma_hash,
      })
      .eq("id", data.id)
      .eq("medico_id", medicoId)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row as AtencionRow;
  });

export const anularAtencion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(anularAtencionSchema.parse)
  .handler(async ({ context, data }) => {
    const { resolveMedicoContext } = await import("./clinica-tenant.server");
    const { medicoId } = await resolveMedicoContext(context.supabase, context.userId);
    const { data: actual, error: leerError } = await context.supabase
      .from("atenciones_medicas")
      .select("id, estado")
      .eq("id", data.id)
      .eq("medico_id", medicoId)
      .maybeSingle();
    if (leerError) throw new Error(leerError.message);
    if (!actual) throw new Error("La atención no existe o no es tuya.");
    if (actual.estado !== "firmada") {
      throw new Error("Solo una atención firmada puede anularse.");
    }
    const { data: row, error } = await context.supabase
      .from("atenciones_medicas")
      .update({ estado: "anulada", motivo_anulacion: data.motivo_anulacion.trim() })
      .eq("id", data.id)
      .eq("medico_id", medicoId)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row as AtencionRow;
  });

export const crearAdenda = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(nuevaAdendaSchema.parse)
  .handler(async ({ context, data }) => {
    const { resolveMedicoContext } = await import("./clinica-tenant.server");
    const { medicoId, tenantId } = await resolveMedicoContext(
      context.supabase,
      context.userId,
    );

    const { data: atencion, error: leerError } = await context.supabase
      .from("atenciones_medicas")
      .select("id, estado")
      .eq("id", data.atencion_id)
      .eq("medico_id", medicoId)
      .maybeSingle();
    if (leerError) throw new Error(leerError.message);
    if (!atencion) throw new Error("La atención no existe o no es tuya.");
    if (atencion.estado !== "firmada") {
      throw new Error("Las adendas solo se agregan sobre una atención ya firmada.");
    }

    const { data: row, error } = await context.supabase
      .from("atencion_adendas")
      .insert({
        tenant_id: tenantId,
        atencion_id: data.atencion_id,
        medico_id: medicoId,
        tipo_adenda: data.tipo_adenda,
        contenido: data.contenido,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row as AdendaRow;
  });
