// Mensajes fijos del cobro presencial (Día 29D). Sin red ni React para poder
// probarlo con `node src/lib/pago-presencial.test.mjs` (Node >= 22.18).
// La RPC `registrar_pago_presencial_cita` responde `{ ok, error_codigo, error_mensaje }`;
// si el código es conocido se muestra SIEMPRE el texto fijo de aquí, nunca el
// `error_mensaje` crudo (R6: sin eco de texto de la base de datos).

export const MONTO_PAGO_MIN = 0.01;
export const MONTO_PAGO_MAX = 99_999_999.99;

export const MENSAJE_PAGO: Record<string, string> = {
  cita_no_existe: "No se encontró la cita o no tienes acceso a ella.",
  monto_invalido: "El importe no es válido. Debe estar entre S/ 0,01 y S/ 99 999 999,99, con máximo 2 decimales.",
  metodo_invalido: "El método de cobro no es válido. Elige efectivo, POS, transferencia o Yape/Plin.",
  concepto_invalido: "El concepto del cobro no es válido.",
  sin_permiso: "No tienes permiso para registrar cobros en esta cita.",
  sin_permiso_reembolso: "No tienes permiso para registrar reembolsos.",
};

export const MENSAJE_PAGO_GENERICO = "No se pudo registrar el cobro. Inténtalo de nuevo.";

export function mensajePagoPresencial(codigo: string | null | undefined): string {
  return (codigo && Object.hasOwn(MENSAJE_PAGO, codigo) && MENSAJE_PAGO[codigo]) || MENSAJE_PAGO_GENERICO;
}

/** Importe válido para el backend: finito, 0,01 ≤ monto ≤ 99 999 999,99 y a lo sumo 2 decimales. */
export function montoPagoValido(monto: unknown): monto is number {
  if (typeof monto !== "number" || !Number.isFinite(monto)) return false;
  if (monto < MONTO_PAGO_MIN || monto > MONTO_PAGO_MAX) return false;
  const centavos = monto * 100;
  return Math.abs(centavos - Math.round(centavos)) < 1e-6;
}
