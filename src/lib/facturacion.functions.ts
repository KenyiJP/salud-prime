import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  guardarPasarelaConfigSchema,
  type PasarelaConfigPublica,
  type TransaccionSuscripcionRow,
} from "./facturacion-schemas";

// El cliente tipado (`SupabaseClient<Database>`) no conoce todavía los
// alias de las tablas/RPCs Día 21 en algunos entornos de build local del
// paquete `@supabase/supabase-js` (mismo patrón usado en
// `landing-marca.functions.ts` para no bloquear el tipado estricto del
// resto del archivo mientras el cliente generado se actualiza).
const untyped = (client: unknown) => client as SupabaseClient<any>;

// ---------------------------------------------------------------------------
// BYOK — configuración de pasarela Culqi propia del médico (citas).
// ---------------------------------------------------------------------------

const SELECT_PASARELA_PUBLICA = "id, llave_publica, modo, activo, updated_at";

/**
 * Config BYOK del médico actual, SIN la llave secreta — esa vive solo en
 * Vault y se lee exclusivamente server-to-server desde la Edge Function
 * del webhook (`culqi_obtener_llave_secreta`, uso exclusivo service_role).
 */
export const getPasarelaConfig = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PasarelaConfigPublica> => {
    const { resolveMedicoContext } = await import("./clinica-tenant.server");
    const { medicoId } = await resolveMedicoContext(context.supabase, context.userId);

    const { data, error } = await untyped(context.supabase)
      .from("medico_pasarelas_config")
      .select(SELECT_PASARELA_PUBLICA)
      .eq("medico_id", medicoId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data ?? null) as PasarelaConfigPublica;
  });

/**
 * Alta/rotación de llaves Culqi BYOK. Delega toda la validación de tenant y
 * el guardado en Vault a la RPC `culqi_guardar_pasarela_config` (Día 21):
 * este server function solo resuelve `medico_id`/`tenant_id` del médico en
 * sesión y pasa el resto tal cual — la llave secreta viaja del navegador al
 * servidor por HTTPS y de ahí directo a la RPC, nunca se persiste en logs
 * ni en ninguna tabla de esta app.
 */
export const guardarPasarelaConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(guardarPasarelaConfigSchema.parse)
  .handler(async ({ context, data }) => {
    const { resolveMedicoContext } = await import("./clinica-tenant.server");
    const { medicoId, tenantId } = await resolveMedicoContext(context.supabase, context.userId);

    const { data: configId, error } = await untyped(context.supabase).rpc(
      "culqi_guardar_pasarela_config",
      {
        p_tenant_id: tenantId,
        p_medico_id: medicoId,
        p_llave_publica: data.llave_publica,
        p_llave_secreta: data.llave_secreta,
        p_modo: data.modo,
      },
    );
    if (error) throw new Error(error.message);
    return { id: configId as string };
  });

// ---------------------------------------------------------------------------
// Suscripción SaaS — historial de transacciones (Médico/Tenant → MATEO).
// ---------------------------------------------------------------------------

const SELECT_TRANSACCION =
  "id, tenant_id, suscripcion_id, culqi_charge_id, culqi_order_id, monto, moneda, estado, metodo_pago, periodo_inicio, periodo_fin, created_at";

/**
 * Historial de cargos de la suscripción SaaS del tenant actual, más
 * reciente primero. La RLS de `transacciones_suscripcion` (Día 21) ya
 * filtra por `tenant_id` de sesión — no hace falta resolver el tenant aquí
 * para el filtro, pero sí para exponer solo transacciones propias en caso
 * de que el usuario pertenezca a más de un tenant (defensa en profundidad).
 */
export const getHistorialTransacciones = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<TransaccionSuscripcionRow[]> => {
    const { resolveTenantContext } = await import("./landing-marca.server");
    const { tenantId } = await resolveTenantContext(context.supabase, context.userId);

    const { data, error } = await untyped(context.supabase)
      .from("transacciones_suscripcion")
      .select(SELECT_TRANSACCION)
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return (data ?? []) as TransaccionSuscripcionRow[];
  });
