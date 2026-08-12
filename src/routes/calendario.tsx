import { createFileRoute } from "@tanstack/react-router";
import { requireSession } from "@/lib/auth-guard";
import { useSuspenseQuery } from "@tanstack/react-query";
import { CalendarDays, Clock, Pencil, Plus, Trash2 } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { PageHeader, PlaceholderCard } from "@/components/page-primitives";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CitaDialog } from "@/components/cita-dialog";
import { ConfirmarEliminar } from "@/components/confirmar-eliminar";
import { nombrePaciente } from "@/lib/clinica-schemas";
import { pacientesQuery } from "@/lib/pacientes.queries";
import {
  citasQuery,
  fechaCorta,
  horaCorta,
  useCambiarEstadoCita,
  useEliminarCita,
  type CitaRow,
  type EstadoCita,
} from "@/lib/citas.queries";

export const Route = createFileRoute("/calendario")({
  beforeLoad: () => requireSession(),
  // Client-only: the data below requires an authenticated Supabase session,
  // which does not exist during SSR/prerender.
  ssr: false,
  head: () => ({
    meta: [
      { title: "Calendario de Citas — MediSuite" },
      {
        name: "description",
        content: "Agenda médica con citas programadas, motivo y estado desde tu base de datos clínica.",
      },
      { property: "og:title", content: "Calendario de Citas — MediSuite" },
      {
        property: "og:description",
        content: "Consulta y gestiona la agenda de citas de tu consultorio.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(citasQuery());
    context.queryClient.ensureQueryData(pacientesQuery());
  },
  component: CalendarioPage,
  errorComponent: ({ error }) => (
    <DashboardShell>
      <div role="alert" className="rounded-xl border border-destructive/40 bg-card p-6 text-sm">
        No se pudieron cargar las citas: {error.message}
      </div>
    </DashboardShell>
  ),
  notFoundComponent: () => (
    <DashboardShell>
      <p className="text-sm text-muted-foreground">Sin citas disponibles.</p>
    </DashboardShell>
  ),
});

function CalendarioPage() {
  const { data: citas } = useSuspenseQuery(citasQuery());
  const eliminar = useEliminarCita();

  return (
    <DashboardShell>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Agenda"
          title="Calendario de Citas"
          description="Citas leídas de la tabla citas, vinculadas a tus pacientes."
          actions={
            <CitaDialog
              trigger={
                <Button className="gap-2">
                  <Plus className="h-4 w-4" /> Nueva cita
                </Button>
              }
            />
          }
        />

        <div className="grid gap-4 md:grid-cols-3">
          <PlaceholderCard
            icon={<CalendarDays className="h-5 w-5" />}
            title="Vista semanal"
            description="El calendario semanal con drag-and-drop reemplazará este listado."
          />
          <PlaceholderCard
            icon={<Clock className="h-5 w-5" />}
            title="Bloques de disponibilidad"
            description="Define horarios de atención por sede y tipo de consulta."
          />
          <PlaceholderCard
            icon={<Plus className="h-5 w-5" />}
            title="Reserva online"
            description="Comparte un enlace público para que pacientes agenden solos."
          />
        </div>

        <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
          <table className="w-full text-sm">
            <thead className="bg-background/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Fecha</th>
                <th className="px-4 py-3 text-left font-medium">Hora</th>
                <th className="px-4 py-3 text-left font-medium">Paciente</th>
                <th className="hidden px-4 py-3 text-left font-medium md:table-cell">Motivo</th>
                <th className="px-4 py-3 text-left font-medium">Estado</th>
                <th className="px-4 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {citas.map((c) => (
                <tr key={c.id} className="border-t border-border/50">
                  <td className="px-4 py-3 whitespace-nowrap">{fechaCorta(c.fecha_hora)}</td>
                  <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">{horaCorta(c.fecha_hora)}</td>
                  <td className="px-4 py-3">{nombrePaciente(c.pacientes)}</td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {c.motivo ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <EstadoCitaCell cita={c} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <CitaDialog
                        cita={c}
                        trigger={
                          <Button variant="ghost" size="icon" aria-label="Editar cita">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        }
                      />
                      <ConfirmarEliminar
                        title="¿Eliminar cita?"
                        description={`Se eliminará la cita de ${nombrePaciente(c.pacientes)} del ${fechaCorta(c.fecha_hora)} a las ${horaCorta(c.fecha_hora)}.`}
                        onConfirm={() => eliminar.mutate({ id: c.id })}
                        disabled={eliminar.isPending}
                        trigger={
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Eliminar cita"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        }
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {citas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No hay citas registradas.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}

function EstadoCitaCell({ cita }: { cita: CitaRow }) {
  const cambiarEstado = useCambiarEstadoCita();
  return (
    <Select
      value={cita.estado ?? "pendiente"}
      onValueChange={(estado) => cambiarEstado.mutate({ id: cita.id, estado: estado as EstadoCita })}
    >
      <SelectTrigger className="h-7 w-[140px] text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="pendiente">Pendiente</SelectItem>
        <SelectItem value="confirmada">Confirmada</SelectItem>
        <SelectItem value="atendida">Atendida</SelectItem>
        <SelectItem value="cancelada">Cancelada</SelectItem>
      </SelectContent>
    </Select>
  );
}
