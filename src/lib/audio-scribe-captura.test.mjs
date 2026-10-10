// Pruebas del módulo puro audio-scribe-captura.ts.
// Ejecutar: node --test src/lib/audio-scribe-captura.test.mjs
// Node >= 22.6 ejecuta .ts quitando tipos (--experimental-strip-types activado por defecto en 22.6+).
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  calcularBackoff,
  clasificarErrorSubida,
  ColaSubida,
  esCodigoFatalFragmento,
  esFormato,
  extension,
  formatearCronometro,
  MAX_COLA,
  MAX_INTENTOS,
  mimeSinCodec,
  normalizarRespuesta,
  mimeRecorder,
  rutaObjeto,
  sha256Hex,
  SubidaFatal,
  elegirMime,
  codigoDeErrorTransporte,
} from "./audio-scribe-captura.ts";

// ─────────────────── elegirMime ───────────────────
describe("elegirMime", () => {
  it("devuelve webm cuando solo acepta webm/opus", () => {
    assert.equal(elegirMime((m) => m === "audio/webm;codecs=opus"), "audio/webm");
  });
  it("devuelve ogg cuando webm no está soportado", () => {
    assert.equal(elegirMime((m) => m === "audio/ogg;codecs=opus"), "audio/ogg");
  });
  it("devuelve mp4 para Safari (sin webm ni ogg)", () => {
    assert.equal(elegirMime((m) => m === "audio/mp4"), "audio/mp4");
  });
  it("devuelve null cuando ningún formato es soportado", () => {
    assert.equal(elegirMime(() => false), null);
  });
});

// ─────────────────── mimeRecorder / mimeSinCodec / esFormato ───────────────────
describe("mimeRecorder y mimeSinCodec", () => {
  it("webm con codec", () => assert.equal(mimeRecorder("audio/webm"), "audio/webm;codecs=opus"));
  it("ogg con codec",  () => assert.equal(mimeRecorder("audio/ogg"),  "audio/ogg;codecs=opus"));
  it("mp4 tal cual",   () => assert.equal(mimeRecorder("audio/mp4"),  "audio/mp4"));
  it("elimina codec de webm", () => assert.equal(mimeSinCodec("audio/webm;codecs=opus"), "audio/webm"));
  it("elimina codec de ogg",  () => assert.equal(mimeSinCodec("audio/ogg;codecs=opus"),  "audio/ogg"));
  it("no cambia mp4",         () => assert.equal(mimeSinCodec("audio/mp4"), "audio/mp4"));
  it("esFormato webm",  () => assert.ok(esFormato("audio/webm")));
  it("esFormato false para string aleatorio", () => assert.ok(!esFormato("audio/wav")));
});

// ─────────────────── extension / rutaObjeto ───────────────────
describe("extension y rutaObjeto", () => {
  it("webm -> webm", () => assert.equal(extension("audio/webm"), "webm"));
  it("ogg -> ogg",   () => assert.equal(extension("audio/ogg"),  "ogg"));
  it("mp4 -> m4a",   () => assert.equal(extension("audio/mp4"),  "m4a"));
  it("secuencia 0 → 000000", () =>
    assert.equal(rutaObjeto("t/", 0, "audio/webm"), "t/000000.webm"));
  it("secuencia 1 → 000001", () =>
    assert.equal(rutaObjeto("x/y/", 1, "audio/ogg"), "x/y/000001.ogg"));
  it("secuencia 999999", () =>
    assert.equal(rutaObjeto("a/", 999999, "audio/mp4"), "a/999999.m4a"));
  it("secuencia negativa → 000000", () =>
    assert.equal(rutaObjeto("p/", -5, "audio/webm"), "p/000000.webm"));
});

// ─────────────────── calcularBackoff ───────────────────
describe("calcularBackoff", () => {
  it("intento 1 → 100ms",  () => assert.equal(calcularBackoff(1), 100));
  it("intento 2 → 200ms",  () => assert.equal(calcularBackoff(2), 200));
  it("intento 3 → 400ms",  () => assert.equal(calcularBackoff(3), 400));
  it("intento 6 → 3200ms", () => assert.equal(calcularBackoff(6), 3200));
  it("intento 20 → tope 5000ms", () => assert.equal(calcularBackoff(20), 5000));
  it("intento cero devuelve 100", () => assert.equal(calcularBackoff(0), 100));
});

// ─────────────────── formatearCronometro ───────────────────
describe("formatearCronometro", () => {
  it("0s → 00:00", () => assert.equal(formatearCronometro(0), "00:00"));
  it("5s → 00:05", () => assert.equal(formatearCronometro(5), "00:05"));
  it("65s → 01:05", () => assert.equal(formatearCronometro(65), "01:05"));
  it("3661s → 1:01:01", () => assert.equal(formatearCronometro(3661), "1:01:01"));
  it("negativo → 00:00", () => assert.equal(formatearCronometro(-1), "00:00"));
  it("NaN → 00:00", () => assert.equal(formatearCronometro(NaN), "00:00"));
});

// ─────────────────── esCodigoFatalFragmento ───────────────────
describe("esCodigoFatalFragmento", () => {
  it("sesion_cerrada es fatal", ()          => assert.ok(esCodigoFatalFragmento("sesion_cerrada")));
  it("consentimiento_revocado es fatal", () => assert.ok(esCodigoFatalFragmento("consentimiento_revocado")));
  it("no_autorizado es fatal", ()           => assert.ok(esCodigoFatalFragmento("no_autorizado")));
  it("parametro_invalido NO es fatal", ()   => assert.ok(!esCodigoFatalFragmento("parametro_invalido")));
  it("secuencia_invalida NO es fatal", ()   => assert.ok(!esCodigoFatalFragmento("secuencia_invalida")));
});

// ─────────────────── codigoDeErrorTransporte ───────────────────
describe("codigoDeErrorTransporte", () => {
  it("status 401 → no_autorizado", () =>
    assert.equal(codigoDeErrorTransporte({ status: 401 }), "no_autorizado"));
  it("status 403 → no_autorizado", () =>
    assert.equal(codigoDeErrorTransporte({ status: 403 }), "no_autorizado"));
  it("status 500 → parametro_invalido", () =>
    assert.equal(codigoDeErrorTransporte({ status: 500 }), "parametro_invalido"));
  it("code PGRST301 → no_autorizado", () =>
    assert.equal(codigoDeErrorTransporte({ code: "PGRST301" }), "no_autorizado"));
  it("null → parametro_invalido", () =>
    assert.equal(codigoDeErrorTransporte(null), "parametro_invalido"));
});

// ─────────────────── clasificarErrorSubida ───────────────────
describe("clasificarErrorSubida", () => {
  it("statusCode '409' → ya_existe", () =>
    assert.equal(clasificarErrorSubida({ statusCode: "409" }), "ya_existe"));
  it("statusCode '401' → fatal", () =>
    assert.equal(clasificarErrorSubida({ statusCode: "401" }), "fatal"));
  it("statusCode '500' → reintentar", () =>
    assert.equal(clasificarErrorSubida({ statusCode: "500" }), "reintentar"));
  it("error de red sin código → reintentar", () =>
    assert.equal(clasificarErrorSubida(new Error("timeout")), "reintentar"));
});

// ─────────────────── normalizarRespuesta ───────────────────
describe("normalizarRespuesta", () => {
  it("objeto {ok:true, ...} pasa tal cual", () => {
    const r = normalizarRespuesta({ ok: true, sesion_id: "x" });
    assert.ok(r.ok);
    assert.equal(r.sesion_id, "x");
  });
  it("objeto {ok:false, codigo válido}", () => {
    const r = normalizarRespuesta({ ok: false, codigo: "no_autorizado" });
    assert.ok(!r.ok);
    if (!r.ok) assert.equal(r.codigo, "no_autorizado");
  });
  it("codigo desconocido → parametro_invalido", () => {
    const r = normalizarRespuesta({ ok: false, codigo: "codigo_que_no_existe" });
    if (!r.ok) assert.equal(r.codigo, "parametro_invalido");
  });
  it("null → parametro_invalido", () => {
    const r = normalizarRespuesta(null);
    if (!r.ok) assert.equal(r.codigo, "parametro_invalido");
  });
});

// ─────────────────── sha256Hex ───────────────────
describe("sha256Hex", () => {
  it("hash conocido de 'abc'", async () => {
    const h = await sha256Hex(new TextEncoder().encode("abc"));
    assert.equal(h, "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });
  it("hash conocido de cadena vacía", async () => {
    const h = await sha256Hex(new TextEncoder().encode(""));
    assert.equal(h, "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
  });
  it("mismo hash para ArrayBuffer y Blob", async () => {
    const datos = new TextEncoder().encode("hola");
    const h1 = await sha256Hex(datos.buffer);
    const h2 = await sha256Hex(new Blob([datos]));
    assert.equal(h1, h2);
  });
  it("tiene exactamente 64 caracteres hex", async () => {
    const h = await sha256Hex(new Uint8Array([1, 2, 3]));
    assert.equal(h.length, 64);
    assert.ok(/^[0-9a-f]+$/.test(h));
  });
});

// ─────────────────── SubidaFatal ───────────────────
describe("SubidaFatal", () => {
  it("es instancia de Error", () => {
    const e = new SubidaFatal();
    assert.ok(e instanceof Error);
    assert.ok(e instanceof SubidaFatal);
  });
  it("name es SubidaFatal", () => {
    assert.equal(new SubidaFatal().name, "SubidaFatal");
  });
});

// ─────────────────── ColaSubida ───────────────────
describe("ColaSubida", () => {
  const noEsperar = () => Promise.resolve();
  const blobVacio = new Blob([], { type: "audio/webm" });

  it("sube un fragmento exitosamente", async () => {
    let llamadas = 0;
    const cola = new ColaSubida(async () => { llamadas++; }, { esperar: noEsperar });
    cola.add({ secuencia: 0, blob: blobVacio, sha256: "a".repeat(64) });
    await cola.esperarVaciado(1000);
    assert.equal(llamadas, 1);
    assert.equal(cola.exitosos, 1);
  });

  it("respeta el tope de cola MAX_COLA", () => {
    const cola = new ColaSubida(() => new Promise(() => {}), { esperar: noEsperar });
    let aceptados = 0;
    for (let i = 0; i < MAX_COLA + 5; i++) {
      if (cola.add({ secuencia: i, blob: blobVacio, sha256: "f".repeat(64) })) aceptados++;
    }
    assert.equal(aceptados, MAX_COLA);
    assert.equal(cola.size, MAX_COLA);
    cola.cancelar();
    assert.equal(cola.size, 0);
  });

  it("reintenta hasta MAX_INTENTOS y luego descarta", async () => {
    let intentos = 0;
    const cola = new ColaSubida(
      async () => { intentos++; throw new Error("temporal"); },
      { esperar: noEsperar },
    );
    cola.add({ secuencia: 0, blob: blobVacio, sha256: "b".repeat(64) });
    await cola.esperarVaciado(5000);
    assert.equal(intentos, MAX_INTENTOS);
    assert.deepEqual(cola.fallidos, [0]);
  });

  it("SubidaFatal cancela la cola inmediatamente", async () => {
    let llamadas = 0;
    const cola = new ColaSubida(
      async () => { llamadas++; throw new SubidaFatal(); },
      { esperar: noEsperar },
    );
    cola.add({ secuencia: 0, blob: blobVacio, sha256: "c".repeat(64) });
    cola.add({ secuencia: 1, blob: blobVacio, sha256: "d".repeat(64) });
    await cola.esperarVaciado(5000);
    // Solo 1 intento al primer fragmento (SubidaFatal no reintenta).
    assert.equal(llamadas, 1);
    assert.ok(cola.cancelada);
  });

  it("cancelar rechaza nuevos add", async () => {
    const cola = new ColaSubida(async () => {}, { esperar: noEsperar });
    cola.cancelar();
    const aceptado = cola.add({ secuencia: 0, blob: blobVacio, sha256: "e".repeat(64) });
    assert.ok(!aceptado);
  });

  it("esperarVaciado resuelve true si ya estaba vacía", async () => {
    const cola = new ColaSubida(async () => {}, { esperar: noEsperar });
    const res = await cola.esperarVaciado(100);
    assert.ok(res);
  });

  it("esperarVaciado resuelve false tras el tope", async () => {
    const cola = new ColaSubida(() => new Promise((r) => setTimeout(r, 500)), { esperar: noEsperar });
    cola.add({ secuencia: 0, blob: blobVacio, sha256: "f".repeat(64) });
    const res = await cola.esperarVaciado(50);
    assert.ok(!res);
    cola.cancelar();
  });
});
