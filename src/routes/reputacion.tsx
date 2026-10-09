import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertCircle, Check, CheckCheck, Loader2, RefreshCw, Star, Undo2, X } from "lucide-react";
import { toast } from "sonner";
import { ConfirmarEliminar } from "@/components/confirmar-eliminar";
import { DashboardShell } from "@/components/dashboard-shell";
import { KpiCard, KpiGridSkeleton, fmtEntero, fmtPorcentaje } from "@/components/metricas-ui";
import { PageHeader } from "@/components/page-primitives";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireSession } from "@/lib/auth-guard";
import {
  LIMITE_LISTA_RESENAS,
  useMarcarLeidaMutation,
  useMedicoReputacionQuery,
  useModerarResenaMutation,
  useResenasQuery,
  useResumenReputacionQuery,
} from "@/lib/resenas.queries";
import {
  calcularTasaRespuesta,
  mensajeParaUsuario,
  MENSAJE_SIN_LANDING,
  type PestanaResena,
  type ResenaFila,
} from "@/lib/resenas-schemas";

export const Route = createFileRoute("/reputacion")({
  beforeLoad: () => requireSession(),
  ssr: false,
  head: () => ({
    meta: [
      { title: "Reputación — MediSuite" },
      {
        name: "description",
        content:
          "Reseñas de tus pacientes: calificación promedio, comentarios privados y aprobación para tu web.",
      },
    ],
  }),
  component: ReputacionPage,
});

function fmtPromedio(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return "—";
  return `${valor.toLocaleString("es-PE", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} / 5`;
}

function fmtFecha(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
}

function Estrellas({ valor }: { valor: number | null }) {
  const n = Math.max(0, Math.min(5, Math.round(valor ?? 0)));
  return (
    <div className="flex items-center gap-0.5" role="img" aria-label={`${n} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={
            i <= n ? "h-4 w-4 fill-amber-400 text-amber-400" : "h-4 w-4 text-muted-foreground/40"
          }
        />
      ))}
    </div>
  );
}

function TarjetaResena({
  resena,
  pestana,
  moderando,
  deshabilitado,
  onModerar,
  onMarcarLeida,
  onMarcarNoLeida,
}: {
  resena: ResenaFila;
  pestana: PestanaResena;
  /** Esta tarjeta es la que se está procesando (muestra spinner). */
  moderando: boolean;
  /** Hay una operación en curso en la lista: se bloquean TODAS las tarjetas. */
  deshabilitado: boolean;
  onModerar: (aprobar: boolean) => void;
  onMarcarLeida: () => void;
  onMarcarNoLeida: () => void;
}) {
  const estrellas = Math.max(0, Math.min(5, Math.round(resena.calificacion ?? 0)));
  const fecha = fmtFecha(resena.respondida_en ?? resena.solicitada_en);
  const descripcion = `reseña de ${estrellas} ${estrellas === 1 ? "estrella" : "estrellas"}${fecha ? ` del ${fecha}` : ""}`;
  return (
    <Card className="border-border/60 shadow-none" role="listitem">
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <Estrellas valor={resena.calificacion} />
            <span className="text-xs text-muted-foreground">{fecha}</span>
          </div>
          {pestana === "privadas" && !resena.leida_por_medico ? (
            <Badge variant="secondary">Sin leer</Badge>
          ) : null}
        </div>
        {/* Texto plano: React lo escapa. Nunca se inyecta como HTML. */}
        {resena.comentario ? (
          <p className="whitespace-pre-wrap break-words text-sm">{resena.comentario}</p>
        ) : (
          <p className="text-sm italic text-muted-foreground">El paciente no dejó comentario.</p>
        )}
        {pestana === "por_aprobar" ? (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button
              size="sm"
              disabled={deshabilitado}
              aria-label={`Aprobar ${descripcion}`}
              onClick={() => onModerar(true)}
            >
              {moderando ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-1 h-4 w-4" />
              )}
              Aprobar
            </Button>
            <ConfirmarEliminar
              title="¿Rechazar esta reseña?"
              description="No se mostrará en tu web. El paciente no recibe ningún aviso."
              confirmLabel="Rechazar"
              onConfirm={() => onModerar(false)}
              disabled={deshabilitado}
              trigger={
                <Button
                  size="sm"
                  variant="outline"
                  disabled={deshabilitado}
                  aria-label={`Rechazar ${descripcion}`}
                >
                  <X className="mr-1 h-4 w-4" /> Rechazar
                </Button>
              }
            />
            <span className="text-xs text-muted-foreground">
              El paciente autorizó mostrarla con sus iniciales. Solo se publica si tú la apruebas.
            </span>
          </div>
        ) : null}
        {pestana === "aprobadas" ? (
          <p className="text-xs text-muted-foreground">
            Aprobada. Se muestra con las iniciales del paciente en tu web cuando tu página web esté
            publicada.
          </p>
        ) : null}
        {pestana === "privadas" ? (
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs text-muted-foreground">Privada: solo tú la ves. No se publica.</p>
            {!resena.leida_por_medico ? (
              <Button
                size="sm"
                variant="outline"
                disabled={deshabilitado}
                aria-label={`Marcar como leída la ${descripcion}`}
                onClick={onMarcarLeida}
              >
                {moderando ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <CheckCheck className="mr-1 h-4 w-4" aria-hidden="true" />
                )}
                Marcar como leída
              </Button>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                disabled={deshabilitado}
                aria-label={`Marcar como no leída la ${descripcion}`}
                onClick={onMarcarNoLeida}
              >
                {moderando ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Undo2 className="mr-1 h-4 w-4" aria-hidden="true" />
                )}
                Marcar como no leída
              </Button>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ListaResenas({
  medicoId,
  pestana,
}: {
  medicoId: string | undefined;
  pestana: PestanaResena;
}) {
  const q = useResenasQuery(medicoId, pestana);
  const moderar = useModerarResenaMutation();
  const marcarLeida = useMarcarLeidaMutation();
  const [procesandoId, setProcesandoId] = useState<string | null>(null);
  const [avisoSinLanding, setAvisoSinLanding] = useState(false);
  const ocupado = moderar.isPending || marcarLeida.isPending;

  function onModerar(resenaId: string, aprobar: boolean) {
    setProcesandoId(resenaId);
    setAvisoSinLanding(false);
    moderar.mutate(
      { resenaId, aprobar },
      {
        onSuccess: (r) => {
          if (!r.ok) {
            // La reseña NO cambió de estado. Se explica el motivo en español.
            if (r.codigo === "sin_landing") {
              setAvisoSinLanding(true);
              toast.error(`${MENSAJE_SIN_LANDING}.`);
            } else {
              toast.error(r.mensaje);
            }
            return;
          }
          if (!r.aprobada) toast.success("Reseña rechazada");
          else if (r.landingPublicada) toast.success("Publicada en tu web");
          else toast.success("Aprobada. Se mostrará en tu web cuando la publiques");
        },
        onError: (e) =>
          toast.error(mensajeParaUsuario(e, "No se pudo moderar la reseña. Inténtalo de nuevo.")),
        onSettled: () => setProcesandoId(null),
      },
    );
  }

  function cambiarLeida(resenaId: string, leida: boolean) {
    setProcesandoId(resenaId);
    marcarLeida.mutate(
      { resenaId, leida },
      {
        onSuccess: () => toast.success(leida ? "Marcada como leída" : "Marcada como no leída"),
        onError: (e) =>
          toast.error(
            mensajeParaUsuario(e, "No se pudo actualizar la reseña. Inténtalo de nuevo."),
          ),
        onSettled: () => setProcesandoId(null),
      },
    );
  }

  if (q.isPending) {
    return (
      <div className="space-y-3" role="status" aria-live="polite" aria-busy="true">
        <span className="sr-only">Cargando reseñas…</span>
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }
  if (q.isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No se pudieron cargar las reseñas</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>
            {mensajeParaUsuario(q.error, "No se pudieron cargar las reseñas. Inténtalo de nuevo.")}
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => void q.refetch()}
            disabled={q.isFetching}
          >
            <RefreshCw className="mr-1 h-4 w-4" /> Reintentar
          </Button>
        </AlertDescription>
      </Alert>
    );
  }
  if (q.data.length === 0) {
    const vacio: Record<PestanaResena, string> = {
      por_aprobar: "No tienes reseñas por aprobar.",
      privadas: "No tienes reseñas privadas.",
      aprobadas: "Aún no has aprobado reseñas.",
    };
    return (
      <p className="py-6 text-sm text-muted-foreground" role="status">
        {vacio[pestana]}
      </p>
    );
  }
  return (
    <div className="space-y-3">
      {avisoSinLanding ? (
        <Alert variant="destructive" role="alert">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertTitle>La reseña no se aprobó</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>{MENSAJE_SIN_LANDING}.</p>
            <Link to="/marca" className="font-medium underline underline-offset-2">
              Ir a configurar mi página web
            </Link>
          </AlertDescription>
        </Alert>
      ) : null}
      <div className="space-y-3" role="list" aria-label="Lista de reseñas">
        {q.data.map((r) => (
          <TarjetaResena
            key={r.id}
            resena={r}
            pestana={pestana}
            moderando={procesandoId === r.id && ocupado}
            deshabilitado={ocupado}
            onModerar={(aprobar) => onModerar(r.id, aprobar)}
            onMarcarLeida={() => cambiarLeida(r.id, true)}
            onMarcarNoLeida={() => cambiarLeida(r.id, false)}
          />
        ))}
      </div>
      {q.data.length >= LIMITE_LISTA_RESENAS ? (
        <p className="text-xs text-muted-foreground">
          Se muestran las {LIMITE_LISTA_RESENAS} reseñas más recientes. Hay más antiguas que no
          aparecen aquí.
        </p>
      ) : null}
    </div>
  );
}

function ReputacionPage() {
  const medico = useMedicoReputacionQuery();
  const resumen = useResumenReputacionQuery(medico.data);
  const r = resumen.data;
  const tasa = r
    ? (r.tasa_respuesta ?? calcularTasaRespuesta(r.total_solicitadas, r.total_respondidas))
    : null;

  return (
    <DashboardShell>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Reputación"
          title="Reseñas de pacientes"
          description="Lo que opinan tus pacientes después de la consulta. Las notas bajas son privadas; los comentarios positivos solo se publican en tu web si el paciente lo autoriza y tú lo apruebas."
        />

        {medico.isError || resumen.isError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No se pudo cargar tu reputación</AlertTitle>
            <AlertDescription>
              {mensajeParaUsuario(
                medico.error ?? resumen.error,
                "Intenta de nuevo en unos minutos.",
              )}
            </AlertDescription>
            <Button
              size="sm"
              variant="outline"
              className="mt-2"
              onClick={() => void (medico.isError ? medico.refetch() : resumen.refetch())}
            >
              <RefreshCw className="mr-1 h-4 w-4" /> Reintentar
            </Button>
          </Alert>
        ) : null}

        {medico.isPending || (resumen.isPending && !!medico.data) ? <KpiGridSkeleton /> : null}

        {resumen.isSuccess ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <KpiCard
              titulo="Calificación promedio"
              valor={fmtPromedio(r?.promedio_calificacion)}
              ayuda={`Últimos 30 días: ${fmtPromedio(r?.ultimos_30d_promedio)}`}
            />
            <KpiCard
              titulo="Tasa de respuesta"
              valor={fmtPorcentaje(tasa)}
              ayuda={`${fmtEntero(r?.total_respondidas ?? 0)} respondidas de ${fmtEntero(r?.total_solicitadas ?? 0)} solicitadas`}
            />
            <KpiCard
              titulo="Por aprobar"
              valor={fmtEntero(r?.pendientes_aprobacion ?? 0)}
              ayuda="Comentarios que el paciente autorizó publicar"
            />
            <KpiCard
              titulo="Privadas sin leer"
              valor={fmtEntero(r?.privadas_sin_leer ?? 0)}
              ayuda="Comentarios que solo ves tú"
            />
          </div>
        ) : null}

        {resumen.isSuccess && !r ? (
          <p className="text-sm text-muted-foreground">
            Todavía no hay reseñas. Activa la solicitud de reseñas en Configuración → WhatsApp
            Business.
          </p>
        ) : null}

        <Tabs defaultValue="por_aprobar" className="max-w-3xl">
          <TabsList aria-label="Reseñas por estado">
            <TabsTrigger value="por_aprobar">
              Por aprobar{r && r.pendientes_aprobacion > 0 ? ` (${r.pendientes_aprobacion})` : ""}
            </TabsTrigger>
            <TabsTrigger value="privadas">
              Privadas{r && r.privadas_sin_leer > 0 ? ` (${r.privadas_sin_leer})` : ""}
            </TabsTrigger>
            <TabsTrigger value="aprobadas">Aprobadas</TabsTrigger>
          </TabsList>
          <TabsContent value="por_aprobar">
            <ListaResenas medicoId={medico.data} pestana="por_aprobar" />
          </TabsContent>
          <TabsContent value="privadas">
            <ListaResenas medicoId={medico.data} pestana="privadas" />
          </TabsContent>
          <TabsContent value="aprobadas">
            <ListaResenas medicoId={medico.data} pestana="aprobadas" />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  );
}
