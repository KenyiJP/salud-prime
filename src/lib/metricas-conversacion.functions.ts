import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  rangoMetricasSchema,
  type MetricasAgenteClinico,
  type MetricasComercialResultado,
} from "./metricas-conversacion-schemas";

// Las RPCs y tablas del Día 25 aún no están en `types.ts` (se regenera con la
// CLI de Supabase); mismo patrón que `facturacion.functions.ts`.
const untyped = (client: unknown) => client as SupabaseClient<any>;

/**
 * KPIs del agente de WhatsApp del consultorio.
 *
 * La RPC es SECURITY INVOKER: el aislamiento por tenant lo hace el RLS de
 * `metricas_conversacion` con el JWT del usuario. Por eso NO se pasa ningún
 * `tenant_id` desde aquí — aceptarlo como parámetro sería abrir la puerta a
 * pedir las métricas de otro consultorio.
 */
export const getMetricasAgenteClinico = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(rangoMetricasSchema.parse)
  .handler(async ({ context, data }): Promise<MetricasAgenteClinico> => {
    const { data: resultado, error } = await untyped(context.supabase).rpc(
      "obtener_metricas_agente_clinico",
      { p_desde: data.desde, p_hasta: data.hasta },
    );
    if (error) throw new Error(error.message);
    return resultado as MetricasAgenteClinico;
  });

/**
 * KPIs del bot comercial de MediSuite (plataforma, no consultorio).
 *
 * La autorización vive en la RPC (`rls_helpers.es_admin_plataforma()`), que
 * rechaza con `ok: false` en vez de lanzar. Se devuelve tal cual: la UI decide
 * cómo mostrar "no autorizado" sin depender de parsear un mensaje de error.
 */
export const getMetricasComercial = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(rangoMetricasSchema.parse)
  .handler(async ({ context, data }): Promise<MetricasComercialResultado> => {
    const { data: resultado, error } = await untyped(context.supabase).rpc(
      "medisuite_obtener_metricas_comercial",
      { p_desde: data.desde, p_hasta: data.hasta },
    );
    if (error) throw new Error(error.message);
    return resultado as MetricasComercialResultado;
  });

/**
 * ¿El usuario administra la plataforma? Solo sirve para mostrar u ocultar el
 * enlace del menú: la barrera real es la RPC de arriba. RLS de
 * `plataforma_administradores` deja leer únicamente la fila propia, así que
 * un no-admin siempre obtiene `false`.
 */
export const getEsAdminPlataforma = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<boolean> => {
    const { data, error } = await untyped(context.supabase)
      .from("plataforma_administradores")
      .select("user_id")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) return false;
    return data !== null;
  });
