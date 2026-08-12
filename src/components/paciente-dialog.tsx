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
import { nuevoPacienteSchema, type PacienteRow } from "@/lib/clinica-schemas";
import { useActualizarPaciente, useCrearPaciente } from "@/lib/pacientes.queries";

type FormValues = z.infer<typeof nuevoPacienteSchema>;

const VACIO: FormValues = {
  nombres: "",
  apellidos: "",
  documento_identidad: "",
  telefono: "",
  email: "",
  fecha_nacimiento: "",
};

function desdePaciente(p: PacienteRow): FormValues {
  return {
    nombres: p.nombres,
    apellidos: p.apellidos,
    documento_identidad: p.documento_identidad ?? "",
    telefono: p.telefono ?? "",
    email: p.email ?? "",
    fecha_nacimiento: p.fecha_nacimiento ?? "",
  };
}

export function PacienteDialog({
  paciente,
  trigger,
}: {
  paciente?: PacienteRow;
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const crear = useCrearPaciente();
  const actualizar = useActualizarPaciente();
  const editando = !!paciente;

  const form = useForm<FormValues>({
    resolver: zodResolver(nuevoPacienteSchema),
    defaultValues: paciente ? desdePaciente(paciente) : VACIO,
  });

  useEffect(() => {
    if (open) form.reset(paciente ? desdePaciente(paciente) : VACIO);
  }, [open, paciente, form]);

  function onSubmit(values: FormValues) {
    const opciones = {
      onSuccess: () => {
        setOpen(false);
        form.reset(VACIO);
      },
    };
    if (paciente) actualizar.mutate({ ...values, id: paciente.id }, opciones);
    else crear.mutate(values, opciones);
  }

  const pendiente = crear.isPending || actualizar.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editando ? "Editar paciente" : "Registrar nuevo paciente"}</DialogTitle>
          <DialogDescription>
            {editando
              ? "Actualiza los datos de contacto e identificación del paciente."
              : "Se guardará en tu consultorio y solo tú podrás verlo."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="nombres"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombres</FormLabel>
                    <FormControl>
                      <Input placeholder="Juan Carlos" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="apellidos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apellidos</FormLabel>
                    <FormControl>
                      <Input placeholder="Pérez Gómez" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="documento_identidad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Documento de identidad (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="DNI, CE o pasaporte" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="telefono"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono (opcional)</FormLabel>
                    <FormControl>
                      <Input inputMode="tel" placeholder="999 999 999" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo (opcional)</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="paciente@correo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fecha_nacimiento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de nacimiento (opcional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={pendiente}>
                {pendiente ? "Guardando…" : editando ? "Guardar cambios" : "Guardar paciente"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
