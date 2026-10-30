// Test sin dependencias: `node src/lib/signos-vitales.test.mjs` (Node >= 22.18).
import assert from "node:assert/strict";
import { aNumero, mensajeSignos, prepararSignos, tallaAMetros } from "./signos-vitales.ts";

let n = 0;
const t = (fn) => {
  fn();
  n++;
};

t(() => {
  assert.equal(aNumero(""), null);
  assert.equal(aNumero("  "), null);
  assert.equal(aNumero("36,6"), 36.6);
  assert.equal(aNumero("170"), 170);
  assert.ok(Number.isNaN(aNumero("abc")));
  assert.ok(Number.isNaN(aNumero("-5")));
  assert.ok(Number.isNaN(aNumero("1e3")));
});

t(() => {
  // La base guarda metros: 170 cm -> 1.70; ≤3 se interpreta como metros.
  assert.equal(tallaAMetros(170), 1.7);
  assert.equal(tallaAMetros(1.7), 1.7);
  assert.equal(tallaAMetros(165.5), 1.66);
  assert.equal(tallaAMetros(3), 3);
  assert.equal(tallaAMetros(3.01), 0.03);
});

t(() => {
  const r = prepararSignos({ talla: "170", peso: "70", temperatura: "36,64" });
  assert.equal(r.ok, true);
  assert.deepEqual(r.datos, { talla: 1.7, peso: 70, temperatura: 36.6 });
});

t(() => {
  const r = prepararSignos({ presion_arterial_sistolica: "120", presion_arterial_diastolica: "80", frecuencia_cardiaca: "72", saturacion_oxigeno: "98" });
  assert.equal(r.ok, true);
  assert.equal(r.datos.presion_arterial_sistolica, 120);
});

t(() => {
  // Rangos que valida la RPC.
  for (const [campo, valor] of [
    ["presion_arterial_sistolica", "49"],
    ["presion_arterial_sistolica", "301"],
    ["frecuencia_cardiaca", "19"],
    ["frecuencia_respiratoria", "81"],
    ["temperatura", "29.9"],
    ["temperatura", "45.1"],
    ["saturacion_oxigeno", "101"],
    ["peso", "0.4"],
    ["peso", "401"],
    ["perimetro_abdominal", "19"],
    ["talla", "20"],
    ["talla", "270"],
  ]) {
    const r = prepararSignos({ [campo]: valor });
    assert.equal(r.ok, false, `${campo}=${valor}`);
    assert.ok(r.errores[campo], `${campo}=${valor}`);
  }
});

t(() => {
  // Enteros.
  const r = prepararSignos({ frecuencia_cardiaca: "72.5" });
  assert.equal(r.ok, false);
  assert.match(r.errores.frecuencia_cardiaca, /entero/);
});

t(() => {
  // Presiones: diastólica < sistólica cuando vienen las dos.
  // Una sola presión es válida: la RPC la contrasta con la ya guardada.
  assert.equal(prepararSignos({ presion_arterial_sistolica: "120" }).ok, true);
  assert.equal(prepararSignos({ presion_arterial_diastolica: "80" }).ok, true);
  const r = prepararSignos({ presion_arterial_sistolica: "80", presion_arterial_diastolica: "120" });
  assert.equal(r.ok, false);
  assert.ok(r.errores.presion_arterial_diastolica);
});

t(() => {
  // Vacío total.
  const r = prepararSignos({});
  assert.equal(r.ok, false);
  assert.match(r.errores.general, /al menos un signo/);
  assert.equal(prepararSignos({ peso: "   " }).ok, false);
});

t(() => {
  // Texto no numérico.
  const r = prepararSignos({ peso: "setenta" });
  assert.equal(r.ok, false);
  assert.match(r.errores.peso, /números/);
});

t(() => {
  assert.match(mensajeSignos("atencion_cerrada"), /firmada/);
  assert.match(mensajeSignos("raro"), /No se pudo guardar/);
  assert.match(mensajeSignos(undefined), /No se pudo guardar/);
});

t(() => {
  const r = prepararSignos({ peso: "100", talla: "30" });
  assert.equal(r.ok, false);
  assert.ok(r.errores.talla);
  assert.equal(prepararSignos({ peso: "70", talla: "170" }).ok, true);
});

console.log(`signos-vitales: ${n} bloques OK`);
