import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Día 26B (ajuste UX): perfil del asistente de WhatsApp por médico.
// Las columnas nuevas de `medicos` aún no están en types.ts (lo regenera Lovable):
// se tipan localmente y se castea el update, igual que triaje-config-card.

type Tono = "formal" | "cercano" | "breve";
type Sexo = "M" | "F";
type NombreModo = "corto" | "completo";
type Derivacion = "nunca" | "siempre" | "horario";

interface Perfil {
  id: string;
  nombres: string;
  apellidos: string;
  especialidad: string | null;
  sexo: Sexo | null;
  bot_tono: Tono;
  bot_nombre_modo: NombreModo;
  bot_derivacion_modo: Derivacion;
  bot_derivacion_telefono: string | null;
  bot_derivacion_desde: string | null;
  bot_derivacion_hasta: string | null;
}

const COLUMNAS =
  "id, nombres, apellidos, especialidad, sexo, bot_tono, bot_nombre_modo, bot_derivacion_modo, " +
  "bot_derivacion_telefono, bot_derivacion_desde, bot_derivacion_hasta";

// Mismas especialidades que `plantillas_especialidad` (Día 11).
const ESPECIALIDADES = [
  "Cardiología", "Dermatología", "Endocrinología", "Gastroenterología", "Ginecología y Obstetricia",
  "Medicina General / Familiar", "Medicina Interna", "Neumología", "Neurología", "Oftalmología",
  "Otorrinolaringología (ORL)", "Pediatría", "Psiquiatría", "Traumatología y Ortopedia", "Urología",
];

const TONOS: Array<{ id: Tono; titulo: string; ejemplo: string }> = [
  { id: "formal", titulo: "Formal", ejemplo: "“Con gusto. ¿Para qué fecha desea la cita?”" },
  { id: "cercano", titulo: "Cercano", ejemplo: "“¡Claro! ¿Para qué día quieres la cita? 😊”" },
  { id: "breve", titulo: "Breve", ejemplo: "“¿Qué día prefieres?”" },
];

const queryKey = ["medico-perfil-bot"] as const;

async function getPerfil(): Promise<Perfil> {
  const { data: u, error: ue } = await supabase.auth.getUser();
  if (ue || !u.user) throw new Error("Tu sesión expiró. Vuelve a iniciar sesión.");
  const { data, error } = await supabase
    .from("medicos")
    .select(COLUMNAS as "id")
    .eq("user_id", u.user.id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("No existe un perfil médico vinculado a esta cuenta.");
  return data as unknown as Perfil;
}

const hhmm = (v: string | null) => (v ? v.slice(0, 5) : "");

/** Saludo según la hora de Lima (mismo criterio que el bot). */
function saludoAhora(): string {
  const h = Number(
    new Intl.DateTimeFormat("en-GB", { timeZone: "America/Lima", hour: "2-digit", hourCycle: "h23" }).format(new Date()),
  );
  return h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
}

function nombreVisible(p: Pick<Perfil, "nombres" | "apellidos">, modo: NombreModo): string {
  const n = p.nombres.split(/\s+/).filter(Boolean);
  const a = p.apellidos.split(/\s+/).filter(Boolean);
  return (modo === "completo" ? [...n, ...a] : [n[0], a[0]].filter(Boolean)).join(" ");
}

/** Solo dígitos; un celular peruano de 9 dígitos recibe el prefijo 51. */
function normalizarTelefono(raw: string): string {
  const d = raw.replace(/\D/g, "");
  return d.length === 9 ? `51${d}` : d;
}

export function PerfilBotCard() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey, queryFn: getPerfil });
  const [f, setF] = useState<Perfil | null>(null);

  useEffect(() => {
    if (q.data) setF(q.data);
  }, [q.data]);

  const guardar = useMutation({
    mutationFn: async (p: Perfil) => {
      if (!p.sexo) throw new Error("Indica si eres Dr. o Dra.: el asistente lo usa para dirigirse a tus pacientes.");
      const tel = p.bot_derivacion_telefono ? normalizarTelefono(p.bot_derivacion_telefono) : "";
      if (p.bot_derivacion_modo !== "nunca" && !/^[0-9]{9,15}$/.test(tel)) {
        throw new Error("Ingresa tu número de WhatsApp con código de país (ej. 51969505065).");
      }
      if (p.bot_derivacion_modo === "horario") {
        if (!p.bot_derivacion_desde || !p.bot_derivacion_hasta) throw new Error("Indica la hora de inicio y de fin.");
        if (hhmm(p.bot_derivacion_desde) === hhmm(p.bot_derivacion_hasta)) {
          throw new Error("La hora de inicio y de fin no pueden ser iguales.");
        }
      }
      const cambios = {
        sexo: p.sexo,
        especialidad: p.especialidad,
        bot_tono: p.bot_tono,
        bot_nombre_modo: p.bot_nombre_modo,
        bot_derivacion_modo: p.bot_derivacion_modo,
        bot_derivacion_telefono: p.bot_derivacion_modo === "nunca" ? null : tel,
        bot_derivacion_desde: p.bot_derivacion_modo === "horario" ? p.bot_derivacion_desde : null,
        bot_derivacion_hasta: p.bot_derivacion_modo === "horario" ? p.bot_derivacion_hasta : null,
      };
      const { error } = await supabase.from("medicos").update(cambios as never).eq("id", p.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey });
      toast.success("Perfil del asistente guardado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (q.isLoading || !f) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
          {q.isError ? (q.error as Error).message : (<><Loader2 className="h-4 w-4 animate-spin" /> Cargando…</>)}
        </CardContent>
      </Card>
    );
  }

  const set = <K extends keyof Perfil>(k: K, v: Perfil[K]) => setF({ ...f, [k]: v });
  const prefijo = f.sexo === "F" ? "Dra." : f.sexo === "M" ? "Dr." : "";
  const de = f.sexo === "F" ? "de la Dra." : f.sexo === "M" ? "del Dr." : "de";
  const nombre = nombreVisible(f, f.bot_nombre_modo);
  const vistaPrevia = `${saludoAhora()}. Soy el asistente virtual ${de} ${nombre}.`;
  const espEnLista = !f.especialidad || ESPECIALIDADES.includes(f.especialidad);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Perfil de tu asistente de WhatsApp</CardTitle>
        <CardDescription>
          Define cómo se presenta y cómo habla el asistente con tus pacientes. Atiende y agenda citas las 24 horas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Identidad */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Cómo te presenta</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Tratamiento</Label>
              <RadioGroup value={f.sexo ?? ""} onValueChange={(v) => set("sexo", v as Sexo)} className="flex gap-6">
                <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="M" /> Dr. (médico)</label>
                <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="F" /> Dra. (médica)</label>
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label>Especialidad</Label>
              <Select value={f.especialidad ?? ""} onValueChange={(v) => set("especialidad", v)}>
                <SelectTrigger><SelectValue placeholder="Selecciona tu especialidad" /></SelectTrigger>
                <SelectContent>
                  {!espEnLista && f.especialidad && <SelectItem value={f.especialidad}>{f.especialidad}</SelectItem>}
                  {ESPECIALIDADES.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Los avisos de salud mental (Línea 113) solo se muestran si eres psiquiatra.
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Nombre que usa el asistente</Label>
            <RadioGroup value={f.bot_nombre_modo} onValueChange={(v) => set("bot_nombre_modo", v as NombreModo)} className="space-y-1">
              <label className="flex items-center gap-2 text-sm">
                <RadioGroupItem value="corto" /> Corto: {prefijo} {nombreVisible(f, "corto")}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <RadioGroupItem value="completo" /> Completo: {prefijo} {nombreVisible(f, "completo")}
              </label>
            </RadioGroup>
          </div>
          <p className="rounded-md border border-border/60 bg-muted/40 p-3 text-sm">
            <span className="text-xs text-muted-foreground">Vista previa del saludo</span><br />
            {vistaPrevia}
          </p>
        </section>

        {/* Tono */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Tono de respuesta</h3>
          <RadioGroup value={f.bot_tono} onValueChange={(v) => set("bot_tono", v as Tono)} className="grid gap-3 sm:grid-cols-3">
            {TONOS.map((t) => (
              <label
                key={t.id}
                className={`cursor-pointer rounded-lg border p-3 text-sm transition ${
                  f.bot_tono === t.id ? "border-primary bg-primary/5" : "border-border/60"
                }`}
              >
                <span className="flex items-center gap-2 font-medium"><RadioGroupItem value={t.id} /> {t.titulo}</span>
                <span className="mt-2 block text-xs text-muted-foreground">{t.ejemplo}</span>
              </label>
            ))}
          </RadioGroup>
        </section>

        {/* Derivación */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Pasar al paciente a tu WhatsApp</h3>
          <p className="text-xs text-muted-foreground">
            Si un paciente pide hablar contigo, el asistente le comparte tu WhatsApp solo cuando tú lo permitas. Fuera de ese
            horario sigue atendiendo y agendando citas, y le explica que no atiendes por ese medio en ese momento.
          </p>
          <RadioGroup value={f.bot_derivacion_modo} onValueChange={(v) => set("bot_derivacion_modo", v as Derivacion)} className="space-y-1">
            <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="nunca" /> No, que solo agende citas</label>
            <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="siempre" /> Sí, las 24 horas</label>
            <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="horario" /> Sí, solo en un rango de horas</label>
          </RadioGroup>
          {f.bot_derivacion_modo !== "nunca" && (
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2 sm:col-span-3">
                <Label htmlFor="deriv-tel">Tu número de WhatsApp (con código de país)</Label>
                <Input
                  id="deriv-tel" inputMode="tel" placeholder="51969505065"
                  value={f.bot_derivacion_telefono ?? ""}
                  onChange={(e) => set("bot_derivacion_telefono", e.target.value)}
                />
              </div>
              {f.bot_derivacion_modo === "horario" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="deriv-desde">Desde (hora de Lima)</Label>
                    <Input id="deriv-desde" type="time" value={hhmm(f.bot_derivacion_desde)} onChange={(e) => set("bot_derivacion_desde", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deriv-hasta">Hasta</Label>
                    <Input id="deriv-hasta" type="time" value={hhmm(f.bot_derivacion_hasta)} onChange={(e) => set("bot_derivacion_hasta", e.target.value)} />
                  </div>
                </>
              )}
            </div>
          )}
        </section>

        <Button onClick={() => guardar.mutate(f)} disabled={guardar.isPending}>
          {guardar.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guardar perfil
        </Button>
      </CardContent>
    </Card>
  );
}
