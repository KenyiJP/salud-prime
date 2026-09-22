import { z } from "zod";
import type { Tables } from "@/integrations/supabase/types";

// ---------------------------------------------------------------------------
// Día 21 — Pasarela Culqi: schemas Zod y tipos de fila para facturación.
//
// Dos flujos de dinero, ver comentario en la migración
// `20260921200000_dia21_culqi_transacciones_idempotencia.sql`:
//   a) Suscripción SaaS (médico/tenant → MATEO): se paga con las llaves de
//      MATEO, el frontend solo dispara el Checkout v4 con la llave pública
//      de MATEO (`VITE_CULQI_PUBLIC_KEY`).
//   b) Consulta médica BYOK (paciente → médico): el médico registra SUS
//      PROPIAS llaves Culqi aquí — la llave secreta nunca sale del servidor
//      hacia el cliente, solo se manda a `culqi_guardar_pasarela_config`.
// ---------------------------------------------------------------------------

export type MedicoPasarelaConfigRow = Tables<"medico_pasarelas_config">;
export type TransaccionSuscripcionRow = Tables<"transacciones_suscripcion">;

/** Config de pasarela BYOK sin la llave secreta (esa nunca llega al cliente). */
export type PasarelaConfigPublica = Pick<
  MedicoPasarelaConfigRow,
  "id" | "llave_publica" | "modo" | "activo" | "updated_at"
> | null;

export const guardarPasarelaConfigSchema = z.object({
  llave_publica: z
    .string()
    .trim()
    .min(1, "Ingresa tu llave pública de Culqi.")
    .regex(/^pk_(test|live)_/, "La llave pública de Culqi empieza con pk_test_ o pk_live_."),
  llave_secreta: z
    .string()
    .trim()
    .min(1, "Ingresa tu llave secreta de Culqi.")
    .regex(/^sk_(test|live)_/, "La llave secreta de Culqi empieza con sk_test_ o sk_live_."),
  modo: z.enum(["test", "live"]),
});

export type GuardarPasarelaConfigInput = z.infer<typeof guardarPasarelaConfigSchema>;

/**
 * Token que produce `Culqi.createToken()` en el Checkout v4 del navegador
 * (`id: tkn_...`). El backend nunca ve el número de tarjeta, solo este
 * token de un solo uso, que intercambia por un cargo real vía la API v2.
 */
export const confirmarPagoSuscripcionSchema = z.object({
  culqi_token: z.string().trim().min(1, "Falta el token de Culqi."),
  plan_id: z.string().uuid("Selecciona un plan válido."),
  email: z.string().trim().email("Correo inválido."),
});

export type ConfirmarPagoSuscripcionInput = z.infer<typeof confirmarPagoSuscripcionSchema>;

export const ESTADOS_TRANSACCION = ["pendiente", "exitosa", "fallida", "anulada"] as const;
export type EstadoTransaccion = (typeof ESTADOS_TRANSACCION)[number];

export function formatearMonto(monto: number, moneda = "PEN"): string {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: moneda,
    minimumFractionDigits: 2,
  }).format(monto);
}
