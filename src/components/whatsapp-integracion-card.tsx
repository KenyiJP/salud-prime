import { useQuery } from "@tanstack/react-query";
import { Loader2, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type IntegracionWhatsapp = Tables<"whatsapp_integraciones">;

const integrationQueryKey = ["whatsapp-integracion"] as const;

const MENSAJE_SIN_CONECTAR =
  "WhatsApp Business aún no está conectado. La activación se habilitará cuando se complete la verificación de negocio en Meta.";

async function getIntegracionWhatsapp(): Promise<IntegracionWhatsapp | null> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw new Error("Tu sesión expiró. Vuelve a iniciar sesión.");

  const { data: medico, error: medicoError } = await supabase
    .from("medicos")
    .select("id")
    .eq("user_id", userData.user.id)
    .maybeSingle();
  if (medicoError) throw new Error(medicoError.message);
  if (!medico) throw new Error("No existe un perfil médico vinculado a esta cuenta.");

  const { data, error } = await supabase
    .from("whatsapp_integraciones")
    .select("*")
    .eq("medico_id", medico.id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export function WhatsappIntegracionCard() {
  const integracion = useQuery({
    queryKey: integrationQueryKey,
    queryFn: getIntegracionWhatsapp,
  });

  const estado = integracion.data?.estado ?? "pendiente";
  const conectado = estado === "activa";

  return (
    <Card className="max-w-3xl border-border/60 shadow-none">
      <CardHeader>
        <div className="flex items-start gap-4">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/25">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>WhatsApp Business</CardTitle>
              {conectado ? <Badge>Conectado</Badge> : null}
            </div>
            <CardDescription>
              Estado de la conexión que permitirá al agente de MATEO conversar por WhatsApp con tus
              pacientes.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {integracion.isPending ? (
          <div className="flex min-h-24 items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Verificando conexión…
          </div>
        ) : integracion.isError ? (
          <div
            role="alert"
            className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
          >
            {integracion.error.message}
          </div>
        ) : conectado ? (
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">Número vinculado</p>
            <p className="mt-1 break-all font-medium">
              {integracion.data?.numero_visible ?? "Sin número visible"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Conectado</p>
          </div>
        ) : estado === "error" || estado === "revocada" ? (
          <div className="space-y-3">
            <p className="max-w-xl text-sm text-muted-foreground">{MENSAJE_SIN_CONECTAR}</p>
            <div
              role="alert"
              className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
            >
              {integracion.data?.ultimo_error ?? "La conexión se interrumpió. Se requiere re-conexión."}
            </div>
          </div>
        ) : (
          <p className="max-w-xl text-sm text-muted-foreground">{MENSAJE_SIN_CONECTAR}</p>
        )}
      </CardContent>
    </Card>
  );
}
