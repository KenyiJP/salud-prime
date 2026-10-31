import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { claveConAlcance } from "@/lib/query-scope";
import { CheckCircle2, ExternalLink, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/lib/auth-context";
import { GOOGLE_RESENAS_URL_MAX, validarEnlaceGoogleResenas } from "@/lib/google-resenas-url";
import { ErrorUsuario, mensajeParaUsuario } from "@/lib/resenas-schemas";

// Ayuda oficial de Google Maps para compartir un lugar (Compartir → Copiar enlace).
const URL_AYUDA_GOOGLE_MAPS = "https://support.google.com/maps/answer/7101463?hl=es";

const queryKey = (userId: string) => claveConAlcance(userId, "medico-resenas-config");

// `medicos.resenas_habilitadas` y `medicos.google_resenas_url` (Día 26C) aún no están en el
// types.ts generado por Lovable. Se tipan localmente hasta la próxima regeneración.
type FilaResenas = {
  id: string;
  tenant_id: string;
  resenas_habilitadas: boolean;
  google_resenas_url: string | null;
};

async function getConfig(userId: string): Promise<FilaResenas> {
  const { data, error } = await supabase
    .from("medicos")
    .select("id, tenant_id, resenas_habilitadas, google_resenas_url" as "id")
    .eq("user_id", userId)
    .limit(1);
  if (error) {
    console.error("[resenas-config] error leyendo configuración", error);
    throw new ErrorUsuario("No se pudo cargar la configuración de reseñas. Inténtalo de nuevo.");
  }
  const fila = (data ?? [])[0];
  if (!fila) throw new ErrorUsuario("No existe un perfil médico vinculado a esta cuenta.");
  return fila as unknown as FilaResenas;
}

export function ResenasConfigCard() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? "";
  // La key incluye el user.id: otra cuenta en el mismo navegador nunca reutiliza la caché.
  const cfg = useQuery({
    queryKey: queryKey(userId),
    queryFn: () => getConfig(userId),
    enabled: !!userId,
  });
  const [enlace, setEnlace] = useState("");

  // Sincroniza el campo cuando llega (o cambia) el valor guardado.
  const guardado = cfg.data?.google_resenas_url ?? null;
  useEffect(() => {
    if (cfg.data) setEnlace(guardado ?? "");
  }, [cfg.data, guardado]);

  const actualizar = useMutation({
    mutationFn: async (
      cambios: Partial<Pick<FilaResenas, "resenas_habilitadas" | "google_resenas_url">>,
    ) => {
      if (!cfg.data || !userId) {
        throw new ErrorUsuario("La configuración aún no se cargó. Inténtalo de nuevo.");
      }
      // Filtra por médico, tenant y usuario propietario (no se confía solo en RLS) y exige que
      // se haya actualizado una fila: si no, se informa en vez de simular éxito.
      const { data, error } = await supabase
        .from("medicos")
        .update(cambios as never)
        .eq("id", cfg.data.id)
        .eq("tenant_id", cfg.data.tenant_id)
        .eq("user_id", userId)
        .select("id");
      if (error) {
        console.error("[resenas-config] error guardando configuración", error);
        throw new ErrorUsuario("No se pudo guardar el cambio. Inténtalo de nuevo.");
      }
      if (!data || data.length === 0) {
        console.error("[resenas-config] el UPDATE no afectó ninguna fila");
        throw new ErrorUsuario("No se pudo guardar el cambio. Inténtalo de nuevo.");
      }
      return cambios;
    },
    onSuccess: (cambios) => {
      qc.setQueryData<FilaResenas>(queryKey(userId), (prev) =>
        prev ? { ...prev, ...cambios } : prev,
      );
      if ("resenas_habilitadas" in cambios) {
        toast.success(
          cambios.resenas_habilitadas
            ? "Solicitud de reseñas activada"
            : "Solicitud de reseñas desactivada",
        );
      }
      if ("google_resenas_url" in cambios) {
        toast.success(
          cambios.google_resenas_url ? "Enlace de Google guardado" : "Enlace de Google quitado",
        );
      }
    },
    onError: (e: unknown) =>
      toast.error(mensajeParaUsuario(e, "No se pudo guardar el cambio. Inténtalo de nuevo.")),
  });

  // Validación en vivo con la misma regla que el CHECK de la BD (google-resenas-url.ts).
  const validacion = useMemo(() => validarEnlaceGoogleResenas(enlace), [enlace]);
  const vacio = enlace.trim() === "";
  const hayCambios = (validacion.ok ? validacion.valor : enlace.trim()) !== guardado;
  const puedeGuardar = validacion.ok && hayCambios && !actualizar.isPending && !!cfg.data;

  function guardarEnlace() {
    if (!validacion.ok || !puedeGuardar) return; // con el botón deshabilitado, Enter tampoco guarda
    setEnlace(validacion.valor ?? ""); // vaciar el campo guarda NULL
    actualizar.mutate({ google_resenas_url: validacion.valor });
  }

  return (
    <Card className="max-w-3xl border-border/60 shadow-none">
      <CardHeader>
        <CardTitle>Reseñas de pacientes</CardTitle>
        <CardDescription>
          Después de una consulta atendida, el agente le pide al paciente por WhatsApp que califique
          su atención. Las notas de 1 a 3 y sus comentarios son <strong>privados</strong> (solo los
          ves tú). Los comentarios de 4 a 5 solo se muestran en tu web si el paciente lo autoriza{" "}
          <strong>y tú los apruebas</strong>, con sus iniciales.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {cfg.isPending ? (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Cargando…
          </div>
        ) : cfg.isError ? (
          <div role="alert" className="flex flex-wrap items-center gap-3 text-sm text-destructive">
            <span>
              {mensajeParaUsuario(cfg.error, "No se pudo cargar la configuración de reseñas.")}
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              aria-label="Reintentar cargar la configuración de reseñas"
              onClick={() => void cfg.refetch()}
            >
              Reintentar
            </Button>
          </div>
        ) : (
          <>
            <label className="flex items-center justify-between gap-4 text-sm font-medium">
              Pedir reseña a los pacientes atendidos
              <Switch
                checked={cfg.data.resenas_habilitadas === true}
                disabled={actualizar.isPending}
                onCheckedChange={(v) => actualizar.mutate({ resenas_habilitadas: v })}
                aria-label="Activar solicitud de reseñas a pacientes"
              />
            </label>

            <div className="space-y-2">
              <Label htmlFor="google-resenas-url">
                Enlace de reseñas de Google Maps de tu consultorio{" "}
                <span className="text-muted-foreground">(opcional)</span>
              </Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id="google-resenas-url"
                  type="url"
                  inputMode="url"
                  autoComplete="off"
                  placeholder="https://maps.app.goo.gl/…"
                  maxLength={GOOGLE_RESENAS_URL_MAX + 100}
                  value={enlace}
                  disabled={actualizar.isPending}
                  aria-invalid={!validacion.ok ? true : undefined}
                  aria-describedby="google-resenas-ayuda google-resenas-estado"
                  onChange={(e) => setEnlace(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") guardarEnlace();
                  }}
                />
                <Button
                  type="button"
                  aria-label={
                    vacio && guardado
                      ? "Quitar el enlace de Google Maps"
                      : "Guardar el enlace de Google Maps"
                  }
                  onClick={guardarEnlace}
                  disabled={!puedeGuardar}
                >
                  {actualizar.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : vacio && guardado ? (
                    "Quitar enlace"
                  ) : (
                    "Guardar enlace"
                  )}
                </Button>
              </div>

              {/* Vista previa / validación en vivo */}
              <div id="google-resenas-estado" role="status" aria-live="polite" className="text-sm">
                {vacio ? (
                  <span className="text-muted-foreground">
                    {guardado
                      ? "El campo está vacío: al guardar se quitará el enlace."
                      : "Sin enlace: se piden reseñas privadas y para tu web, sin invitar a Google."}
                  </span>
                ) : validacion.ok ? (
                  <span className="flex flex-wrap items-center gap-1.5 text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    Enlace válido.
                    <a
                      href={validacion.valor ?? undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 underline underline-offset-2"
                    >
                      Probar enlace <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      <span className="sr-only">(se abre en una pestaña nueva)</span>
                    </a>
                  </span>
                ) : (
                  <span className="flex items-start gap-1.5 text-destructive">
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    {validacion.error}
                  </span>
                )}
              </div>

              <div id="google-resenas-ayuda" className="space-y-1 text-xs text-muted-foreground">
                <p>
                  <strong>Opcional.</strong> Pega el enlace de Google Maps de tu consultorio; si no
                  lo tienes, déjalo vacío.
                </p>
                <p>
                  Si no lo pones, igual se piden reseñas: las notas bajas quedan privadas y los
                  comentarios autorizados pueden aparecer en tu web. Si lo pones, el agente invitará
                  al paciente a compartir también su opinión en Google. Para quitarlo, deja el campo
                  vacío y pulsa «Quitar enlace».
                </p>
                <p>
                  Cómo copiarlo (
                  <a
                    href={URL_AYUDA_GOOGLE_MAPS}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2"
                  >
                    ver ayuda de Google Maps
                    <span className="sr-only"> (se abre en una pestaña nueva)</span>
                  </a>
                  ):
                </p>
                <ol className="list-decimal space-y-0.5 pl-5">
                  <li>
                    Abre Google Maps y busca tu consultorio (o tu perfil de empresa en Google).
                  </li>
                  <li>
                    Pulsa <strong>Compartir → Copiar enlace</strong>. También sirve la opción{" "}
                    <strong>Pedir reseñas</strong> de tu Perfil de Empresa de Google.
                  </li>
                  <li>
                    Pega aquí el enlace (empieza con https://maps.app.goo.gl/ o
                    https://www.google.com/maps/).
                  </li>
                </ol>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
