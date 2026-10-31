import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { claveActiva } from "@/lib/query-scope";
import { CalendarCheck, ExternalLink, Loader2, Unplug } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type IntegracionGoogle = Tables<"google_calendar_integraciones">;

const integrationQueryKey = () => claveActiva("google-calendar-integracion");
const OAUTH_START_URL =
  "https://qtdhpvzvkzochawsdhxl.supabase.co/functions/v1/google-calendar-oauth-start";

async function getIntegracionGoogle(): Promise<IntegracionGoogle | null> {
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
    .from("google_calendar_integraciones")
    .select("*")
    .eq("medico_id", medico.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data || data.estado !== "activa") return null;
  return data;
}

async function iniciarConexionGoogle(): Promise<string> {
  const { data, error } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;
  if (error || !accessToken) throw new Error("Tu sesión expiró. Vuelve a iniciar sesión.");

  const response = await fetch(OAUTH_START_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ redirect_final: "/configuracion/calendario" }),
  });

  const payload = (await response.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!response.ok || !payload.url) {
    throw new Error(payload.error || "No se pudo iniciar la conexión con Google Calendar.");
  }
  return payload.url;
}

async function revocarIntegracion(id: string) {
  const { error } = await supabase.rpc("gcal_revocar_integracion", {
    p_integracion_id: id,
  });
  if (error) throw new Error(error.message);
}

function limpiarParametrosGoogle() {
  const url = new URL(window.location.href);
  url.searchParams.delete("gcal");
  url.searchParams.delete("email");
  url.searchParams.delete("detalle");
  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
}

export function GoogleCalendarCard() {
  const queryClient = useQueryClient();
  const [confirmacionAbierta, setConfirmacionAbierta] = useState(false);
  const integracion = useQuery({
    queryKey: integrationQueryKey(),
    queryFn: getIntegracionGoogle,
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const estado = params.get("gcal");
    if (!estado) return;

    if (estado === "conectado") {
      const email = params.get("email");
      toast.success(email ? `Google Calendar conectado con ${email}.` : "Google Calendar conectado.");
      void queryClient.invalidateQueries({ queryKey: integrationQueryKey() });
    } else if (estado === "cancelado") {
      toast.info("Cancelaste la conexión con Google Calendar.");
    } else if (estado === "error") {
      toast.error(params.get("detalle") || "No se pudo conectar Google Calendar.");
    }
    limpiarParametrosGoogle();
  }, [queryClient]);

  const conectar = useMutation({
    mutationFn: iniciarConexionGoogle,
    onSuccess: (url) => {
      window.location.href = url;
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const desconectar = useMutation({
    mutationFn: (id: string) => revocarIntegracion(id),
    onSuccess: async () => {
      setConfirmacionAbierta(false);
      await queryClient.invalidateQueries({ queryKey: integrationQueryKey() });
      toast.success("Google Calendar fue desconectado.");
    },
    onError: (error: Error) => toast.error(error.message || "No se pudo desconectar Google Calendar."),
  });

  return (
    <Card className="max-w-3xl border-border/60 shadow-none">
      <CardHeader>
        <div className="flex items-start gap-4">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/25">
            <CalendarCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>Google Calendar</CardTitle>
              {integracion.data ? <Badge>Conectado</Badge> : null}
            </div>
            <CardDescription>
              Sincroniza las citas de tu agenda médica con tu calendario de Google.
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
          <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            {integracion.error.message}
          </div>
        ) : integracion.data ? (
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">Cuenta vinculada</p>
              <p className="mt-1 break-all font-medium">{integracion.data.google_email}</p>
              <p className="mt-1 text-xs text-muted-foreground">Sincronización activa</p>
            </div>
            <AlertDialog open={confirmacionAbierta} onOpenChange={setConfirmacionAbierta}>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Unplug className="h-4 w-4" /> Desconectar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Desconectar Google Calendar?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Se revocará el acceso a {integracion.data.google_email} y se eliminará el token guardado.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={desconectar.isPending}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    disabled={desconectar.isPending}
                    onClick={(event) => {
                      event.preventDefault();
                      const integracionId = integracion.data?.id;
                      if (integracionId) desconectar.mutate(integracionId);
                    }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {desconectar.isPending ? "Desconectando…" : "Sí, desconectar"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ) : (
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-xl text-sm text-muted-foreground">
              Vincula tu cuenta para mantener tus citas disponibles en Google Calendar.
            </p>
            <Button
              className="gap-2 sm:shrink-0"
              disabled={conectar.isPending}
              onClick={() => conectar.mutate()}
            >
              {conectar.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4" />
              )}
              Conectar con Google Calendar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}