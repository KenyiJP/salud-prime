// Test sin dependencias nuevas: `node src/lib/pago-presencial.test.mjs` (Node >= 22.18).
import assert from "node:assert/strict";
import { MENSAJE_PAGO, MENSAJE_PAGO_GENERICO, mensajePagoPresencial, montoPagoValido } from "./pago-presencial.ts";
import { registrarPagoPresencialSchema } from "./clinica-schemas.ts";

let n = 0;
const t = (nombre, fn) => {
  fn();
  n++;
};

const CITA = "3f6c1b7e-8a2d-4c11-9d0e-5b7a1c2d3e4f";
const base = { cita_id: CITA, metodo: "efectivo", concepto: "pago_completo" };
const parse = (monto, extra = {}) => registrarPagoPresencialSchema.safeParse({ ...base, monto, ...extra });

t("mensajePagoPresencial: cada código conocido tiene texto fijo", () => {
  for (const k of ["cita_no_existe", "monto_invalido", "metodo_invalido", "concepto_invalido", "sin_permiso", "sin_permiso_reembolso"]) {
    assert.equal(mensajePagoPresencial(k), MENSAJE_PAGO[k]);
    assert.notEqual(mensajePagoPresencial(k), MENSAJE_PAGO_GENERICO);
  }
  assert.match(mensajePagoPresencial("sin_permiso_reembolso"), /reembolsos/);
});

t("mensajePagoPresencial: código desconocido o ausente no filtra texto", () => {
  assert.equal(mensajePagoPresencial("loquesea"), MENSAJE_PAGO_GENERICO);
  assert.equal(mensajePagoPresencial(undefined), MENSAJE_PAGO_GENERICO);
  assert.equal(mensajePagoPresencial(null), MENSAJE_PAGO_GENERICO);
  assert.equal(mensajePagoPresencial(""), MENSAJE_PAGO_GENERICO);
  assert.equal(mensajePagoPresencial("__proto__"), MENSAJE_PAGO_GENERICO);
  assert.equal(mensajePagoPresencial("toString"), MENSAJE_PAGO_GENERICO);
});

t("montoPagoValido: rangos y decimales", () => {
  assert.equal(montoPagoValido(0.01), true);
  assert.equal(montoPagoValido(150), true);
  assert.equal(montoPagoValido(0.07), true);
  assert.equal(montoPagoValido(99999999.99), true);
  assert.equal(montoPagoValido(0), false);
  assert.equal(montoPagoValido(0.009), false);
  assert.equal(montoPagoValido(-5), false);
  assert.equal(montoPagoValido(100000000), false);
  assert.equal(montoPagoValido(10.123), false);
  assert.equal(montoPagoValido(Number.NaN), false);
  assert.equal(montoPagoValido(Number.POSITIVE_INFINITY), false);
  assert.equal(montoPagoValido(Number.NEGATIVE_INFINITY), false);
  assert.equal(montoPagoValido("10"), false);
  assert.equal(montoPagoValido(null), false);
});

t("schema: rechaza NaN e Infinity", () => {
  assert.equal(parse(Number.NaN).success, false);
  assert.equal(parse("abc").success, false);
  assert.equal(parse(Number.POSITIVE_INFINITY).success, false);
  assert.equal(parse("Infinity").success, false);
  assert.equal(parse(Number.NEGATIVE_INFINITY).success, false);
});

t("schema: límites 0,01 y 99 999 999,99", () => {
  assert.equal(parse(0).success, false);
  assert.equal(parse("").success, false);
  assert.equal(parse(0.005).success, false);
  assert.equal(parse(-1).success, false);
  assert.equal(parse(0.01).success, true);
  assert.equal(parse(99999999.99).success, true);
  assert.equal(parse(100000000).success, false);
});

t("schema: máximo 2 decimales y coerción de texto del formulario", () => {
  assert.equal(parse(12.345).success, false);
  assert.equal(parse("12.50").success, true);
  assert.equal(parse("12.50").data.monto, 12.5);
  assert.equal(parse(0.07).success, true);
});

t("schema: método solo presencial", () => {
  for (const m of ["efectivo", "pos", "transferencia", "yape_plin"]) assert.equal(parse(10, { metodo: m }).success, true);
  assert.equal(parse(10, { metodo: "culqi_link" }).success, false);
  assert.equal(parse(10, { metodo: "tarjeta" }).success, false);
});

console.log(`pago-presencial: ${n} pruebas OK`);
