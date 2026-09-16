import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { slugSchema, type LandingMedicaPublica } from "./landing-marca-schemas";
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
