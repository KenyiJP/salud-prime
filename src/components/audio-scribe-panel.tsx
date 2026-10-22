import { useEffect, useRef, useState } from "react";
import { Loader2, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { AudioConsentimientoDialog } from "@/components/audio-consentimiento-dialog";
import { AudioScribeBorradorViewer } from "@/components/audio-scribe-borrador-viewer";
import { useAudioScribeCaptura } from "@/lib/use-audio-scribe-captura";
import {
  mensajeAudioError,
  useAudioScribeHabilitado,
  useConservarSesion,
  useSesionesAtencion,
} from "@/lib/audio-scribe.queries";

type Props = {
  pacienteId: string;
  citaId: string | null;
  atencionId: string | null;
  estadoAtencion: string;
};

const MSG_FALLO_GENERICO = "No se pudo completar la acción. Puede intentarlo de nuevo.";
const MSG_FALLO_VINCULO = "No se pudo asociar el audio a la atención. El audio se eliminará a los 7 días como máximo.";
const SIETE_DIAS_MS = 7 * 24 * 60 * 60 * 1000;

function formatearCronometro(segundos: number): string {
  const total = Math.max(0, Math.floor(segundos));
  const mm = String(Math.floor(total / 60)).padStart(2, "0");
  const ss = String(total % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function formatearFecha(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" });
}

/**
 * Panel de Voice Scribe dentro de la consulta. No pide micrófono hasta que el
 * paciente toca «Acepto» en el diálogo de consentimiento.
 */
export function AudioScribePanel({ pacienteId, citaId, atencionId, estadoAtencion }: Props) {
  const habilitado = useAudioScribeHabilitado();
  const hook = useAudioScribeCaptura({ atencionId });
  const conservarMut = useConservarSesion();
  const sesiones = useSesionesAtencion(atencionId);

  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [rechazado, setRechazado] = useState(false);
  const [consentimientoId, setConsentimientoId] = useState<string | null>(null);
  const [errorFijo, setErrorFijo] = useState<string | null>(null);
  const [conservar, setConservar] = useState(false);
  const [conservarHasta, setConservarHasta] = useState<string | null>(null);
  const [aplicando, setAplicando] = useState(false);

  // Vinculación única: solo si la grabación empezó sin atención y esta aparece después.
  const iniciadaSinAtencion = useRef(false);
  const vinculada = useRef(false);
  const inicioMs = useRef<number | null>(null);

  const { sesionId, estado, vincular } = hook;
  useEffect(() => {
    if (!iniciadaSinAtencion.current || vinculada.current) return;
    if (!atencionId || !sesionId) return;
    vinculada.current = true;
    vincular(atencionId).catch(() => setErrorFijo(MSG_FALLO_VINCULO));
  }, [atencionId, sesionId, vincular]);

  if (habilitado.isLoading || !habilitado.data) return null;

  const cerrada = estadoAtencion === "firmada" || estadoAtencion === "anulada";
  const grabando = estado === "grabando";
  const finalizando = estado === "finalizando";
  const finalizada = estado === "finalizada";
  const solicitando = estado === "solicitando_permiso";
  const puedeIniciar = (estado === "inactivo" || estado === "error") && !rechazado && !cerrada;

  // Con la nota cerrada y sin grabación en curso o resumen, el panel no aporta nada.
  if (cerrada && estado === "inactivo" && !rechazado) return null;

  const mensajeHook = hook.codigoError ? mensajeAudioError(hook.codigoError) : null;

  const sesionRemota =
    (sesiones.data && sesiones.data.ok && sesionId
      ? sesiones.data.sesiones.find((s) => s.id === sesionId)
      : null) ?? null;
  const fechaEliminacion: string = conservar && conservarHasta
    ? formatearFecha(conservarHasta)
    : sesionRemota
      ? formatearFecha(sesionRemota.purgar_despues_de)
      : formatearFecha(new Date((inicioMs.current ?? Date.now()) + SIETE_DIAS_MS));

  function alAceptar(id: string) {
    setConsentimientoId(id);
    setErrorFijo(null);
    setConservar(false);
    setConservarHasta(null);
    vinculada.current = false;
    iniciadaSinAtencion.current = atencionId === null;
    inicioMs.current = Date.now();
    void hook.iniciar(id).catch(() => setErrorFijo(MSG_FALLO_GENERICO));
  }

  function alRechazar() {
    setRechazado(true);
  }

  async function aplicarConservacion(accion: "conservar" | "quitar") {
    if (!sesionId || aplicando) return;
    setAplicando(true);
    setErrorFijo(null);
    try {
      const r = await conservarMut.mutateAsync({ sesionId, accion });
      if (!r.ok) {
        setErrorFijo(mensajeAudioError(r.codigo));
        return;
      }
      setConservar(r.conservar);
      setConservarHasta(r.conservar_hasta);
      void sesiones.refetch();
    } catch {
      // Mensaje fijo: nunca se muestra el error crudo del backend.
      setErrorFijo(MSG_FALLO_GENERICO);
    } finally {
      setAplicando(false);
    }
  }

  async function retirar() {
    if (!consentimientoId) return;
    try {
      await hook.retirarPermiso(consentimientoId);
    } catch {
      setErrorFijo(MSG_FALLO_GENERICO);
    }
  }

  return (
    <>
      {grabando || finalizando ? (
        <div className="fixed inset-x-0 top-0 z-[60] border-b-2 border-red-900 bg-red-600 text-white shadow-lg">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
            <span
              aria-hidden="true"
              className="inline-block h-4 w-4 shrink-0 animate-pulse rounded-full bg-white motion-reduce:animate-none"
            />
            <p role="status" aria-live="polite" className="text-base font-bold">
              {finalizando ? "Finalizando la grabación…" : "Consulta en grabación"}
            </p>
            <span role="timer" className="font-mono text-lg tabular-nums">
              {formatearCronometro(hook.segundos)}
            </span>
            {grabando ? (
              <div className="ml-auto flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => void hook.detener().catch(() => setErrorFijo(MSG_FALLO_GENERICO))}
                >
                  Detener
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="border-white bg-transparent text-white hover:bg-white/15 hover:text-white"
                  disabled={!consentimientoId}
                  onClick={() => void retirar()}
                >
                  El paciente retira el permiso
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <section
        aria-label="Voice Scribe: grabación de la consulta"
        className="space-y-3 rounded-xl border border-border/60 bg-card p-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Mic className="h-4 w-4 text-primary" aria-hidden="true" /> Voice Scribe
          </div>
          {puedeIniciar || solicitando ? (
            <Button
              type="button"
              disabled={solicitando}
              onClick={() => {
                setErrorFijo(null);
                setDialogoAbierto(true);
              }}
            >
              {solicitando ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              ) : null}
              {solicitando ? "Solicitando micrófono…" : "Iniciar consulta"}
            </Button>
          ) : null}
        </div>

        {rechazado ? (
          <p className="text-sm text-muted-foreground">
            La consulta continúa sin grabación. Su atención no cambia. Registre la historia de forma manual.
          </p>
        ) : null}

        {finalizada ? (
          <div className="space-y-3 text-sm">
            <p className="font-medium">
              Grabación finalizada ({formatearCronometro(hook.segundos)}). El audio quedó guardado de forma segura.
            </p>
            {!cerrada ? (
              <div className="space-y-2 rounded-md border border-border/60 p-3">
                <div className="flex items-center justify-between gap-4">
                  <label htmlFor="audio-conservar" className="font-medium">
                    Conservar audio (máximo 30 días desde el inicio)
                  </label>
                  <Switch
                    id="audio-conservar"
                    checked={conservar}
                    disabled={aplicando || !sesionId}
                    onCheckedChange={(v) => void aplicarConservacion(v ? "conservar" : "quitar")}
                  />
                </div>
                {conservar && conservarHasta ? (
                  <p className="text-muted-foreground">
                    Se eliminará automáticamente el {formatearFecha(conservarHasta)}.
                  </p>
                ) : (
                  <p className="text-muted-foreground">
                    El audio se eliminará automáticamente al firmar la nota o el {fechaEliminacion}.
                  </p>
                )}
              </div>
            ) : null}
          </div>
        ) : null}

        {errorFijo || mensajeHook ? (
          <p role="alert" className="text-sm text-destructive">
            {errorFijo ?? mensajeHook}
          </p>
        ) : null}

        {atencionId ? (
          <div className="mt-4 border-t border-border/60 pt-4">
            <AudioScribeBorradorViewer
              atencionId={atencionId}
              onAplicarCampo={(campo, valor) => {
                console.log("Aplicar campo SOAP:", campo, valor);
              }}
            />
          </div>
        ) : null}
      </section>

      <AudioConsentimientoDialog
        abierto={dialogoAbierto}
        onAbiertoChange={setDialogoAbierto}
        pacienteId={pacienteId}
        citaId={citaId}
        atencionId={atencionId}
        onAceptado={alAceptar}
        onRechazado={alRechazar}
      />

    </>
  );
}
