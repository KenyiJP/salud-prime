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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { nombrePaciente, nuevaCitaSchema, type CitaRow } from "@/lib/clinica-schemas";
import { usePacientes } from "@/lib/pacientes.queries";
import { isoAInputLocal, useActualizarCita, useCrearCita } from "@/lib/citas.queries";

type FormValues = z.infer<typeof nuevaCitaSchema>;

const VACIO: FormValues = { paciente_id: "", fecha_hora: "", motivo: "" };

export function CitaDialog({ cita, trigger }: { cita?: CitaRow; trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { data: pacientes } = usePacientes();
  const crear = useCrearCita();
  const actualizar = useActualizarCita();
  const editando = !!cita;

  const valoresIniciales: FormValues = cita
    ? {
        paciente_id: cita.paciente_id,
        fecha_hora: isoAInputLocal(cita.fecha_hora),
        motivo: cita.motivo ?? "",
      }
    : VACIO;

  const form = useForm<FormValues>({
    resolver: zodResolver(nuevaCitaSchema),
    defaultValues: valoresIniciales,
  });

  useEffect(() => {
    if (open) {
      form.reset(
        cita
          ? {
              paciente_id: cita.paciente_id,
              fecha_hora: isoAInputLocal(cita.fecha_hora),
              motivo: cita.motivo ?? "",
            }
          : VACIO,
      );
    }
  }, [open, cita, form]);

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
      <DialogTrigger asChild>{trigger}</DialogTrigger>
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
