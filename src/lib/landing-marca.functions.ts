import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  landingConfigSchema,
  landingServicioSchema,
  landingTestimonioSchema,
  slugSchema,
  type LandingConfigRow,
  type LandingServicioRow,
  type LandingTestimonioRow,
  type PlanSuscripcionRow,
  type SuscripcionRow,
  type SuscripcionActualInfo,
} from "./landing-marca-schemas";
import { z } from "zod";

const untyped = (client: unknown) => client as SupabaseClient<any>;

const SELECT_CONFIG =
  "id, tenant_id, color_primario, color_secundario, color_fondo, tipografia, foto_medico_url, logo_url, galeria_fotos_urls, biografia, formacion_academica, mostrar_cmp, mostrar_rne, video_url, animaciones_activas, mostrar_boton_reserva, mostrar_boton_whatsapp, whatsapp_numero, mapa_direccion, publicado, created_at, updated_at";

const DEFAULTS_CONFIG = {
  color_primario: "#0f766e",
  color_secundario: "#0891b2",
  color_fondo: "#ffffff",
  tipografia: "inter" as const,
  foto_medico_url: null,
  logo_url: null,
  galeria_fotos_urls: [] as string[],
  biografia: null,
  formacion_academica: null,
  mostrar_cmp: true,
  mostrar_rne: true,
  video_url: null,
  animaciones_activas: true,
  mostrar_boton_reserva: true,
  mostrar_boton_whatsapp: true,
  whatsapp_numero: null,
  mapa_direccion: null,
  publicado: false,
};

/**
 * `landing_config` es 1:1 con el tenant pero no se crea automáticamente al
 * dar de alta el tenant (Día 15). La primera visita al panel la crea con
 * valores por defecto, para que el editor nunca reciba `null`.
 */
async function getOrCrearConfig(
  supabase: SupabaseClient<any>,
  tenantId: string,
): Promise<LandingConfigRow> {
  const { data: existente, error } = await supabase
    .from("landing_config")
    .select(SELECT_CONFIG)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (existente) return existente as LandingConfigRow;

  const { data: creado, error: crearError } = await supabase
    .from("landing_config")
    .insert({ tenant_id: tenantId, ...DEFAULTS_CONFIG })
    .select(SELECT_CONFIG)
    .single();
  if (crearError) throw new Error(crearError.message);
  return creado as LandingConfigRow;
}

export const getLandingConfig = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { resolveTenantContext } = await import("./landing-marca.server");
    const { tenantId } = await resolveTenantContext(context.supabase, context.userId);
    return getOrCrearConfig(untyped(context.supabase), tenantId);
  });

export const actualizarLandingConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(landingConfigSchema.parse)
  .handler(async ({ context, data }) => {
    const { resolveTenantContext } = await import("./landing-marca.server");
    const { tenantId } = await resolveTenantContext(context.supabase, context.userId);
    const db = untyped(context.supabase);
    await getOrCrearConfig(db, tenantId);

    const { data: actualizado, error } = await db
      .from("landing_config")
      .update(data)
      .eq("tenant_id", tenantId)
      .select(SELECT_CONFIG)
      .single();
    if (error) throw new Error(error.message);
    return actualizado as LandingConfigRow;
  });

// ---------------------------------------------------------------------------
// Servicios
// ---------------------------------------------------------------------------

const SELECT_SERVICIO =
  "id, tenant_id, landing_config_id, nombre, descripcion, precio, duracion_minutos, activo, visible_en_landing, orden, created_at, updated_at";

export const getLandingServicios = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { resolveTenantContext } = await import("./landing-marca.server");
    const { tenantId } = await resolveTenantContext(context.supabase, context.userId);
    const { data, error } = await untyped(context.supabase)
      .from("landing_servicios")
      .select(SELECT_SERVICIO)
      .eq("tenant_id", tenantId)
      .order("orden", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as LandingServicioRow[];
  });

export const crearLandingServicio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(landingServicioSchema.parse)
  .handler(async ({ context, data }) => {
    const { resolveTenantContext } = await import("./landing-marca.server");
    const { tenantId } = await resolveTenantContext(context.supabase, context.userId);
    const db = untyped(context.supabase);
    const config = await getOrCrearConfig(db, tenantId);

    const { count } = await db
      .from("landing_servicios")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId);

    const { data: creado, error } = await db
      .from("landing_servicios")
      .insert({
        tenant_id: tenantId,
        landing_config_id: config.id,
        orden: count ?? 0,
        ...data,
      })
      .select(SELECT_SERVICIO)
      .single();
    if (error) throw new Error(error.message);
    return creado as LandingServicioRow;
  });

const actualizarServicioInput = z.object({
  id: z.string().uuid(),
  cambios: landingServicioSchema.partial(),
});

export const actualizarLandingServicio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(actualizarServicioInput.parse)
  .handler(async ({ context, data }) => {
    const { resolveTenantContext } = await import("./landing-marca.server");
    const { tenantId } = await resolveTenantContext(context.supabase, context.userId);
    const { data: actualizado, error } = await untyped(context.supabase)
      .from("landing_servicios")
      .update(data.cambios)
      .eq("id", data.id)
      .eq("tenant_id", tenantId)
      .select(SELECT_SERVICIO)
      .single();
    if (error) throw new Error(error.message);
    return actualizado as LandingServicioRow;
  });

const eliminarPorIdInput = z.object({ id: z.string().uuid() });

export const eliminarLandingServicio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(eliminarPorIdInput.parse)
  .handler(async ({ context, data }) => {
    const { resolveTenantContext } = await import("./landing-marca.server");
    const { tenantId } = await resolveTenantContext(context.supabase, context.userId);
    const { error } = await untyped(context.supabase)
      .from("landing_servicios")
      .delete()
      .eq("id", data.id)
      .eq("tenant_id", tenantId);
    if (error) throw new Error(error.message);
    return { id: data.id };
  });

const reordenarInput = z.object({
  ids: z.array(z.string().uuid()).min(1),
});

export const reordenarLandingServicios = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(reordenarInput.parse)
  .handler(async ({ context, data }) => {
    const { resolveTenantContext } = await import("./landing-marca.server");
    const { tenantId } = await resolveTenantContext(context.supabase, context.userId);
    const db = untyped(context.supabase);
    for (let i = 0; i < data.ids.length; i++) {
      const { error } = await db
        .from("landing_servicios")
        .update({ orden: i })
        .eq("id", data.ids[i])
        .eq("tenant_id", tenantId);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

// ---------------------------------------------------------------------------
// Testimonios
// ---------------------------------------------------------------------------

const SELECT_TESTIMONIO =
  "id, tenant_id, landing_config_id, nombre_paciente, contenido, calificacion, origen, aprobado, orden, created_at, updated_at";

export const getLandingTestimonios = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { resolveTenantContext } = await import("./landing-marca.server");
    const { tenantId } = await resolveTenantContext(context.supabase, context.userId);
    const { data, error } = await untyped(context.supabase)
      .from("landing_testimonios")
      .select(SELECT_TESTIMONIO)
      .eq("tenant_id", tenantId)
      .order("orden", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as LandingTestimonioRow[];
  });

export const crearLandingTestimonio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(landingTestimonioSchema.parse)
  .handler(async ({ context, data }) => {
    const { resolveTenantContext } = await import("./landing-marca.server");
    const { tenantId } = await resolveTenantContext(context.supabase, context.userId);
    const db = untyped(context.supabase);
    const config = await getOrCrearConfig(db, tenantId);

    const { count } = await db
      .from("landing_testimonios")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId);

    const { data: creado, error } = await db
      .from("landing_testimonios")
      .insert({
        tenant_id: tenantId,
        landing_config_id: config.id,
        orden: count ?? 0,
        ...data,
      })
      .select(SELECT_TESTIMONIO)
      .single();
    if (error) throw new Error(error.message);
    return creado as LandingTestimonioRow;
  });

const actualizarTestimonioInput = z.object({
  id: z.string().uuid(),
  cambios: landingTestimonioSchema.partial(),
});

export const actualizarLandingTestimonio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(actualizarTestimonioInput.parse)
  .handler(async ({ context, data }) => {
    const { resolveTenantContext } = await import("./landing-marca.server");
    const { tenantId } = await resolveTenantContext(context.supabase, context.userId);
    const { data: actualizado, error } = await untyped(context.supabase)
      .from("landing_testimonios")
      .update(data.cambios)
      .eq("id", data.id)
      .eq("tenant_id", tenantId)
      .select(SELECT_TESTIMONIO)
      .single();
    if (error) throw new Error(error.message);
    return actualizado as LandingTestimonioRow;
  });

export const eliminarLandingTestimonio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(eliminarPorIdInput.parse)
  .handler(async ({ context, data }) => {
    const { resolveTenantContext } = await import("./landing-marca.server");
    const { tenantId } = await resolveTenantContext(context.supabase, context.userId);
    const { error } = await untyped(context.supabase)
      .from("landing_testimonios")
      .delete()
      .eq("id", data.id)
      .eq("tenant_id", tenantId);
    if (error) throw new Error(error.message);
    return { id: data.id };
  });

export const reordenarLandingTestimonios = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(reordenarInput.parse)
  .handler(async ({ context, data }) => {
    const { resolveTenantContext } = await import("./landing-marca.server");
    const { tenantId } = await resolveTenantContext(context.supabase, context.userId);
    const db = untyped(context.supabase);
    for (let i = 0; i < data.ids.length; i++) {
      const { error } = await db
        .from("landing_testimonios")
        .update({ orden: i })
        .eq("id", data.ids[i])
        .eq("tenant_id", tenantId);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

// ---------------------------------------------------------------------------
// Slug del tenant
// ---------------------------------------------------------------------------

const slugInput = z.object({ slug: slugSchema });

export const getTenantSlug = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { resolveTenantContext } = await import("./landing-marca.server");
    const { tenantId } = await resolveTenantContext(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("tenants")
      .select("slug, nombre_comercial")
      .eq("id", tenantId)
      .single();
    if (error) throw new Error(error.message);
    return data as { slug: string | null; nombre_comercial: string };
  });

/**
 * Chequeo de unicidad en tiempo real: RLS solo deja leer el propio tenant, así
 * que esta consulta pasa por el rol de servicio (solo lectura de `id` y
 * `slug`, nunca datos clínicos) para poder comparar contra los demás tenants.
 */
export const verificarSlugDisponible = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(slugInput.parse)
  .handler(async ({ context, data }) => {
    const { resolveTenantContext } = await import("./landing-marca.server");
    const { tenantId } = await resolveTenantContext(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: fila, error } = await supabaseAdmin
      .from("tenants")
      .select("id")
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { disponible: !fila || fila.id === tenantId };
  });

export const actualizarTenantSlug = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(slugInput.parse)
  .handler(async ({ context, data }) => {
    const { resolveTenantContext } = await import("./landing-marca.server");
    const { tenantId } = await resolveTenantContext(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("tenants")
      .update({ slug: data.slug })
      .eq("id", tenantId);
    if (error) {
      if (/duplicate key|unique constraint|tenants_slug_uidx/i.test(error.message)) {
        throw new Error("Ese slug ya está en uso por otro consultorio.");
      }
      if (/tenants_slug_formato_chk/i.test(error.message)) {
        throw new Error("El slug solo admite minúsculas, números y guiones simples.");
      }
      throw new Error(error.message);
    }
    return { slug: data.slug };
  });

// ---------------------------------------------------------------------------
// Plan y suscripción (Día 19)
// ---------------------------------------------------------------------------

const SELECT_PLAN =
  "id, codigo, nombre, precio_mensual, moneda, max_usuarios, incluye_agente_whatsapp_ia, incluye_voice_scribe, incluye_facturacion_sunat, incluye_landing_personalizable, permite_addon_marca_personal, precio_addon_marca_personal, activo, orden";

const SELECT_SUSCRIPCION =
  "id, tenant_id, plan_id, addon_marca_personal, estado, fecha_inicio, fecha_fin, metodo_pago, created_at, updated_at";

/**
 * Solo lectura: catálogo completo de planes activos, para mostrar la
 * comparativa (ej. invitar a migrar de Esencial a Profesional). El panel no
 * permite cambiar de plan todavía — eso llega con el checkout de pago
 * (Semana 4, Días 20-21) — pero sí sirve para que el médico vea qué gana.
 */
export const getPlanesSuscripcion = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await untyped(context.supabase)
      .from("planes_suscripcion")
      .select(SELECT_PLAN)
      .eq("activo", true)
      .order("orden", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as PlanSuscripcionRow[];
  });

/**
 * Suscripción vigente del tenant actual (trial o activa — el índice único
 * `suscripciones_tenant_vigente_uidx`, Día 19, garantiza que hay a lo sumo
 * una) junto con el plan asociado y el conteo de usuarios activos, para que
 * el panel pueda mostrar "2 de 3 usuarios usados" sin otra ida y vuelta.
 * Un tenant sin fila en `suscripciones` (caso legado, ver comentario del
 * Día 19 en la migración) devuelve `null` en vez de lanzar error.
 */
export const getSuscripcionActual = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { resolveTenantContext } = await import("./landing-marca.server");
    const { tenantId } = await resolveTenantContext(context.supabase, context.userId);
    const db = untyped(context.supabase);

    const { data: suscripcion, error: errorSuscripcion } = await db
      .from("suscripciones")
      .select(SELECT_SUSCRIPCION)
      .eq("tenant_id", tenantId)
      .in("estado", ["trial", "activa"])
      .maybeSingle();
    if (errorSuscripcion) throw new Error(errorSuscripcion.message);
    if (!suscripcion) return null;

    const [{ data: plan, error: errorPlan }, { count, error: errorConteo }] = await Promise.all([
      db.from("planes_suscripcion").select(SELECT_PLAN).eq("id", suscripcion.plan_id).single(),
      db
        .from("roles_usuario")
        .select("user_id", { count: "exact", head: true })
        .eq("tenant_id", tenantId),
    ]);
    if (errorPlan) throw new Error(errorPlan.message);
    if (errorConteo) throw new Error(errorConteo.message);

    return {
      suscripcion: suscripcion as SuscripcionRow,
      plan: plan as PlanSuscripcionRow,
      usuarios_actuales: count ?? 0,
    } satisfies SuscripcionActualInfo;
  });
