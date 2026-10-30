// Test sin dependencias: `node src/lib/equipo-utils.test.mjs` (Node >= 22.18).
import assert from "node:assert/strict";
import {
  enlaceInvitacion,
  enlaceMailto,
  enlaceWhatsapp,
  esCorreo,
  estadoInvitacion,
  mensajeEquipo,
  mensajeInvitacion,
  tokenValido,
  tokenDeHash,
  normalizarTelefono,
} from "./equipo-utils.ts";

let n = 0;
const t = (nombre, fn) => {
  fn();
  n++;
};

const TOKEN = "a".repeat(64);

t("tokenValido acepta 64 hex y rechaza el resto", () => {
  assert.equal(tokenValido(TOKEN), true);
  assert.equal(tokenValido(TOKEN.toUpperCase()), false); // la RPC exige minúsculas
  for (const x of ["", "abc", "g".repeat(64), TOKEN + "a", null, undefined, 12, `${TOKEN}\n`.slice(0, 63)])
    assert.equal(tokenValido(x), false, String(x));
});

t("enlaceInvitacion normaliza barras y codifica", () => {
  assert.equal(enlaceInvitacion("https://x.app/", TOKEN), `https://x.app/unirse#token=${TOKEN}`);
});

t("mensajeInvitacion incluye enlace, rol y caducidad", () => {
  const m = mensajeInvitacion({ enlace: "https://x/unirse#token=1", rol: "recepcion", consultorio: "Dr. Pérez", nombre: "Ana" });
  assert.match(m, /Hola Ana/);
  assert.match(m, /consultorio Dr\. Pérez/);
  assert.match(m, /Recepción/);
  assert.match(m, /72 horas/);
  assert.match(m, /https:\/\/x\/unirse#token=1/);
});

t("enlaceWhatsapp con y sin teléfono", () => {
  assert.match(enlaceWhatsapp("hola", "+51 987 654 321"), /^https:\/\/wa\.me\/51987654321\?text=hola$/);
  assert.match(enlaceWhatsapp("hola", ""), /^https:\/\/wa\.me\/\?text=hola$/);
  assert.match(enlaceWhatsapp("a b&c"), /text=a%20b%26c$/);
});

t("esCorreo", () => {
  assert.equal(esCorreo("ana@clinica.pe"), true);
  assert.equal(esCorreo("ana@clinica"), false);
  assert.equal(esCorreo("ana clinica@x.pe"), false);
  assert.equal(esCorreo(""), false);
});

t("enlaceMailto mantiene @ y codifica asunto y cuerpo", () => {
  const u = enlaceMailto({ para: " ana@clinica.pe ", asunto: "Invitación", cuerpo: "línea1\nhttps://x/?a=1&b=2" });
  assert.ok(u.startsWith("mailto:ana@clinica.pe?subject=Invitaci%C3%B3n&body="));
  assert.ok(u.includes("%0A"));
  assert.ok(u.includes("%26b%3D2"));
});

t("estadoInvitacion", () => {
  const ahora = new Date("2026-10-28T12:00:00Z");
  const base = { usada_en: null, revocada_en: null, expira_en: "2026-10-29T12:00:00Z" };
  assert.equal(estadoInvitacion(base, ahora), "vigente");
  assert.equal(estadoInvitacion({ ...base, expira_en: "2026-10-28T11:59:59Z" }, ahora), "vencida");
  assert.equal(estadoInvitacion({ ...base, usada_en: "2026-10-28T10:00:00Z" }, ahora), "usada");
  assert.equal(estadoInvitacion({ ...base, revocada_en: "2026-10-28T10:00:00Z" }, ahora), "revocada");
});

t("mensajeEquipo no filtra códigos desconocidos", () => {
  assert.match(mensajeEquipo("limite_plan"), /máximo de usuarios/);
  assert.match(mensajeEquipo("loquesea"), /No se pudo completar/);
  assert.match(mensajeEquipo(undefined), /No se pudo completar/);
});

t("esCorreo acepta un solo destinatario y rechaza inyección de cabeceras", () => {
  assert.equal(esCorreo("ana@correo.com"), true);
  assert.equal(esCorreo("a@b.com,otro@x.com"), false);
  assert.equal(esCorreo("a@b.com;otro@x.com"), false);
  assert.equal(esCorreo("<a@b.com>"), false);
  assert.equal(esCorreo("a@b.com\nbcc:x@y.com"), false);
  assert.equal(esCorreo("sin-arroba.com"), false);
});

t("tokenDeHash lee solo tokens válidos del fragmento", () => {
  assert.equal(tokenDeHash(`#token=${TOKEN}`), TOKEN);
  assert.equal(tokenDeHash(`token=${TOKEN}`), TOKEN);
  assert.equal(tokenDeHash("#token=corto"), null);
  assert.equal(tokenDeHash(""), null);
  assert.equal(tokenDeHash("#otro=1"), null);
  assert.equal(tokenDeHash("#token=%E0%A4%A"), null);
});

t("normalizarTelefono: celular peruano sin prefijo y rangos", () => {
  assert.equal(normalizarTelefono("987654321"), "51987654321");
  assert.equal(normalizarTelefono("+51 987 654 321"), "51987654321");
  assert.equal(normalizarTelefono("51987654321"), "51987654321");
  assert.equal(normalizarTelefono("12345"), null);
  assert.equal(normalizarTelefono("1234567890123456"), null);
  assert.equal(normalizarTelefono(""), null);
  assert.equal(normalizarTelefono(null), null);
  assert.match(enlaceWhatsapp("hola", "987654321"), /^https:\/\/wa\.me\/51987654321\?text=hola$/);
  assert.match(enlaceWhatsapp("hola", "12345"), /^https:\/\/wa\.me\/\?text=hola$/);
});

t("esCorreo rechaza dominios mal formados", () => {
  assert.equal(esCorreo("a@b..co"), false);
  assert.equal(esCorreo("a@b.com?x=1"), false);
});

t("tokenDeHash normaliza mayúsculas; teléfonos con 0/00 iniciales", () => {
  assert.equal(tokenDeHash(`#token=${TOKEN.toUpperCase()}`), TOKEN);
  assert.equal(tokenValido(TOKEN.toUpperCase()), false);
  assert.equal(normalizarTelefono("0987654321"), "51987654321");
  assert.equal(normalizarTelefono("0051987654321"), "51987654321");
});

console.log(`equipo-utils: ${n} pruebas OK`);
