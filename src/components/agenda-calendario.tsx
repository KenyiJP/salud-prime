import { useCallback, useMemo, useState } from "react";
import { Calendar, dateFnsLocalizer, Views, type View } from "react-big-calendar";
import { format, getDay, parse, startOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { CitaDialog } from "@/components/cita-dialog";
import { nombrePaciente } from "@/lib/clinica-schemas";
import { isoAInputLocal, useCitas, type CitaRow } from "@/lib/citas.queries";
import { useBloqueos } from "@/lib/agenda.queries";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { locale: es }),
  getDay,
  locales: { es },
});

const MENSAJES = {
  date: "Fecha",
  time: "Hora",
  event: "Cita",
  allDay: "Todo el día",
  week: "Semana",
  work_week: "Semana laboral",
  day: "Día",
  month: "Mes",
  previous: "Anterior",
  next: "Siguiente",
  yesterday: "Ayer",
  tomorrow: "Mañana",
  today: "Hoy",
  agenda: "Agenda",
  noEventsInRange: "No hay citas en este rango.",
  showMore: (total: number) => `+${total} más`,
};

type EventoAgenda = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  cita?: CitaRow;
  bloqueado?: boolean;
};

const COLOR_ESTADO: Record<string, { bg: string; fg: string }> = {
  pendiente: { bg: "#d3a318", fg: "#1b1600" },
  confirmada: { bg: "#2f9e6b", fg: "#04150d" },
  atendida: { bg: "#2f7fbf", fg: "#04121d" },
  cancelada: { bg: "#5b6570", fg: "#e6ebef" },
};

const DURACION_POR_DEFECTO_MIN = 30;

export function AgendaCalendario() {
  const { data: citas } = useCitas();
  const { data: bloqueos } = useBloqueos();

  const [view, setView] = useState<View>(Views.WEEK);
  const [date, setDate] = useState(() => new Date());
  const [slotDialog, setSlotDialog] = useState<string | null>(null);
  const [citaSeleccionada, setCitaSeleccionada] = useState<CitaRow | null>(null);

  const eventos = useMemo<EventoAgenda[]>(() => {
    const deCitas = citas.map((c) => {
      const inicio = new Date(c.fecha_hora);
      const minutos = c.tipos_consulta?.duracion_minutos ?? DURACION_POR_DEFECTO_MIN;
      return {
        id: c.id,
        title: `${nombrePaciente(c.pacientes)}${c.tipos_consulta ? ` · ${c.tipos_consulta.nombre}` : ""}`,
        start: inicio,
        end: new Date(inicio.getTime() + minutos * 60_000),
        cita: c,
      };
    });
    const deBloqueos = bloqueos.map((b) => ({
      id: `bloqueo-${b.id}`,
      title: b.motivo ? `Bloqueado · ${b.motivo}` : "Bloqueado",
      start: new Date(b.fecha_inicio),
      end: new Date(b.fecha_fin),
      bloqueado: true,
    }));
    return [...deCitas, ...deBloqueos];
  }, [citas, bloqueos]);

  const estaBloqueado = useCallback(
    (inicio: Date) =>
      bloqueos.some(
        (b) =>
          inicio >= new Date(b.fecha_inicio) && inicio < new Date(b.fecha_fin),
      ),
    [bloqueos],
  );

  const eventPropGetter = useCallback((evento: EventoAgenda) => {
    if (evento.bloqueado) {
      return {
        style: {
          backgroundColor: "rgba(190, 60, 60, 0.28)",
          color: "#ffd9d9",
          border: "1px solid rgba(220, 90, 90, 0.55)",
          cursor: "not-allowed",
        },
      };
    }
    const estado = evento.cita?.estado ?? "pendiente";
    const color = COLOR_ESTADO[estado] ?? COLOR_ESTADO.pendiente;
    return {
      style: {
        backgroundColor: color.bg,
        color: color.fg,
        textDecoration: estado === "cancelada" ? "line-through" : undefined,
        opacity: estado === "cancelada" ? 0.75 : 1,
      },
    };
  }, []);

  return (
    <div className="rounded-xl border border-border/60 bg-card p-3 sm:p-4">
      <Leyenda />
      <div className="h-[640px]">
        <Calendar<EventoAgenda>
          localizer={localizer}
          culture="es"
          messages={MENSAJES}
          events={eventos}
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          views={[Views.MONTH, Views.WEEK, Views.DAY]}
          defaultView={Views.WEEK}
          step={15}
          timeslots={2}
          selectable
          popup
          eventPropGetter={eventPropGetter}
          onSelectSlot={({ start }) => {
            if (estaBloqueado(start)) return;
            setSlotDialog(isoAInputLocal(start.toISOString()));
          }}
          onSelectEvent={(evento) => {
            if (evento.bloqueado || !evento.cita) return;
            setCitaSeleccionada(evento.cita);
          }}
        />
      </div>

      {slotDialog ? (
        <CitaDialog
          key={slotDialog}
          fechaHoraInicial={slotDialog}
          open
          onOpenChange={(abierto) => {
            if (!abierto) setSlotDialog(null);
          }}
        />
      ) : null}

      {citaSeleccionada ? (
        <CitaDialog
          key={citaSeleccionada.id}
          cita={citaSeleccionada}
          open
          onOpenChange={(abierto) => {
            if (!abierto) setCitaSeleccionada(null);
          }}
        />
      ) : null}
    </div>
  );
}

function Leyenda() {
  const items = [
    { label: "Pendiente", color: COLOR_ESTADO.pendiente.bg },
    { label: "Confirmada", color: COLOR_ESTADO.confirmada.bg },
    { label: "Atendida", color: COLOR_ESTADO.atendida.bg },
    { label: "Cancelada", color: COLOR_ESTADO.cancelada.bg },
    { label: "Bloqueado", color: "rgba(190, 60, 60, 0.6)" },
  ];
  return (
    <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: i.color }}
          />
          {i.label}
        </span>
      ))}
    </div>
  );
}
