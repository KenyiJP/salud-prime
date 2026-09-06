import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  cambiarEstadoOrdenImagenSchema,
  nuevaOrdenImagenSchema,
  ordenImagenPorIdSchema,
  ordenImagenPublicaSchema,
  ordenesImagenPacienteSchema,
  type MedicoImpresion,
  type OrdenImagen,
} from "./imagenologia-schemas";
import type { PacienteRow } from "./clinica-schemas";

const SELECT_ORDEN =
  "id, paciente_id, medico_id, fecha_orden, estado, diagnostico_presuntivo, indicacion_clinica, observaciones, orden_imagen_estudios(orden, estudio_id, nota, estudios_imagen(nombre_display, modalidad, region, requiere_contraste, requiere_preparacion, instrucciones_preparacion))";

const SELECT_MEDICO =
  "id, nombres, apellidos, cmp, rne, especialidad, email, firma_url";

function normalizarOrden(row: any): OrdenImagen {
  const detalle = (row.orden_imagen_estudios ?? []) as any[];
  return {
    id: row.id,
    paciente_id: row.paciente_id,
    medico_id: row.medico_id,
    fecha_orden: row.fecha_orden,
    estado: row.estado,
    diagnostico_presuntivo: row.diagnostico_presuntivo,
    indicacion_clinica: row.indicacion_clinica ?? "",
    observaciones: row.observaciones,
    estudios: detalle
      .slice()
      .sort((a, b) => a.orden - b.orden)
      .map((d) => ({
        orden: d.orden,
        estudio_id: d.estudio_id,
        nota: d.nota ?? null,
        nombre_display: d.estudios_imagen?.nombre_display ?? "Estudio",
        modalidad: d.estudios_imagen?.modalidad ?? "",
        region: d.estudios_imagen?.region ?? null,
        requiere_contraste: !!d.estudios_imagen?.requiere_contraste,
        requiere_preparacion: !!d.estudios_imagen?.requiere_preparacion,
        instrucciones_preparacion:
          d.estudios_imagen?.instrucciones_preparacion ?? null,
      })),
  };
}

export const getMedicoImpresion = createServerFn({ method: "GET" })
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
    return data as MedicoImpresion;
  });

export const getOrdenesImagenPaciente = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(ordenesImagenPacienteSchema.parse)
  .handler(async ({ context, data }) => {
    const { resolveMedicoContext } = await import("./clinica-tenant.server");
    const { medicoId } = await resolveMedicoContext(context.supabase, context.userId);
    const { data: rows, error } = await context.supabase
      .from("ordenes_imagen")
      .select(SELECT_ORDEN)
      .eq("medico_id", medicoId)
      .eq("paciente_id", data.paciente_id)
      .order("fecha_orden", { ascending: false });
    if (error) throw new Error(error.message);
    return (rows ?? []).map(normalizarOrden);
  });

export const crearOrdenImagen = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(nuevaOrdenImagenSchema.parse)
  .handler(async ({ context, data }) => {
    const { resolveMedicoContext } = await import("./clinica-tenant.server");
    const { medicoId, tenantId } = await resolveMedicoContext(
      context.supabase,
      context.userId,
    );

    // RLS solo valida el tenant: la pertenencia del paciente al médico se
    // verifica aquí antes de escribir nada.
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

    const { data: cabecera, error } = await context.supabase
      .from("ordenes_imagen")
      .insert({
        tenant_id: tenantId,
        medico_id: medicoId,
        paciente_id: data.paciente_id,
        indicacion_clinica: data.indicacion_clinica,
        diagnostico_presuntivo: data.diagnostico_presuntivo || null,
        observaciones: data.observaciones || null,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    const renglones = data.estudios.map((e, i) => ({
      tenant_id: tenantId,
      orden_id: cabecera.id,
      estudio_id: e.estudio_id,
      orden: i + 1,
      nota: e.nota ? e.nota : null,
    }));

    const { error: detalleError } = await context.supabase
      .from("orden_imagen_estudios")
      .insert(renglones);
    if (detalleError) {
      await context.supabase.from("ordenes_imagen").delete().eq("id", cabecera.id);
      throw new Error(
        `No se pudieron guardar los estudios de la orden: ${detalleError.message}`,
      );
    }

    const { crearTokenOrden } = await import("./orden-token.server");
    return { id: cabecera.id as string, token: await crearTokenOrden(cabecera.id) };
  });

export const cambiarEstadoOrdenImagen = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(cambiarEstadoOrdenImagenSchema.parse)
  .handler(async ({ context, data }) => {
    const { resolveMedicoContext } = await import("./clinica-tenant.server");
    const { medicoId } = await resolveMedicoContext(context.supabase, context.userId);
    const { data: row, error } = await context.supabase
      .from("ordenes_imagen")
      .update({ estado: data.estado })
      .eq("id", data.id)
      .eq("medico_id", medicoId)
      .select(SELECT_ORDEN)
      .single();
    if (error) throw new Error(error.message);
    return normalizarOrden(row);
  });

export const getOrdenImagenParaImprimir = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(ordenImagenPorIdSchema.parse)
  .handler(async ({ context, data }) => {
    const { resolveMedicoContext } = await import("./clinica-tenant.server");
    const { medicoId } = await resolveMedicoContext(context.supabase, context.userId);

    const { data: row, error } = await context.supabase
      .from("ordenes_imagen")
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
      .select(SELECT_MEDICO)
      .eq("id", medicoId)
      .single();
    if (medicoError) throw new Error(medicoError.message);

    const { crearTokenOrden } = await import("./orden-token.server");

    return {
      orden,
      paciente: paciente as PacienteRow,
      medico: medico as MedicoImpresion,
      token: await crearTokenOrden(orden.id),
    };
  });

/**
 * Lectura pública SOLO con token firmado: es la puerta por la que el servicio
 * de imágenes abre la orden desde el QR sin tener cuenta. Sin token válido no
 * devuelve nada, y solo expone los campos que ya están impresos en el papel.
 */
export const getOrdenImagenPorToken = createServerFn({ method: "POST" })
  .inputValidator(ordenImagenPublicaSchema.parse)
  .handler(async ({ data }) => {
    const { verificarTokenOrden } = await import("./orden-token.server");
    if (!(await verificarTokenOrden(data.id, data.token))) {
      throw new Error("El enlace de la orden no es válido o ya venció.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: row, error } = await supabaseAdmin
      .from("ordenes_imagen")
      .select(SELECT_ORDEN)
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("La orden no existe.");

    const orden = normalizarOrden(row);

    const { data: paciente, error: pacienteError } = await supabaseAdmin
      .from("pacientes")
      .select(
        "id, nombres, apellidos, documento_identidad, fecha_nacimiento, tenant_id, medico_id, telefono, email, created_at, updated_at",
      )
      .eq("id", orden.paciente_id)
      .single();
    if (pacienteError) throw new Error(pacienteError.message);

    const { data: medico, error: medicoError } = await supabaseAdmin
      .from("medicos")
      .select(SELECT_MEDICO)
      .eq("id", orden.medico_id)
      .single();
    if (medicoError) throw new Error(medicoError.message);

    return {
      orden,
      paciente: paciente as PacienteRow,
      medico: medico as MedicoImpresion,
      token: data.token,
    };
  });

/**
 * La firma se sube desde el navegador al bucket privado `firmas-medicos` bajo
 * el prefijo del propio usuario. Aquí solo se genera la URL firmada (10 años)
 * y se guarda en la ficha del médico: la ruta nunca se acepta del cliente.
 */
export const guardarFirmaMedico = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { resolveMedicoContext } = await import("./clinica-tenant.server");
    const { medicoId } = await resolveMedicoContext(context.supabase, context.userId);

    const path = `${context.userId}/firma.png`;
    const { data: firmada, error: firmaError } = await context.supabase.storage
      .from("firmas-medicos")
      .createSignedUrl(path, 315360000);
    if (firmaError || !firmada?.signedUrl) {
      throw new Error(
        firmaError?.message ?? "No se pudo generar el enlace de la firma.",
      );
    }

    const { error } = await context.supabase
      .from("medicos")
      .update({ firma_url: firmada.signedUrl })
      .eq("id", medicoId);
    if (error) throw new Error(error.message);

    return { firma_url: firmada.signedUrl };
  });
