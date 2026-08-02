import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Plus } from "lucide-react";
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
import { nuevaCitaSchema } from "@/lib/clinica-schemas";
import { usePacientes } from "@/lib/pacientes.queries";
import { useCrearCita } from "@/lib/citas.queries";

type FormValues = z.infer<typeof nuevaCitaSchema>;

export function NuevaCitaDialog() {
  const [open, setOpen] = useState(false);
  const { data: pacientes } = usePacientes();
  const crearCita = useCrearCita();

  const form = useForm<FormValues>({
    resolver: zodResolver(nuevaCitaSchema),
    defaultValues: { paciente_id: "", fecha_hora: "", motivo_consulta: "", monto_pago: 0 },
  });

  function onSubmit(values: FormValues) {
    crearCita.mutate(values, {
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
          <Plus className="h-4 w-4" /> Nueva cita
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agendar nueva cita</DialogTitle>
          <DialogDescription>Selecciona un paciente ya registrado en tu consultorio.</DialogDescription>
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
                          {p.nombre_completo}
                          {p.dni ? ` · DNI ${p.dni}` : ""}
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
              name="motivo_consulta"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo de consulta (opcional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Ej. Control de presión arterial" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="monto_pago"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto a cobrar (S/.)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={crearCita.isPending}>
                {crearCita.isPending ? "Agendando…" : "Agendar cita"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
