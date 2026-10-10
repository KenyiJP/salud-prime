import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useAudioScribeHabilitado, useSetAudioScribeHabilitado } from "@/lib/audio-scribe.queries";

export function AudioScribeConfigCard() {
  const habilitado = useAudioScribeHabilitado();
  const guardar = useSetAudioScribeHabilitado();

  async function cambiar(valor: boolean) {
    const guardado = await guardar.mutateAsync(valor);
    if (guardado) {
      toast.success(valor ? "Voice Scribe activado" : "Voice Scribe desactivado");
    } else {
      toast.error("No se pudo guardar la configuración. Inténtelo de nuevo.");
    }
  }

  return (
    <Card className="max-w-3xl border-border/60 shadow-none">
      <CardHeader>
        <CardTitle>Voice Scribe</CardTitle>
        <CardDescription>
          Grabación opcional de la consulta para ayudarle a redactar la nota. Está apagada por defecto.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {habilitado.isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Cargando…
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4">
            <label htmlFor="voice-scribe-habilitado" className="text-sm font-medium">
              Voice Scribe (grabación de consulta con consentimiento)
            </label>
            <Switch
              id="voice-scribe-habilitado"
              checked={habilitado.data === true}
              disabled={guardar.isPending}
              onCheckedChange={(v) => void cambiar(v)}
            />
          </div>
        )}
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>
            Solo se graba si el paciente toca «Acepto» en su pantalla. Si no acepta, su atención no cambia.
          </li>
          <li>
            El paciente puede retirar su permiso en cualquier momento, incluso durante la consulta: la
            grabación se detiene y el audio se elimina.
          </li>
          <li>
            El audio se elimina automáticamente al firmar la nota o, como máximo, a los 7 días. Usted puede
            elegir «Conservar» hasta 30 días desde el inicio de la consulta.
          </li>
          <li>
            El audio se guarda cifrado en reposo y en tránsito. No es cifrado de extremo a extremo: el
            sistema debe poder leerlo para generar el borrador de la nota.
          </li>
        </ul>
      </CardContent>
    </Card>
  );
}
