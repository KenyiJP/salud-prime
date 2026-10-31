import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { claveActiva } from "@/lib/query-scope";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

const queryKey = () => claveActiva("medico-triaje-habilitado");

// `medicos.triaje_habilitado` (Día 26B) aún no está en types.ts generado por Lovable.
// Se tipa localmente hasta la próxima regeneración.
type FilaTriaje = { id: string; triaje_habilitado: boolean };

async function getConfig(): Promise<FilaTriaje> {
  const { data: u, error: ue } = await supabase.auth.getUser();
  if (ue || !u.user) throw new Error("Tu sesión expiró. Vuelve a iniciar sesión.");
  const { data, error } = await supabase
    .from("medicos")
    .select("id, triaje_habilitado" as "id")
    .eq("user_id", u.user.id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("No existe un perfil médico vinculado a esta cuenta.");
  return data as unknown as FilaTriaje;
}

export function TriajeConfigCard() {
  const qc = useQueryClient();
  const cfg = useQuery({ queryKey: queryKey(), queryFn: getConfig });
  const guardar = useMutation({
    mutationFn: async (valor: boolean) => {
      if (!cfg.data) throw new Error("Configuración no cargada.");
      const { error } = await supabase
        .from("medicos")
        .update({ triaje_habilitado: valor } as never)
        .eq("id", cfg.data.id);
      if (error) throw new Error(error.message);
      return valor;
    },
    // H-1: clave fijada al iniciar la mutación (no se recalcula con la cuenta que esté activa al terminar).
    onMutate: () => ({ clave: queryKey() }),
    onSuccess: (valor, _vars, ctx) => {
      qc.setQueryData<FilaTriaje>(ctx?.clave ?? queryKey(), (prev) => (prev ? { ...prev, triaje_habilitado: valor } : prev));
      toast.success(valor ? "Triaje previo activado" : "Triaje previo desactivado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card className="max-w-3xl border-border/60 shadow-none">
      <CardHeader>
        <CardTitle>Triaje previo a la consulta</CardTitle>
        <CardDescription>
          Al agendar una cita por WhatsApp, el paciente recibe la invitación opcional «Iniciar triaje». Sus
          respuestas llegan a su historia como «reportado por paciente, no verificado».
        </CardDescription>
      </CardHeader>
      <CardContent>
        {cfg.isPending ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
          </div>
        ) : cfg.isError ? (
          <p role="alert" className="text-sm text-destructive">{cfg.error.message}</p>
        ) : (
          <label className="flex items-center justify-between gap-4 text-sm font-medium">
            Invitar al paciente a completar el triaje
            <Switch
              checked={cfg.data.triaje_habilitado}
              disabled={guardar.isPending}
              onCheckedChange={(v) => guardar.mutate(v)}
              aria-label="Activar triaje previo a la consulta"
            />
          </label>
        )}
      </CardContent>
    </Card>
  );
}
