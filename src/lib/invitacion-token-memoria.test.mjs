// Test sin dependencias de React: `node src/lib/invitacion-token-memoria.test.mjs`.
// F2 (Día 29D, Etapa 7): el token de invitación no debe quedar en el MutationCache de TanStack Query.
// Se ejercita el mismo núcleo (`@tanstack/query-core`) con la misma opción `gcTime: 0` que usa
// `useCrearInvitacion`, y se comprueba que el código fuente la declare.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { MutationObserver, QueryClient } from "@tanstack/query-core";

const TOKEN = "tok_secreto_de_prueba";
const espera = (ms = 20) => new Promise((r) => setTimeout(r, ms));

// Mismo ciclo que `useMutation`: un observador suscrito y una mutación que devuelve el token.
async function ejecutar(gcTime) {
  const qc = new QueryClient();
  const obs = new MutationObserver(qc, {
    mutationFn: async () => ({ ok: true, token: TOKEN }),
    gcTime,
  });
  const baja = obs.subscribe(() => {});
  await obs.mutate({});
  return { qc, obs, baja };
}

function tokensEnCache(qc) {
  return JSON.stringify(qc.getMutationCache().getAll().map((m) => m.state.data ?? null)).includes(TOKEN);
}

test("mientras no se resetea, el resultado con token sigue en el estado de la mutación", async () => {
  const { qc, obs } = await ejecutar(0);
  assert.equal(obs.getCurrentResult().data.token, TOKEN);
  assert.equal(tokensEnCache(qc), true);
});

test("reset() descarta el token del estado y, con gcTime 0, de la caché de mutaciones", async () => {
  const { qc, obs } = await ejecutar(0);
  obs.reset();
  await espera();
  assert.equal(obs.getCurrentResult().data, undefined);
  assert.equal(tokensEnCache(qc), false);
  assert.equal(qc.getMutationCache().getAll().length, 0);
});

test("sin gcTime 0 la mutación (y su token) queda retenida aunque se haga reset (problema original)", async () => {
  const { qc, obs, baja } = await ejecutar(undefined);
  obs.reset();
  baja();
  await espera();
  assert.equal(tokensEnCache(qc), true, "el token seguiría en memoria hasta el gcTime por defecto");
});

test("con gcTime 0, reset() + desmontar (baja del observador) no deja rastro", async () => {
  const { qc, obs, baja } = await ejecutar(0);
  obs.reset();
  baja();
  await espera();
  assert.equal(qc.getMutationCache().getAll().length, 0);
});

test("el código declara gcTime: 0 y resetea al ocultar y al desmontar", () => {
  const q = readFileSync(new URL("./equipo.queries.ts", import.meta.url), "utf8");
  assert.match(q, /\{ gcTime: 0 \}/);
  const r = readFileSync(new URL("../routes/configuracion.equipo.tsx", import.meta.url), "utf8");
  assert.match(r, /function ocultarEnlace\(\)[\s\S]*?setGenerada\(null\)[\s\S]*?resetCrear\(\)/);
  assert.match(r, /return \(\) => \{\s*setGenerada\(null\);\s*resetCrear\(\);\s*\};/);
  assert.match(r, /onGenerada\([^;]*\);\s*crear\.reset\(\)/);
  assert.match(r, /onCerrar=\{ocultarEnlace\}/);
  assert.ok(!/localStorage|sessionStorage/.test(r), "la pantalla no debe guardar el token en Storage");
});
