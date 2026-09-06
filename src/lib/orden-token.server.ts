/**
 * Token de acceso temporal para las órdenes impresas que el radiólogo abre
 * escaneando el QR (sin cuenta en el sistema).
 *
 * Es un HMAC-SHA256 de `<ordenId>.<vencimiento>` firmado con una clave que solo
 * existe en el servidor. No se guarda nada en base de datos: el token se
 * verifica recalculando la firma. Si alguien cambia el id o la fecha de
 * vencimiento, la firma deja de coincidir y el acceso se rechaza.
 */

const VIGENCIA_MS = 1000 * 60 * 60 * 24 * 90; // 90 días

function claveFirma(): string {
  const secreto =
    process.env["ORDEN_ACCESO_SECRET"] ?? process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!secreto) throw new Error("Falta la clave de firma de órdenes en el servidor.");
  return secreto;
}

async function firmar(mensaje: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(claveFirma()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const firma = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(mensaje),
  );
  return [...new Uint8Array(firma)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function crearTokenOrden(ordenId: string): Promise<string> {
  const vence = Date.now() + VIGENCIA_MS;
  const firma = await firmar(`${ordenId}.${vence}`);
  return `${vence}.${firma.slice(0, 40)}`;
}

export async function verificarTokenOrden(
  ordenId: string,
  token: string,
): Promise<boolean> {
  const [venceRaw, firma] = token.split(".");
  if (!venceRaw || !firma) return false;
  const vence = Number(venceRaw);
  if (!Number.isFinite(vence) || vence < Date.now()) return false;
  const esperado = (await firmar(`${ordenId}.${vence}`)).slice(0, 40);
  if (esperado.length !== firma.length) return false;
  let iguales = 0;
  for (let i = 0; i < esperado.length; i += 1) {
    iguales |= esperado.charCodeAt(i) ^ firma.charCodeAt(i);
  }
  return iguales === 0;
}
