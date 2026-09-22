import { createServerFn } from "@tanstack/react-start";
import { getRequestIP } from "@tanstack/react-start/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import {
  slugSchema,
  obtenerSlotsInputSchema,
  registrarReservaWebInputSchema,
  registrarReclamacionWebInputSchema,
  type LandingMedicaPublica,
  type TipoConsultaPublico,
  type SlotDisponible,
  type ResultadoReservaWeb,
  type ResultadoReclamacionWeb,
} from "./landing-marca-schemas";
import { z } from "zod";

export type TenantContext = { tenantId: string };

/**
 * `landing_config`/`landing_servicios`/`landing_testimonios` se gestionan
 * por cualquier miembro del tenant (médico, founder o community_manager),
 * a diferencia de las tablas clínicas que se resuelven por `medico_id`. RLS
 * en las tres tablas ya exige `tenant_id = ANY(tenant_ids_for_current_user())`,
 * así que basta con leer el primer tenant del usuario desde `roles_usuario`
 * para saber a qué fila apuntar (`tenant_id` nunca se acepta del cliente).
 */
export async function resolveTenantContext(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<TenantContext> {
  const { data, error } = await supabase
    .from("roles_usuario")
    .select("tenant_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) {
    throw new Error("Tu cuenta todavía no está asociada a ningún consultorio.");
  }
  return { tenantId: data.tenant_id };
}

const slugInputPublico = z.object({ slug: slugSchema });

/**
 * Lectura 100% pública (sin `requireSupabaseAuth`, sin sesión ni JWT médico)
 * de la web personal de un médico por su slug. Consulta las 3 vistas
 * curadas que expone el Día 15 (`landing_publica`, `landing_servicios_publica`,
 * `landing_testimonios_publica`) — ya filtran `publicado/activo/aprobado` en
 * su propia definición SQL, así que devolver `null` aquí basta para que la
 * ruta muestre un 404: no hay nada más que ocultar, la vista jamás expone
 * tenants con `publicado = false`.
 *
 * Usa `supabaseAdmin` (rol de servicio) en vez de instanciar un cliente anon
 * nuevo: mismo mecanismo ya establecido en `getOrdenImagenPorToken` /
 * `getRecetaPorToken` para lecturas públicas sin sesión de este proyecto.
 * Es seguro porque las 3 vistas son la única superficie que se toca aquí:
 * ya filtran lo publicable en su definición SQL, así que el rol de servicio
 * no amplía qué datos quedan expuestos a un visitante anónimo.
 */
export const getLandingMedicaPublicaServerFn = createServerFn({ method: "GET" })
  .inputValidator(slugInputPublico.parse)
  .handler(async ({ data }): Promise<LandingMedicaPublica | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: config, error: errorConfig } = await supabaseAdmin
      .from("landing_publica")
      .select("*")
      .eq("slug", data.slug)
      .maybeSingle();
    if (errorConfig) throw new Error(errorConfig.message);
    if (!config || !config.tenant_id) return null;

    const [
      { data: servicios, error: errorServicios },
      { data: testimonios, error: errorTestimonios },
    ] = await Promise.all([
      supabaseAdmin
        .from("landing_servicios_publica")
        .select("*")
        .eq("tenant_id", config.tenant_id)
        .order("orden", { ascending: true }),
      supabaseAdmin
        .from("landing_testimonios_publica")
        .select("*")
        .eq("tenant_id", config.tenant_id)
        .order("orden", { ascending: true }),
    ]);
    if (errorServicios) throw new Error(errorServicios.message);
    if (errorTestimonios) throw new Error(errorTestimonios.message);

    return {
      config,
      servicios: servicios ?? [],
      testimonios: testimonios ?? [],
    };
  });

/**
 * Pepper del hash de IP en `reservas_web_intentos`/`registrar_reserva_web`:
 * nunca guardamos la IP en claro (dato personal), solo un HMAC-SHA256 con una
 * clave que solo vive en el servidor. Mismo patrón que `orden-token.server.ts`.
 */
async function hashearIp(ip: string): Promise<string> {
  const secreto = process.env["RESERVA_WEB_IP_SECRET"] ?? process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!secreto) throw new Error("Falta la clave de hash de IP en el servidor.");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secreto),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const firma = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(ip));
  return [...new Uint8Array(firma)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Lista los tipos de consulta activos de un tenant para el selector de la
 * reserva pública. RPC `security definer`: anon no tiene SELECT directo
 * sobre `tipos_consulta` (podría filtrar precios/nombres internos de otros
 * tenants si se expusiera sin filtrar), así que se pasa por
 * `obtener_tipos_consulta_publicos`, que ya filtra `activo = true`.
 */
export const getTiposConsultaPublicosServerFn = createServerFn({ method: "GET" })
  .inputValidator(slugInputPublico.parse)
  .handler(async ({ data }): Promise<TipoConsultaPublico[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: tipos, error } = await supabaseAdmin.rpc("obtener_tipos_consulta_publicos", {
      p_slug: data.slug,
    });
    if (error) throw new Error(error.message);
    return tipos ?? [];
  });

/**
 * Horas libres de un día para la landing pública. `p_tipo_consulta_id` es
 * opcional: si el paciente aún no elige tipo de consulta, la RPC calcula los
 * slots con la duración por defecto del turno (`horarios_atencion`).
 */
export const getSlotsDisponiblesServerFn = createServerFn({ method: "GET" })
  .inputValidator(obtenerSlotsInputSchema.parse)
  .handler(async ({ data }): Promise<SlotDisponible[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: slots, error } = await supabaseAdmin.rpc("obtener_slots_disponibles", {
      p_slug: data.slug,
      p_fecha: data.fecha,
      p_tipo_consulta_id: data.tipo_consulta_id ?? undefined,
    });
    if (error) throw new Error(error.message);
    return slots ?? [];
  });

/**
 * Confirma la reserva del paciente anónimo. La IP se calcula en el servidor
 * (nunca la envía el cliente, para que no pueda falsificarse el rate limit) y
 * se hashea antes de llegar a la RPC — `reservas_web_intentos` jamás guarda
 * la IP real. `registrar_reserva_web` ya devuelve `{ ok: false, error_codigo }`
 * en vez de lanzar excepción SQL, así que aquí solo se relanzan errores de
 * transporte/infraestructura reales.
 */
export const registrarReservaWebServerFn = createServerFn({ method: "POST" })
  .inputValidator(registrarReservaWebInputSchema.parse)
  .handler(async ({ data }): Promise<ResultadoReservaWeb> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ip = getRequestIP({ xForwardedFor: true }) ?? "0.0.0.0";
    const ipHash = await hashearIp(ip);

    const { data: filas, error } = await supabaseAdmin.rpc("registrar_reserva_web", {
      p_slug: data.slug,
      p_inicio: data.inicio,
      p_nombres: data.nombres,
      p_apellidos: data.apellidos,
      p_telefono: data.telefono,
      p_ip_hash: ipHash,
      p_documento_identidad: data.documento_identidad ?? undefined,
      p_email: data.email ?? undefined,
      p_aseguradora_tipo: data.aseguradora_tipo,
      p_aseguradora_nombre: data.aseguradora_nombre ?? undefined,
      p_comentario: data.comentario ?? undefined,
      p_tipo_consulta_id: data.tipo_consulta_id ?? undefined,
    });
    if (error) throw new Error(error.message);
    const resultado = filas?.[0];
    if (!resultado) throw new Error("La reserva no devolvió resultado.");
    return resultado;
  });

/**
 * Confirma un reclamo/queja del Libro de Reclamaciones Virtual (Día 21B,
 * Indecopi). Mismo mecanismo de IP hasheada en servidor que la reserva
 * pública; `slug` ausente = reclamo institucional contra MATEO, `slug`
 * presente = reclamo contra el médico titular de esa landing.
 */
export const registrarReclamacionWebServerFn = createServerFn({ method: "POST" })
  .inputValidator(registrarReclamacionWebInputSchema.parse)
  .handler(async ({ data }): Promise<ResultadoReclamacionWeb> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ip = getRequestIP({ xForwardedFor: true }) ?? "0.0.0.0";
    const ipHash = await hashearIp(ip);

    const { data: filas, error } = await supabaseAdmin.rpc("registrar_reclamacion_web", {
      p_tipo: data.tipo,
      p_consumidor_nombres: data.consumidor_nombres,
      p_consumidor_apellidos: data.consumidor_apellidos,
      p_consumidor_documento: data.consumidor_documento,
      p_consumidor_domicilio: data.consumidor_domicilio,
      p_consumidor_email: data.consumidor_email,
      p_consumidor_telefono: data.consumidor_telefono ?? undefined,
      p_bien_contratado: data.bien_contratado,
      p_monto_reclamado: data.monto_reclamado ?? undefined,
      p_detalle: data.detalle,
      p_pedido_consumidor: data.pedido_consumidor,
      p_ip_hash: ipHash,
      p_slug: data.slug ?? undefined,
    });
    if (error) throw new Error(error.message);
    const resultado = filas?.[0];
    if (!resultado) throw new Error("La reclamación no devolvió resultado.");
    return resultado;
  });
