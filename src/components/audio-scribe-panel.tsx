import { useEffect, useRef, useState } from "react";
import { Loader2, Mic, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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

function formatearCronometro(segundos: number): string {
  const total = Math.max(0, Math.floor(segundos));
  const mm = String(Math.floor(total / 60)).padStart(2, "0");
  const ss = String(total % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function formatearFecha(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function AudioScribePanel({ pacienteId, citaId, atencionId, estadoAtencion }: Props) {
  const habilitado = useAudioScribeHabilitado();
  const hook = useAudioScribeCaptura({ atencionId });
  const conservarMut = useConservarSesion();
  const sesiones = useSesionesAtencion(atencionId);

  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [rechazado, setRechazado] = useState(false);
  const [errorFijo, setErrorFijo] = useState<string | null>(null);
  const [aplicando, setAplicando] = useState(false);
  const [conservar, setConservar] = useState(true);
  const [conservarHasta, setConservarHasta] = useState<string | null>(null);

  if (habilitado.isLoading) {
    return <div className="p-4 text-sm text-muted-foreground">Cargando Voice Scribe...</div>;
  }

  if (habilitado.data !== true) {
    return null;
  }

  const grabando = hook.estado === "grabando";
  const finalizando = hook.estado === "finalizando";
  const solicitando = hook.estado === "solicitando_permiso";
  const sesionId = hook.sesionId;
  const mensajeHook = hook.codigoError ? mensajeAudioError(hook.codigoError) : null;

  const cerrada = estadoAtencion === "firmada" || estadoAtencion === "cerrada";
  const finalizada = !!sesionId && !grabando && !finalizando;
  const puedeIniciar = !grabando && !finalizando && !sesionId && !rechazado && !cerrada;

  function alAceptarConsentimiento(id: string) {
    setDialogoAbierto(false);
    setErrorFijo(null);
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
      setErrorFijo(MSG_FALLO_GENERICO);
    } finally {
      setAplicando(false);
    }
  }

  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-4" aria-label="Voice Scribe Panel">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Mic className="h-4 w-4 text-primary" aria-hidden="true" /> Voice Scribe (Asistente de Voz IA)
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
            {solicitando ? "Solicitando micrófono…" : "Iniciar consulta con voz"}
          </Button>
        ) : null}
      </div>

      {grabando || finalizando ? (
        <div className="rounded-lg border-2 border-red-600 bg-red-500/10 p-4 text-foreground space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-red-600" />
              <span className="font-bold text-base">{finalizando ? "Finalizando grabación..." : "Grabando consulta en curso..."}</span>
            </div>
            <span className="font-mono text-lg font-bold tabular-nums">
              {formatearCronometro(hook.segundos)}
            </span>
          </div>
          <div className="flex gap-2 justify-end">
            {grabando && (
              <Button variant="destructive" size="sm" onClick={() => void hook.detener()}>
                Detener y procesar audio
              </Button>
            )}
          </div>
        </div>
      ) : null}

      {rechazado ? (
        <p className="text-sm text-muted-foreground">
          La consulta continúa sin grabación de voz. Puede registrar la historia clínica de forma manual.
        </p>
      ) : null}

      {/* Historial de sesiones de audio para esta atención */}
      {sesiones.data && sesiones.data.ok && sesiones.data.sesiones.length > 0 ? (
        <div className="rounded-md border bg-muted/20 p-3 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <History className="w-3.5 h-3.5" /> Sesiones de audio grabadas ({sesiones.data.sesiones.length})
          </div>
          <div className="space-y-2">
            {sesiones.data.sesiones.map((s) => (
              <div key={s.id} className="flex items-center justify-between text-xs bg-background p-2.5 rounded border">
                <div>
                  <span className="font-medium">Iniciada: {formatearFecha(s.iniciada_en)}</span>
                  <span className="ml-3 text-muted-foreground capitalize">Estado: {s.estado}</span>
                </div>
                <Badge variant="outline" className="text-[10px]">
                  {Math.round((s.duracion_ms || 0) / 1000)}s
                </Badge>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {finalizada ? (
        <div className="space-y-3 text-sm rounded-md border p-3 bg-muted/10">
          <p className="font-medium text-emerald-600 dark:text-emerald-400">
            ¡Grabación finalizada con éxito ({formatearCronometro(hook.segundos)})! El audio quedó guardado de forma segura en el servidor.
          </p>
          {!cerrada ? (
            <div className="space-y-2 rounded-md border border-border/60 p-3 bg-background">
              <div className="flex items-center justify-between gap-4">
                <label htmlFor="audio-conservar" className="font-medium text-xs">
                  Conservar audio (máximo 30 días desde el inicio)
                </label>
                <Switch
                  id="audio-conservar"
                  checked={conservar}
                  disabled={aplicando || !sesionId}
                  onCheckedChange={(v) => void aplicarConservacion(v ? "conservar" : "quitar")}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                El audio se eliminará automáticamente al firmar la nota o al cumplirse el plazo.
              </p>
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
            // PENDIENTE (Día 27B/29): conectar con el formulario de la atención. No se
            // registra el contenido en consola: es información clínica (Ley 29733).
            onAplicarCampo={() => undefined}
          />
        </div>
      ) : null}

      <AudioConsentimientoDialog
        abierto={dialogoAbierto}
        onAbiertoChange={setDialogoAbierto}
        pacienteId={pacienteId}
        citaId={citaId}
        atencionId={atencionId}
        onAceptado={alAceptarConsentimiento}
        onRechazado={alRechazar}
      />
    </section>
  );
}
