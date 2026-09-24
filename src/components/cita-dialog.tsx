import { useEffect, useState, type ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CitaCobroPanel } from "@/components/cita-cobro-panel";
import { nombrePaciente, nuevaCitaSchema, type CitaRow } from "@/lib/clinica-schemas";
import { usePacientes } from "@/lib/pacientes.queries";
import { isoAInputLocal, useActualizarCita, useCrearCita } from "@/lib/citas.queries";
import { useTiposConsulta } from "@/lib/agenda.queries";

type FormValues = z.infer<typeof nuevaCitaSchema>;

const VACIO: FormValues = {
  paciente_id: "",
  fecha_hora: "",
  motivo: "",
  tipo_consulta_id: "",
  duracion_minutos: 30,
};

function valoresDe(cita?: CitaRow, fechaHoraInicial?: string): FormValues {
  if (cita) {
    return {
      paciente_id: cita.paciente_id,
      fecha_hora: isoAInputLocal(cita.fecha_hora),
      motivo: cita.motivo ?? "",
      tipo_consulta_id: cita.tipo_consulta_id ?? "",
      duracion_minutos: cita.tipos_consulta?.duracion_minutos ?? 30,
    };
  }
  return { ...VACIO, fecha_hora: fechaHoraInicial ?? "" };
}

export function CitaDialog({
  cita,
  trigger,
  fechaHoraInicial,
  open: openProp,
  onOpenChange,
}: {
  cita?: CitaRow;
  trigger?: ReactNode;
  /** Value for <input type="datetime-local">, e.g. from a calendar slot click. */
  fechaHoraInicial?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [openInterno, setOpenInterno] = useState(false);
  const controlado = openProp !== undefined;
  const open = controlado ? openProp : openInterno;
  const setOpen = (v: boolean) => {
    if (!controlado) setOpenInterno(v);
    onOpenChange?.(v);
  };

  const { data: pacientes } = usePacientes();
  const { data: tipos } = useTiposConsulta();
  const crear = useCrearCita();
  const actualizar = useActualizarCita();
  const editando = !!cita;

  const form = useForm<FormValues>({
    resolver: zodResolver(nuevaCitaSchema),
    defaultValues: valoresDe(cita, fechaHoraInicial),
  });

  useEffect(() => {
    if (open) form.reset(valoresDe(cita, fechaHoraInicial));
  }, [open, cita, fechaHoraInicial, form]);

  function onSubmit(values: FormValues) {
    const opciones = {
      onSuccess: () => {
        setOpen(false);
        form.reset(VACIO);
      },
    };
    if (cita) actualizar.mutate({ ...values, id: cita.id }, opciones);
    else crear.mutate(values, opciones);
  }

  const pendiente = crear.isPending || actualizar.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editando ? "Editar cita" : "Agendar nueva cita"}</DialogTitle>
          <DialogDescription>
            Selecciona un paciente ya registrado en tu consultorio.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="paciente_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Paciente</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un paciente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {pacientes.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {nombrePaciente(p)}
                          {p.documento_identidad ? ` · ${p.documento_identidad}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {pacientes.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Registra un paciente primero.</p>
                  ) : null}
                  <FormMessage />
                </FormItem>
              )}
            />

            {tipos.length > 0 ? (
              <FormField
                control={form.control}
                name="tipo_consulta_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de consulta</FormLabel>
                    <Select
                      value={field.value || ""}
                      onValueChange={(value) => {
                        field.onChange(value);
                        const tipo = tipos.find((t) => t.id === value);
                        if (tipo) form.setValue("duracion_minutos", tipo.duracion_minutos);
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el tipo de consulta" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tipos.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.nombre} · {t.duracion_minutos} min
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="fecha_hora"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha y hora</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="duracion_minutos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duración (min)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={5}
                        step={5}
                        {...field}
                        value={field.value ?? 30}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="motivo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo (opcional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Ej. Control de presión arterial" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {cita ? <CitaCobroPanel cita={cita} /> : null}

            <DialogFooter>
              <Button type="submit" disabled={pendiente}>
                {pendiente ? "Guardando…" : editando ? "Guardar cambios" : "Agendar cita"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
