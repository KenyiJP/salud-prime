import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  mensajeAudioError,
  useRegistrarConsentimiento,
  useTextoConsentimientoVigente,
} from "@/lib/audio-scribe.queries";

type Props = {
  abierto: boolean;
  onAbiertoChange: (abierto: boolean) => void;
  pacienteId: string;
  citaId: string | null;
  atencionId: string | null;
  /** El paciente aceptó: se entrega el id del consentimiento ya registrado. */
  onAceptado: (consentimientoId: string) => void;
  /** El paciente no aceptó: la negativa ya quedó registrada. */
  onRechazado: () => void;
};

const MSG_FALLO_REGISTRO = "No se pudo registrar la decisión. Puede intentarlo de nuevo.";
const MSG_RECHAZO = "La consulta continúa sin grabación. Su atención no cambia.";

/**
 * Diálogo pensado para que el PACIENTE lo lea y toque «Acepto» / «No acepto»
 * en la pantalla del médico. El texto mostrado es EXACTAMENTE el devuelto por
 * el servidor (versión vigente); nunca se escribe a mano aquí.
 */
export function AudioConsentimientoDialog({
  abierto,
  onAbiertoChange,
  pacienteId,
  citaId,
  atencionId,
  onAceptado,
  onRechazado,
}: Props) {
  const textoQ = useTextoConsentimientoVigente();
  const registrar = useRegistrarConsentimiento();
  const [rechazado, setRechazado] = useState(false);
  const [errorFijo, setErrorFijo] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const foco = useRef<HTMLDivElement>(null);

  // Al abrir, se limpia el estado de una apertura previa.
  useEffect(() => {
    if (abierto) {
      setRechazado(false);
      setErrorFijo(null);
      setEnviando(false);
    }
  }, [abierto]);

  const datos = textoQ.data;
  const vigente = datos && datos.ok ? datos : null;
  const codigoTexto = datos && !datos.ok ? datos.codigo : null;

  async function decidir(decision: "aceptado" | "rechazado") {
    if (!vigente || enviando) return;
    setEnviando(true);
    setErrorFijo(null);
    try {
      const r = await registrar.mutateAsync({
        pacienteId,
        citaId,
        atencionId,
        decision,
        textoVersion: vigente.version,
      });
      if (!r.ok) {
        setErrorFijo(mensajeAudioError(r.codigo));
        return;
      }
      if (decision === "aceptado") {
        onAbiertoChange(false);
        onAceptado(r.consentimiento_id);
      } else {
        setRechazado(true);
        onRechazado();
      }
    } catch {
      // Mensaje fijo: nunca se muestra el error crudo del backend.
      setErrorFijo(MSG_FALLO_REGISTRO);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={(v) => (enviando ? undefined : onAbiertoChange(v))}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"
        onOpenAutoFocus={(e) => {
          // El foco va al texto (no a un botón): un Enter accidental no decide por el paciente.
          e.preventDefault();
          foco.current?.focus();
        }}
      >
        {rechazado ? (
          <>
            <DialogHeader>
              <DialogTitle>Gracias por su respuesta</DialogTitle>
              <DialogDescription>Su decisión quedó registrada.</DialogDescription>
            </DialogHeader>
            <div ref={foco} tabIndex={-1} role="status" className="text-base outline-none">
              {MSG_RECHAZO}
            </div>
            <DialogFooter>
              <Button type="button" onClick={() => onAbiertoChange(false)}>
                Cerrar
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Permiso para grabar el audio de la consulta</DialogTitle>
              <DialogDescription>
                Por favor lea el texto completo y toque «Acepto» o «No acepto».
              </DialogDescription>
            </DialogHeader>

            <div
              ref={foco}
              tabIndex={0}
              role="region"
              aria-label="Texto de consentimiento"
              className="max-h-[50vh] overflow-y-auto whitespace-pre-line rounded-md border border-border bg-muted/40 p-4 text-sm leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {textoQ.isLoading ? (
                <span className="inline-flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Cargando texto…
                </span>
              ) : vigente ? (
                <TextoConNegritas texto={vigente.texto} />
              ) : (
                <span>
                  {codigoTexto
                    ? mensajeAudioError(codigoTexto)
                    : "No se pudo cargar el texto de consentimiento."}
                </span>
              )}
            </div>

            <div aria-live="assertive" className="min-h-5 text-sm text-destructive">
              {errorFijo}
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                size="lg"
                disabled={!vigente || enviando}
                onClick={() => void decidir("rechazado")}
              >
                No acepto
              </Button>
              <Button
                type="button"
                size="lg"
                disabled={!vigente || enviando}
                onClick={() => void decidir("aceptado")}
              >
                {enviando ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                ) : null}
                Acepto
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Muestra «**negrita**» del texto legal como negrita real, sin HTML (React escapa todo). */
function TextoConNegritas({ texto }: { texto: string }) {
  return (
    <>
      {texto.split(/(\*\*[^*]+\*\*)/g).map((trozo, i) =>
        trozo.startsWith("**") && trozo.endsWith("**") && trozo.length > 4 ? (
          <strong key={i}>{trozo.slice(2, -2)}</strong>
        ) : (
          <span key={i}>{trozo}</span>
        ),
      )}
    </>
  );
}
