// Hook de captura de audio real (Día 27A, contrato §7 y §10). API fija: NO cambiar.
//
// Orden estricto (el consentimiento YA lo registró la UI):
//   ② getUserMedia → ③ audio_iniciar_sesion → ④ recién entonces MediaRecorder.
// Si algo falla antes de grabar: se liberan TODAS las pistas y no se sube nada.
// El audio vive solo en memoria: jamás se persiste en almacenamiento del navegador.
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { AudioCodigoError, AudioFormato } from "./audio-scribe-schemas";
import {
  BITS_POR_SEGUNDO,
  ColaSubida,
  SAMPLE_RATE,
  SubidaFatal,
  TIMESLICE_MS,
  TOPE_ESPERA_COLA_MS,
  clasificarErrorSubida,
  elegirMime,
  esCodigoFatalFragmento,
  mimeRecorder,
  rutaObjeto,
  sha256Hex,
  type EstadoCaptura,
} from "./audio-scribe-captura";
import {
  audioDescartarSesion,
  audioFinalizarSesion,
  audioIniciarSesion,
  audioRegistrarFragmento,
  audioRevocarConsentimiento,
  audioVincularAtencion,
} from "./audio-scribe.queries";

export type { EstadoCaptura } from "./audio-scribe-captura";

const BUCKET = "audio-consultas";
const ESPERA_STOP_RECORDER_MS = 5000;

type Recursos = {
  stream: MediaStream | null;
  ctx: AudioContext | null;
  fuente: MediaStreamAudioSourceNode | null;
  destino: MediaStreamAudioDestinationNode | null;
  recorder: MediaRecorder | null;
  cola: ColaSubida | null;
  temporizador: ReturnType<typeof setInterval> | null;
  formato: AudioFormato | null;
  prefijo: string;
  consentimientoId: string | null;
  siguienteSeq: number;
  duraciones: Map<number, number>;
  ultimoCorte: number;
  inicio: number;
  cadena: Promise<void>;
  descartarDatos: boolean;
  vinculada: boolean;
};

function recursosVacios(): Recursos {
  return {
    stream: null,
    ctx: null,
    fuente: null,
    destino: null,
    recorder: null,
    cola: null,
    temporizador: null,
    formato: null,
    prefijo: "",
    consentimientoId: null,
    siguienteSeq: 0,
    duraciones: new Map(),
    ultimoCorte: 0,
    inicio: 0,
    cadena: Promise.resolve(),
    descartarDatos: false,
    vinculada: false,
  };
}

/** Apaga micrófono, grafo de audio, recorder y cronómetro. Idempotente. */
function liberarRecursos(c: Recursos): void {
  if (c.temporizador) {
    clearInterval(c.temporizador);
    c.temporizador = null;
  }
  if (c.recorder) {
    c.recorder.ondataavailable = null;
    c.recorder.onerror = null;
    c.recorder.onstop = null;
    try {
      if (c.recorder.state !== "inactive") c.recorder.stop();
    } catch {
      // ya detenido
    }
    c.recorder = null;
  }
  if (c.stream) {
    for (const pista of c.stream.getTracks()) {
      pista.onended = null;
      try {
        pista.stop();
      } catch {
        // ya detenida
      }
    }
    c.stream = null;
  }
  try {
    c.fuente?.disconnect();
  } catch {
    // ya desconectada
  }
  c.fuente = null;
  c.destino = null;
  if (c.ctx) {
    const ctx = c.ctx;
    c.ctx = null;
    if (ctx.state !== "closed") void ctx.close().catch(() => undefined);
  }
}

export function useAudioScribeCaptura(opts: { atencionId: string | null }): {
  estado: EstadoCaptura;
  segundos: number;
  sesionId: string | null;
  codigoError: AudioCodigoError | null;
  iniciar(consentimientoId: string): Promise<void>;
  detener(): Promise<void>;
  retirarPermiso(consentimientoId: string): Promise<void>;
  vincular(atencionId: string): Promise<void>;
} {
  const [estado, setEstadoState] = useState<EstadoCaptura>("inactivo");
  const [segundos, setSegundos] = useState(0);
  const [sesionId, setSesionId] = useState<string | null>(null);
  const [codigoError, setCodigoError] = useState<AudioCodigoError | null>(null);

  const estadoRef = useRef<EstadoCaptura>("inactivo");
  const sesionRef = useRef<string | null>(null);
  const recRef = useRef<Recursos>(recursosVacios());
  const tokenRef = useRef(0);
  const montadoRef = useRef(false);
  const ocupadoRef = useRef(false);
  const atencionRef = useRef<string | null>(opts.atencionId);
  const detenerRef = useRef<() => Promise<void>>(() => Promise.resolve());
  atencionRef.current = opts.atencionId;

  const leerEstado = (): EstadoCaptura => estadoRef.current;

  const fijarEstado = useCallback((e: EstadoCaptura) => {
    estadoRef.current = e;
    if (montadoRef.current) setEstadoState(e);
  }, []);

  const fijarError = useCallback((codigo: AudioCodigoError | null) => {
    if (montadoRef.current) setCodigoError(codigo);
  }, []);

  /** Termina la captura por un error: libera todo y deja el estado en "error". */
  const abortarConError = useCallback(
    (codigo: AudioCodigoError, finalizarEnServidor: boolean) => {
      const c = recRef.current;
      c.descartarDatos = true;
      c.cola?.cancelar();
      liberarRecursos(c);
      const id = sesionRef.current;
      if (finalizarEnServidor && id) {
        void audioFinalizarSesion(id, c.siguienteSeq, Math.max(0, Math.round(performance.now() - c.inicio)));
      }
      fijarError(codigo);
      fijarEstado("error");
    },
    [fijarError, fijarEstado],
  );

  const iniciar = useCallback(
    async (consentimientoId: string): Promise<void> => {
      if (ocupadoRef.current) return;
      const actual = estadoRef.current;
      if (actual === "solicitando_permiso" || actual === "grabando" || actual === "finalizando") return;
      ocupadoRef.current = true;

      const token = ++tokenRef.current;
      const c = recursosVacios();
      recRef.current = c;
      c.consentimientoId = consentimientoId;
      sesionRef.current = null;
      if (montadoRef.current) {
        setSesionId(null);
        setSegundos(0);
      }
      fijarError(null);
      fijarEstado("solicitando_permiso");

      const abortado = () => token !== tokenRef.current || !montadoRef.current;
      const fallar = (codigo: AudioCodigoError) => {
        liberarRecursos(c);
        if (token === tokenRef.current) {
          fijarError(codigo);
          fijarEstado("error");
        }
      };

      try {
        // Soporte del navegador (antes de pedir el micrófono).
        const hayMedios = typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;
        const hayRecorder = typeof MediaRecorder !== "undefined";
        const formato = hayRecorder ? elegirMime((m) => MediaRecorder.isTypeSupported(m)) : null;
        if (!hayMedios || !hayRecorder || !formato) {
          fallar("parametro_invalido");
          return;
        }
        c.formato = formato;

        // ② Micrófono.
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
          });
        } catch (e) {
          const nombre = e && typeof e === "object" ? (e as { name?: unknown }).name : null;
          fallar(nombre === "NotAllowedError" || nombre === "SecurityError" ? "no_autorizado" : "parametro_invalido");
          return;
        }
        c.stream = stream;
        if (abortado()) {
          liberarRecursos(c);
          return;
        }

        // Grafo de compresión: AudioContext 16 kHz → MediaStreamAudioDestinationNode.
        // Aún NO se graba nada; si el navegador no admite el grafo se graba la pista directa.
        let origen: MediaStream = stream;
        try {
          const Ctor: typeof AudioContext | undefined =
            typeof AudioContext !== "undefined"
              ? AudioContext
              : (globalThis as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
          if (Ctor) {
            const ctx = new Ctor({ sampleRate: SAMPLE_RATE });
            c.ctx = ctx;
            const fuente = ctx.createMediaStreamSource(stream);
            const destino = ctx.createMediaStreamDestination();
            fuente.connect(destino);
            c.fuente = fuente;
            c.destino = destino;
            origen = destino.stream;
            if (ctx.state === "suspended") await ctx.resume().catch(() => undefined);
          }
        } catch {
          try {
            c.fuente?.disconnect();
          } catch {
            // nada que desconectar
          }
          c.fuente = null;
          c.destino = null;
          if (c.ctx && c.ctx.state !== "closed") void c.ctx.close().catch(() => undefined);
          c.ctx = null;
          origen = stream;
        }
        if (abortado()) {
          liberarRecursos(c);
          return;
        }

        // ③ Sesión en el servidor.
        const r = await audioIniciarSesion(consentimientoId, atencionRef.current, formato);
        if (!r.ok) {
          fallar(r.codigo);
          return;
        }
        sesionRef.current = r.sesion_id;
        c.prefijo = r.prefijo_ruta;
        c.vinculada = atencionRef.current !== null;
        if (abortado()) {
          liberarRecursos(c);
          void audioDescartarSesion(r.sesion_id);
          return;
        }
        if (montadoRef.current) setSesionId(r.sesion_id);

        // Cola de subida (memoria): Storage + audio_registrar_fragmento.
        const sesion = r.sesion_id;
        c.cola = new ColaSubida(
          async (secuencia, blob, sha256) => {
            const ruta = rutaObjeto(c.prefijo, secuencia, formato);
            const { error } = await supabase.storage
              .from(BUCKET)
              .upload(ruta, blob, { contentType: formato, upsert: false });
            if (error) {
              const clase = clasificarErrorSubida(error);
              if (clase === "fatal") {
                if (token === tokenRef.current) abortarConError("no_autorizado", true);
                throw new SubidaFatal();
              }
              if (clase === "reintentar") throw new Error("subida_fallida");
              // "ya_existe": un intento previo sí llegó; solo falta registrarlo.
            }
            const reg = await audioRegistrarFragmento({
              sesionId: sesion,
              secuencia,
              ruta,
              bytes: blob.size,
              duracionMs: c.duraciones.get(secuencia) ?? 0,
              sha256,
            });
            if (!reg.ok) {
              if (esCodigoFatalFragmento(reg.codigo)) {
                // sesion_cerrada / consentimiento_revocado: detener todo ya, sin finalizar (el servidor ya cerró).
                const yaCerrada = reg.codigo === "sesion_cerrada" || reg.codigo === "consentimiento_revocado";
                if (token === tokenRef.current) abortarConError(reg.codigo, !yaCerrada);
                throw new SubidaFatal();
              }
              throw new Error("registro_fallido");
            }
            c.duraciones.delete(secuencia);
          },
        );

        // ④ Recién ahora arranca el MediaRecorder.
        const recorder = new MediaRecorder(origen, {
          mimeType: mimeRecorder(formato),
          audioBitsPerSecond: BITS_POR_SEGUNDO,
        });
        c.recorder = recorder;
        recorder.ondataavailable = (ev: BlobEvent) => {
          if (c.descartarDatos || token !== tokenRef.current) return;
          const blob = ev.data;
          if (!blob || blob.size === 0) return;
          const secuencia = c.siguienteSeq++;
          const ahora = performance.now();
          c.duraciones.set(secuencia, Math.max(0, Math.round(ahora - c.ultimoCorte)));
          c.ultimoCorte = ahora;
          // Hash en cadena: los fragmentos entran a la cola en orden de secuencia.
          c.cadena = c.cadena
            .then(async () => {
              if (c.descartarDatos || token !== tokenRef.current) return;
              const sha256 = await sha256Hex(blob);
              c.cola?.add({ secuencia, blob, sha256 });
            })
            .catch(() => undefined);
        };
        recorder.onerror = () => {
          if (token === tokenRef.current) abortarConError("parametro_invalido", true);
        };
        for (const pista of stream.getAudioTracks()) {
          // Micrófono desconectado o permiso retirado desde el navegador: cierre ordenado.
          pista.onended = () => {
            if (token === tokenRef.current && estadoRef.current === "grabando") void detenerRef.current();
          };
        }

        c.inicio = performance.now();
        c.ultimoCorte = c.inicio;
        recorder.start(TIMESLICE_MS);
        c.temporizador = setInterval(() => {
          if (montadoRef.current) setSegundos(Math.floor((performance.now() - c.inicio) / 1000));
        }, 1000);
        fijarEstado("grabando");
      } catch {
        // Sin texto técnico: cualquier fallo inesperado antes de grabar.
        const id = sesionRef.current;
        if (id && !c.recorder) void audioDescartarSesion(id);
        fallar("parametro_invalido");
      } finally {
        ocupadoRef.current = false;
      }
    },
    [abortarConError, fijarError, fijarEstado],
  );

  const detener = useCallback(async (): Promise<void> => {
    if (leerEstado() !== "grabando") return;
    const token = tokenRef.current;
    const c = recRef.current;
    const id = sesionRef.current;
    const rec = c.recorder;
    if (!id || !rec) return;
    fijarEstado("finalizando");

    // 1. Parar el recorder y recibir el último fragmento.
    if (rec.state !== "inactive") {
      await new Promise<void>((resolver) => {
        const tope = setTimeout(resolver, ESPERA_STOP_RECORDER_MS);
        rec.onstop = () => {
          clearTimeout(tope);
          resolver();
        };
        try {
          rec.stop();
        } catch {
          clearTimeout(tope);
          resolver();
        }
      });
    }
    if (token !== tokenRef.current || leerEstado() !== "finalizando") return;
    const duracionTotal = Math.max(0, Math.round(performance.now() - c.inicio));

    // 2. El micrófono ya no se necesita: se apaga (el aviso de grabación desaparece).
    if (c.temporizador) {
      clearInterval(c.temporizador);
      c.temporizador = null;
    }
    if (montadoRef.current) setSegundos(Math.floor(duracionTotal / 1000));

    // 3. Subir el último fragmento y esperar la cola (tope 30 s).
    await c.cadena;
    if (token !== tokenRef.current || leerEstado() !== "finalizando") return;
    liberarRecursos(c);
    if (c.cola) {
      const vacia = await c.cola.esperarVaciado(TOPE_ESPERA_COLA_MS);
      if (!vacia) c.cola.cancelar();
    }
    // Un error fatal durante la espera ya dejó el estado en "error".
    if (token !== tokenRef.current || leerEstado() !== "finalizando") return;

    // 4. Cerrar la sesión en el servidor.
    const r = await audioFinalizarSesion(id, c.siguienteSeq, duracionTotal);
    if (token !== tokenRef.current) return;
    if (!r.ok) {
      fijarError(r.codigo);
      fijarEstado("error");
      return;
    }
    fijarEstado("finalizada");
  }, [fijarError, fijarEstado]);
  detenerRef.current = detener;

  const retirarPermiso = useCallback(
    async (consentimientoId: string): Promise<void> => {
      // Primero se corta el audio localmente, sin esperar a la red.
      const c = recRef.current;
      const hayCaptura = estadoRef.current === "grabando" || estadoRef.current === "solicitando_permiso" || estadoRef.current === "finalizando";
      const token = tokenRef.current;
      if (hayCaptura) {
        tokenRef.current++;
        c.descartarDatos = true;
        c.cola?.cancelar();
        liberarRecursos(c);
        fijarEstado("finalizando");
      }
      const r = await audioRevocarConsentimiento(consentimientoId);
      if (!montadoRef.current) return;
      if (!r.ok) {
        fijarError(r.codigo);
        fijarEstado("error");
        return;
      }
      if (hayCaptura || token === tokenRef.current) {
        fijarError(null);
        fijarEstado("finalizada");
      }
    },
    [fijarError, fijarEstado],
  );

  const vincular = useCallback(
    async (atencionId: string): Promise<void> => {
      const id = sesionRef.current;
      const c = recRef.current;
      if (!id || c.vinculada) return;
      const r = await audioVincularAtencion(id, atencionId);
      if (r.ok) {
        c.vinculada = true;
      } else {
        fijarError(r.codigo);
      }
    },
    [fijarError],
  );

  // Aviso del navegador mientras se graba o se está finalizando.
  useEffect(() => {
    if (estado !== "grabando" && estado !== "finalizando") return;
    const alSalir = (ev: BeforeUnloadEvent) => {
      ev.preventDefault();
      ev.returnValue = "";
    };
    window.addEventListener("beforeunload", alSalir);
    return () => window.removeEventListener("beforeunload", alSalir);
  }, [estado]);

  // Limpieza total al desmontar: pistas, recorder, AudioContext, timers y cola.
  useEffect(() => {
    montadoRef.current = true;
    return () => {
      montadoRef.current = false;
      tokenRef.current++;
      const c = recRef.current;
      const estabaGrabando = estadoRef.current === "grabando";
      const id = sesionRef.current;
      c.descartarDatos = true;
      c.cola?.cancelar();
      liberarRecursos(c);
      if (estabaGrabando && id) {
        // Evita dejar la sesión "grabando" en el servidor (bloquearía la siguiente).
        void audioFinalizarSesion(id, c.siguienteSeq, Math.max(0, Math.round(performance.now() - c.inicio)));
      }
    };
  }, []);

  return { estado, segundos, sesionId, codigoError, iniciar, detener, retirarPermiso, vincular };
}
