// Test sin dependencias: `node src/lib/query-scope.test.mjs` (Node >= 22.18).
// F1 (Día 29D, Etapa 7): la caché de consultas nunca debe servirse a otra cuenta.
import assert from "node:assert/strict";
import test from "node:test";
import {
  SIN_SESION,
  claveActiva,
  claveConAlcance,
  fijarUsuarioActivo,
  usuarioActivoId,
} from "./query-scope.ts";

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";

test("dos usuarios producen claves distintas para la misma consulta", () => {
  assert.notDeepEqual(claveConAlcance(A, "citas-propias"), claveConAlcance(B, "citas-propias"));
  assert.notDeepEqual(
    claveConAlcance(A, "atenciones-paciente", "p1"),
    claveConAlcance(B, "atenciones-paciente", "p1"),
  );
});

test("el mismo usuario produce siempre la misma clave", () => {
  assert.deepEqual(claveConAlcance(A, "pacientes-propios"), claveConAlcance(A, "pacientes-propios"));
  assert.deepEqual(claveConAlcance(A, "x", 1, { r: "mes" }), claveConAlcance(A, "x", 1, { r: "mes" }));
});

test("el userId va como primer segmento y las partes conservan su orden", () => {
  assert.deepEqual(claveConAlcance(A, "cobranza", "cobros"), [A, "cobranza", "cobros"]);
  assert.deepEqual(claveConAlcance(A), [A]);
});

test("userId nulo, indefinido o vacío no comparte clave con un usuario real", () => {
  for (const vacio of [null, undefined, ""]) {
    const k = claveConAlcance(vacio, "citas-propias");
    assert.equal(k[0], SIN_SESION);
    assert.notDeepEqual(k, claveConAlcance(A, "citas-propias"));
    assert.notDeepEqual(k, claveConAlcance(B, "citas-propias"));
  }
  assert.deepEqual(claveConAlcance(null, "z"), claveConAlcance(undefined, "z"));
});

test("el helper no muta sus argumentos ni devuelve el mismo arreglo", () => {
  const parte = { rango: "mes", dias: [1, 2] };
  const copia = structuredClone(parte);
  const k1 = claveConAlcance(A, "metricas", parte);
  const k2 = claveConAlcance(A, "metricas", parte);
  assert.deepEqual(parte, copia);
  assert.notEqual(k1, k2);
  k1.push?.("intruso");
  assert.deepEqual(k2, [A, "metricas", parte]);
});

test("claveActiva usa el usuario fijado y cambia al cambiar de cuenta", () => {
  fijarUsuarioActivo(null);
  assert.equal(usuarioActivoId(), null);
  assert.deepEqual(claveActiva("citas-propias"), [SIN_SESION, "citas-propias"]);
  fijarUsuarioActivo(A);
  assert.deepEqual(claveActiva("citas-propias"), [A, "citas-propias"]);
  fijarUsuarioActivo(B);
  assert.deepEqual(claveActiva("citas-propias"), [B, "citas-propias"]);
  fijarUsuarioActivo(undefined);
  assert.equal(usuarioActivoId(), null);
});

test("la clave de invalidación por prefijo coincide con la de la consulta", () => {
  // invalidateQueries compara por prefijo: [A,"equipo"] debe ser prefijo de [A,"equipo","miembros"].
  fijarUsuarioActivo(A);
  const prefijo = claveActiva("equipo");
  const consulta = claveActiva("equipo", "miembros");
  assert.deepEqual(consulta.slice(0, prefijo.length), prefijo);
  fijarUsuarioActivo(null);
});
