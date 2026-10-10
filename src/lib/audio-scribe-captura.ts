// Lógica PURA de captura de audio (Día 27A). Sin React, sin Supabase, sin alias "@/".
// Node la ejecuta directo (solo borrado de tipos): nada de enums ni parameter properties.
import { MENSAJE_ERROR } from "./audio-scribe-schemas.ts";
import type { AudioCodigoError, AudioFormato, AudioResultado } from "./audio-scribe-schemas.ts";

export type EstadoCaptura =
  | "inactivo"
  | "solicitando_permiso"
  | "grabando"
  | "finalizando"
  | "finalizada"
  | "error";

/** Tope de fragmentos en cola y de intentos por fragmento (contrato §7.3). */
export const MAX_COLA = 40;
export const MAX_INTENTOS = 6;
/** Parámetros de compresión del contrato §7.2. */
export const BITS_POR_SEGUNDO = 24000;
export const TIMESLICE_MS = 15000;
export const SAMPLE_RATE = 16000;
/** Tope de espera de la cola al finalizar (contrato §7.5). */
export const TOPE_ESPERA_COLA_MS = 30000;

const EXTENSIONES: Record<AudioFormato, string> = {
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/mp4": "m4a",
};

const MIME_RECORDER: Record<AudioFormato, string> = {
  "audio/webm": "audio/webm;codecs=opus",
  "audio/ogg": "audio/ogg;codecs=opus",
  "audio/mp4": "audio/mp4",
};

/** Elige el formato soportado: webm/opus, luego ogg/opus, luego mp4 (Safari). */
export function elegirMime(isTypeSupported: (mime: string) => boolean): AudioFormato | null {
  if (isTypeSupported("audio/webm;codecs=opus")) return "audio/webm";
  if (isTypeSupported("audio/ogg;codecs=opus")) return "audio/ogg";
  if (isTypeSupported("audio/mp4")) return "audio/mp4";
  return null;
}

/** MIME completo (con codec) que se le pasa al MediaRecorder. */
export function mimeRecorder(formato: AudioFormato): string {
  return MIME_RECORDER[formato];
}

/** Quita el parámetro de codec: "audio/webm;codecs=opus" -> "audio/webm". */
export function mimeSinCodec(mime: string): string {
  return mime.split(";")[0].trim().toLowerCase();
}

export function esFormato(valor: string): valor is AudioFormato {
  return Object.hasOwn(EXTENSIONES, valor);
}

export function extension(formato: AudioFormato): string {
  return EXTENSIONES[formato];
}

/** `{prefijo}{secuencia:06d}.{ext}`; el prefijo ya trae su "/" final. */
export function rutaObjeto(prefijo: string, secuencia: number, formato: AudioFormato): string {
  const seq = String(Math.max(0, Math.trunc(secuencia))).padStart(6, "0");
  return `${prefijo}${seq}.${extension(formato)}`;
}

/** Backoff exponencial acotado: 100, 200, 400, 800, 1600, 3200 ms… (máx. 5000). */
export function calcularBackoff(intento: number): number {
  const n = Number.isFinite(intento) && intento >= 1 ? Math.trunc(intento) : 1;
  return Math.min(100 * Math.pow(2, n - 1), 5000);
}

/** Cronómetro legible: "00:05", "12:34", "1:02:03". */
export function formatearCronometro(segundos: number): string {
  const total = Number.isFinite(segundos) && segundos > 0 ? Math.trunc(segundos) : 0;
  const h = Math.trunc(total / 3600);
  const m = Math.trunc((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export type ItemCola = { secuencia: number; blob: Blob; sha256: string };

/** Lanzar desde la función de subida para NO reintentar y vaciar la cola (p. ej. sesión cerrada). */
export class SubidaFatal extends Error {
  constructor() {
    super("subida_fatal");
    this.name = "SubidaFatal";
  }
}

export type OpcionesCola = {
  maxIntentos?: number;
  maxCola?: number;
  /** Espera entre intentos; inyectable para pruebas. */
  esperar?: (ms: number) => Promise<void>;
  /** Se invoca cuando un fragmento se descarta (intentos agotados o fatal). */
  onFallo?: (secuencia: number, fatal: boolean) => void;
};

type Esperador = { resolver: (vacia: boolean) => void; temporizador: ReturnType<typeof setTimeout> };

/**
 * Cola en memoria (NUNCA persistida) de fragmentos por subir. Secuencial,
 * con reintentos acotados. Los fragmentos que agotan intentos se descartan y
 * quedan en `fallidos` (el servidor lo verá como hueco de secuencia).
 */
export class ColaSubida {
  #cola: ItemCola[] = [];
  #procesando = false;
  #cancelada = false;
  #exitosos = 0;
  #fallidos: number[] = [];
  #esperadores: Esperador[] = [];
  #subir: (secuencia: number, blob: Blob, sha256: string) => Promise<void>;
  #maxIntentos: number;
  #maxCola: number;
  #esperar: (ms: number) => Promise<void>;
  #onFallo: ((secuencia: number, fatal: boolean) => void) | undefined;

  constructor(
    subir: (secuencia: number, blob: Blob, sha256: string) => Promise<void>,
    opciones?: OpcionesCola,
  ) {
    this.#subir = subir;
    this.#maxIntentos = opciones?.maxIntentos ?? MAX_INTENTOS;
    this.#maxCola = opciones?.maxCola ?? MAX_COLA;
    this.#esperar = opciones?.esperar ?? ((ms) => new Promise<void>((r) => setTimeout(r, ms)));
    this.#onFallo = opciones?.onFallo;
  }

  /** Encola un fragmento. Devuelve false si la cola está llena o cancelada (se pierde: hueco). */
  add(item: ItemCola): boolean {
    if (this.#cancelada || this.#cola.length >= this.#maxCola) return false;
    this.#cola.push(item);
    void this.#procesar();
    return true;
  }

  /** Fragmentos pendientes (incluye el que está en vuelo). */
  get size(): number {
    return this.#cola.length;
  }
  get exitosos(): number {
    return this.#exitosos;
  }
  get fallidos(): number[] {
    return [...this.#fallidos];
  }
  get cancelada(): boolean {
    return this.#cancelada;
  }

  /** Descarta lo pendiente y rechaza nuevos fragmentos. Idempotente. */
  cancelar(): void {
    this.#cancelada = true;
    this.#cola.length = 0;
    this.#notificar();
  }

  /** Resuelve true cuando la cola queda vacía y ociosa; false si pasa `topeMs` antes. */
  esperarVaciado(topeMs: number): Promise<boolean> {
    if (this.#inactiva()) return Promise.resolve(true);
    return new Promise<boolean>((resolver) => {
      const esperador: Esperador = {
        resolver,
        temporizador: setTimeout(() => {
          this.#esperadores = this.#esperadores.filter((e) => e !== esperador);
          resolver(false);
        }, topeMs),
      };
      this.#esperadores.push(esperador);
    });
  }

  #inactiva(): boolean {
    return this.#cola.length === 0 && !this.#procesando;
  }

  #notificar(): void {
    if (!this.#inactiva()) return;
    const lista = this.#esperadores;
    this.#esperadores = [];
    for (const e of lista) {
      clearTimeout(e.temporizador);
      e.resolver(true);
    }
  }

  async #procesar(): Promise<void> {
    if (this.#procesando) return;
    this.#procesando = true;
    try {
      while (this.#cola.length > 0 && !this.#cancelada) {
        const item = this.#cola[0];
        let ok = false;
        let fatal = false;
        for (let intento = 1; intento <= this.#maxIntentos; intento++) {
          if (this.#cancelada) break;
          try {
            await this.#subir(item.secuencia, item.blob, item.sha256);
            ok = true;
            break;
          } catch (e) {
            if (e instanceof SubidaFatal) {
              fatal = true;
              break;
            }
            if (intento === this.#maxIntentos) break;
            await this.#esperar(calcularBackoff(intento));
          }
        }
        if (this.#cancelada) break;
        this.#cola.shift();
        if (ok) {
          this.#exitosos++;
        } else {
          this.#fallidos.push(item.secuencia);
          this.#onFallo?.(item.secuencia, fatal);
        }
        if (fatal) this.cancelar();
      }
    } finally {
      this.#procesando = false;
      this.#notificar();
    }
  }
}

/** SHA-256 en hex minúsculas (64 caracteres) de un Blob, ArrayBuffer o vista binaria. */
export async function sha256Hex(datos: Blob | BufferSource): Promise<string> {
  const buffer: BufferSource = datos instanceof Blob ? await datos.arrayBuffer() : datos;
  const resumen = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(resumen))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ───────────────────────── Códigos de error y respuestas de RPC ─────────────────────────

/** ¿Es `valor` uno de los 18 códigos del contrato? */
export function esCodigoAudio(valor: unknown): valor is AudioCodigoError {
  return typeof valor === "string" && Object.hasOwn(MENSAJE_ERROR, valor);
}

/**
 * Mapea un error de TRANSPORTE (red, PostgREST, JWT) a un código del contrato.
 * Nunca se propaga ni se muestra el texto del error original.
 */
export function codigoDeErrorTransporte(error: unknown): AudioCodigoError {
  if (error && typeof error === "object") {
    const e = error as { code?: unknown; status?: unknown };
    const code = typeof e.code === "string" ? e.code : "";
    const status = typeof e.status === "number" ? e.status : 0;
    if (code === "42501" || code.startsWith("PGRST30") || status === 401 || status === 403) {
      return "no_autorizado";
    }
  }
  return "parametro_invalido";
}

/** Normaliza el jsonb devuelto por un RPC; todo lo inesperado es `parametro_invalido`. */
export function normalizarRespuesta<T extends object>(data: unknown): AudioResultado<T> {
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const d = data as { ok?: unknown; codigo?: unknown };
    if (d.ok === true) return data as AudioResultado<T>;
    if (d.ok === false) {
      return { ok: false, codigo: esCodigoAudio(d.codigo) ? d.codigo : "parametro_invalido" };
    }
  }
  return { ok: false, codigo: "parametro_invalido" };
}

/** Códigos con los que reintentar un fragmento no sirve: se detiene toda la captura. */
const CODIGOS_FATALES_FRAGMENTO: ReadonlySet<string> = new Set([
  "sesion_cerrada",
  "consentimiento_revocado",
  "sesion_no_encontrada",
  "limite_excedido",
  "no_autorizado",
  "funcion_desactivada",
]);

export function esCodigoFatalFragmento(codigo: AudioCodigoError): boolean {
  return CODIGOS_FATALES_FRAGMENTO.has(codigo);
}

/** Extrae el HTTP status de un error de Storage (statusCode del cuerpo tiene prioridad). */
export function estadoHttpDeError(error: unknown): number | null {
  if (!error || typeof error !== "object") return null;
  const e = error as { statusCode?: unknown; status?: unknown };
  for (const cand of [e.statusCode, e.status]) {
    const n = typeof cand === "string" ? Number(cand) : cand;
    if (typeof n === "number" && Number.isInteger(n) && n >= 100 && n <= 599) return n;
  }
  return null;
}

export type ClaseErrorSubida = "ya_existe" | "fatal" | "reintentar";

/** 409 = el objeto ya está (reintento idempotente); 401/403 = RLS/sesión: no reintentar. */
export function clasificarErrorSubida(error: unknown): ClaseErrorSubida {
  const estado = estadoHttpDeError(error);
  if (estado === 409) return "ya_existe";
  if (estado === 401 || estado === 403) return "fatal";
  return "reintentar";
}
