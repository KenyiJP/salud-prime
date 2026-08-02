import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { UserPlus } from "lucide-react";
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
import { nuevoPacienteSchema } from "@/lib/clinica-schemas";
import { useCrearPaciente } from "@/lib/pacientes.queries";

type FormValues = z.infer<typeof nuevoPacienteSchema>;

export function NuevoPacienteDialog() {
  const [open, setOpen] = useState(false);
  const crearPaciente = useCrearPaciente();

  const form = useForm<FormValues>({
    resolver: zodResolver(nuevoPacienteSchema),
    defaultValues: {
      nombre_completo: "",
      dni: "",
      telefono_whatsapp: "",
      email: "",
      antecedentes_alergias: "",
    },
  });

  function onSubmit(values: FormValues) {
    crearPaciente.mutate(values, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
      },
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) form.reset();
      }}
    >
      <DialogTrigger asChild>
        <Button className="gap-2">
          <UserPlus className="h-4 w-4" /> Nuevo paciente
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar nuevo paciente</DialogTitle>
          <DialogDescription>Se guardará en tu consultorio y solo tú podrás verlo.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nombre_completo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Juan Pérez Gómez" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dni"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>DNI</FormLabel>
                    <FormControl>
                      <Input inputMode="numeric" maxLength={8} placeholder="8 dígitos" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="telefono_whatsapp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp</FormLabel>
                    <FormControl>
                      <Input inputMode="numeric" maxLength={9} placeholder="9 dígitos" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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
              name="antecedentes_alergias"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Antecedentes / alergias (opcional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Ej. Alergia a la penicilina" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={crearPaciente.isPending}>
                {crearPaciente.isPending ? "Guardando…" : "Guardar paciente"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
