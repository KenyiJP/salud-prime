import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  FileText,
  FlaskConical,
  Lock,
  Pill,
  Printer,
  Save,
  Scan,
  ShieldCheck,
  Star,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BuscadorCie10 } from "@/components/buscador-cie10";
import { CamposEspecialidad } from "@/components/campos-especialidad";
import { cn } from "@/lib/utils";
import { nombrePaciente, type PacienteRow } from "@/lib/clinica-schemas";
import type { MedicoEhr } from "@/lib/ehr.functions";
import {
  CURSOS,
  ESTADOS_GENERALES,
  FORMAS_INICIO,
  FUNCIONES_BIOLOGICAS,
  REGIONES_EXAMEN,
  TIPOS_ADENDA,
  TIPOS_ATENCION,
  TIPOS_DIAGNOSTICO,
  UNIDADES_TIEMPO,
  atencionAFormulario,
  atencionVacia,
  clasificarImc,
  edadEnAnios,
  type AdendaRow,
  type AtencionInput,
  type AtencionRow,
  type Diagnostico,
  type PlantillaRow,
} from "@/lib/ehr-schemas";
import { useCrearAdenda, useFirmarAtencion, useGuardarBorrador } from "@/lib/ehr.queries";

type Props = {
  paciente: PacienteRow;
  medico: MedicoEhr;
  plantillas: PlantillaRow[];
  atencion: AtencionRow | null;
  adendas: AdendaRow[];
  onGuardado?: (row: AtencionRow) => void;
};

export function AtencionForm({
  paciente,
  medico,
  plantillas,
  atencion,
  adendas,
  onGuardado,
}: Props) {
  const plantillaPorDefecto = useMemo(() => {
    const deEspecialidad = plantillas.filter(
      (p) => p.especialidad === (medico.especialidad ?? ""),
    );
    return (
      deEspecialidad.find((p) => p.es_default) ??
      deEspecialidad[0] ??
      plantillas.find((p) => p.es_default) ??
      plantillas[0] ??
      null
    );
  }, [plantillas, medico.especialidad]);

  const [form, setForm] = useState<AtencionInput>(() =>
    atencion
      ? atencionAFormulario(atencion)
      : {
          ...atencionVacia(paciente.id),
          plantilla_id: plantillaPorDefecto?.id ?? null,
          plantilla_version: plantillaPorDefecto?.version ?? null,
        },
  );
  const [tiempoValor, setTiempoValor] = useState(
    () => (form.tiempo_enfermedad ?? "").split(" ")[0] ?? "",
  );
  const [tiempoUnidad, setTiempoUnidad] = useState(
    () => (form.tiempo_enfermedad ?? "").split(" ")[1] ?? "días",
  );
  const [confirmarFirma, setConfirmarFirma] = useState(false);
  const [adendaAbierta, setAdendaAbierta] = useState(false);
  const [adendaTipo, setAdendaTipo] = useState<string>(TIPOS_ADENDA[0]);
  const [adendaTexto, setAdendaTexto] = useState("");

  const guardar = useGuardarBorrador();
  const firmar = useFirmarAtencion();
  const adenda = useCrearAdenda();

  const firmada = atencion?.estado === "firmada";
  const anulada = atencion?.estado === "anulada";
  const soloLectura = firmada || anulada;

  const plantilla =
    plantillas.find((p) => p.id === form.plantilla_id) ?? plantillaPorDefecto ?? null;

  const set = <K extends keyof AtencionInput>(campo: K, valor: AtencionInput[K]) =>
    setForm((prev) => ({ ...prev, [campo]: valor }));

  const numero = (valor: string) => (valor === "" ? null : Number(valor));

  const imc = clasificarImc(form.peso ?? null, form.talla ?? null);
  const edad = edadEnAnios(paciente.fecha_nacimiento);
  const alergias = (form.antecedentes_alergicos ?? "").trim();

  const diagnosticos = form.diagnosticos ?? [];

  function actualizarDiagnostico(codigo: string, cambios: Partial<Diagnostico>) {
    set(
      "diagnosticos",
      diagnosticos.map((d) => (d.codigo_cie10 === codigo ? { ...d, ...cambios } : d)),
    );
  }

  function marcarPrincipal(codigo: string) {
    set(
      "diagnosticos",
      diagnosticos.map((d) => ({ ...d, es_principal: d.codigo_cie10 === codigo })),
    );
  }

  function guardarBorrador() {
    const tiempo = tiempoValor.trim() ? `${tiempoValor.trim()} ${tiempoUnidad}` : "";
    const payload: AtencionInput = { ...form, tiempo_enfermedad: tiempo };
    setForm(payload);
    guardar.mutate(payload, { onSuccess: (row) => onGuardado?.(row) });
  }

  return (
    <div className="space-y-6 pb-28">
      <CabeceraPaciente
        paciente={paciente}
        edad={edad}
        alergias={alergias}
        estado={atencion?.estado ?? "borrador"}
        firmadoAt={atencion?.firmado_at ?? null}
      />

      <section className="grid gap-4 rounded-xl border border-border/60 bg-card p-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Plantilla de especialidad</Label>
          <Select
            value={form.plantilla_id ?? ""}
            disabled={soloLectura}
            onValueChange={(v) => {
              const elegida = plantillas.find((p) => p.id === v) ?? null;
              setForm((prev) => ({
                ...prev,
                plantilla_id: v,
                plantilla_version: elegida?.version ?? null,
              }));
            }}
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Elige una plantilla" />
            </SelectTrigger>
            <SelectContent>
              {plantillas.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.especialidad} · {p.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {plantilla?.descripcion ? (
            <p className="text-xs text-muted-foreground">{plantilla.descripcion}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label>Tipo de atención</Label>
          <div className="flex flex-wrap gap-2">
            {TIPOS_ATENCION.map((tipo) => (
              <Button
                key={tipo}
                type="button"
                size="sm"
                disabled={soloLectura}
                variant={form.tipo_atencion === tipo ? "default" : "outline"}
                onClick={() => set("tipo_atencion", tipo)}
              >
                {tipo}
              </Button>
            ))}
          </div>
        </div>
      </section>

      <Tabs defaultValue="triaje">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="triaje">Triaje</TabsTrigger>
          <TabsTrigger value="anamnesis">Anamnesis</TabsTrigger>
          <TabsTrigger value="especialidad">Especialidad</TabsTrigger>
          <TabsTrigger value="examen">Examen físico</TabsTrigger>
          <TabsTrigger value="diagnosticos">Diagnósticos</TabsTrigger>
          <TabsTrigger value="plan">Plan y tratamiento</TabsTrigger>
        </TabsList>

        {/* ---------------------------------------------------- Triaje */}
        <TabsContent value="triaje" className="space-y-6 rounded-xl border border-border/60 bg-card p-5">
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="pas">PA sistólica (mmHg)</Label>
              <Input
                id="pas"
                type="number"
                disabled={soloLectura}
                value={form.presion_arterial_sistolica ?? ""}
                onChange={(e) =>
                  set("presion_arterial_sistolica", numero(e.target.value))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pad">PA diastólica (mmHg)</Label>
              <Input
                id="pad"
                type="number"
                disabled={soloLectura}
                value={form.presion_arterial_diastolica ?? ""}
                onChange={(e) =>
                  set("presion_arterial_diastolica", numero(e.target.value))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fc">Frecuencia cardíaca (lpm)</Label>
              <Input
                id="fc"
                type="number"
                disabled={soloLectura}
                value={form.frecuencia_cardiaca ?? ""}
                onChange={(e) => set("frecuencia_cardiaca", numero(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fr">Frecuencia respiratoria (rpm)</Label>
              <Input
                id="fr"
                type="number"
                disabled={soloLectura}
                value={form.frecuencia_respiratoria ?? ""}
                onChange={(e) => set("frecuencia_respiratoria", numero(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="temp">Temperatura (°C)</Label>
              <Input
                id="temp"
                type="number"
                step="0.1"
                disabled={soloLectura}
                value={form.temperatura ?? ""}
                onChange={(e) => set("temperatura", numero(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sat">Saturación O₂ (%)</Label>
              <Input
                id="sat"
                type="number"
                disabled={soloLectura}
                value={form.saturacion_oxigeno ?? ""}
                onChange={(e) => set("saturacion_oxigeno", numero(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="peso">Peso (kg)</Label>
              <Input
                id="peso"
                type="number"
                step="0.1"
                disabled={soloLectura}
                value={form.peso ?? ""}
                onChange={(e) => set("peso", numero(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="talla">Talla (m o cm)</Label>
              <Input
                id="talla"
                type="number"
                step="0.01"
                disabled={soloLectura}
                value={form.talla ?? ""}
                onChange={(e) => set("talla", numero(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pab">Perímetro abdominal (cm)</Label>
              <Input
                id="pab"
                type="number"
                step="0.1"
                disabled={soloLectura}
                value={form.perimetro_abdominal ?? ""}
                onChange={(e) => set("perimetro_abdominal", numero(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>IMC</Label>
              {imc ? (
                <div
                  className={cn(
                    "flex h-10 items-center gap-2 rounded-md px-3 text-sm ring-1",
                    imc.clase,
                  )}
                  data-imc={imc.imc}
                >
                  <span className="font-semibold">{imc.imc}</span>
                  <span className="truncate text-xs">{imc.estado}</span>
                </div>
              ) : (
                <p className="flex h-10 items-center text-xs text-muted-foreground">
                  Ingresa peso y talla.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-display text-sm font-semibold">Funciones biológicas</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              {FUNCIONES_BIOLOGICAS.map((f) => (
                <div key={f.id} className="space-y-2">
                  <Label htmlFor={`fb-${f.id}`}>{f.label}</Label>
                  <Input
                    id={`fb-${f.id}`}
                    disabled={soloLectura}
                    placeholder="Conservado / disminuido…"
                    value={(form.funciones_biologicas ?? {})[f.id] ?? ""}
                    onChange={(e) =>
                      set("funciones_biologicas", {
                        ...(form.funciones_biologicas ?? {}),
                        [f.id]: e.target.value,
                      })
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ------------------------------------------------- Anamnesis */}
        <TabsContent value="anamnesis" className="space-y-5 rounded-xl border border-border/60 bg-card p-5">
          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo de consulta</Label>
            <Input
              id="motivo"
              disabled={soloLectura}
              value={form.motivo_consulta ?? ""}
              onChange={(e) => set("motivo_consulta", e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="tiempo">Tiempo de enfermedad</Label>
              <div className="flex gap-2">
                <Input
                  id="tiempo"
                  type="number"
                  className="w-24"
                  disabled={soloLectura}
                  value={tiempoValor}
                  onChange={(e) => setTiempoValor(e.target.value)}
                />
                <Select
                  value={tiempoUnidad}
                  disabled={soloLectura}
                  onValueChange={setTiempoUnidad}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIDADES_TIEMPO.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Forma de inicio</Label>
              <div className="flex gap-2">
                {FORMAS_INICIO.map((f) => (
                  <Button
                    key={f}
                    type="button"
                    size="sm"
                    disabled={soloLectura}
                    variant={form.forma_inicio === f ? "default" : "outline"}
                    onClick={() => set("forma_inicio", f)}
                  >
                    {f}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Curso</Label>
              <div className="flex flex-wrap gap-2">
                {CURSOS.map((c) => (
                  <Button
                    key={c}
                    type="button"
                    size="sm"
                    disabled={soloLectura}
                    variant={form.curso_enfermedad === c ? "default" : "outline"}
                    onClick={() => set("curso_enfermedad", c)}
                  >
                    {c}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="relato">Relato cronológico (enfermedad actual)</Label>
            <Textarea
              id="relato"
              rows={8}
              disabled={soloLectura}
              value={form.relato_cronologico ?? ""}
              onChange={(e) => set("relato_cronologico", e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {(
              [
                ["antecedentes_patologicos", "Antecedentes patológicos"],
                ["antecedentes_quirurgicos", "Antecedentes quirúrgicos"],
                ["antecedentes_familiares", "Antecedentes familiares"],
                ["antecedentes_personales", "Antecedentes personales / hábitos"],
                ["medicacion_habitual", "Medicación habitual"],
              ] as const
            ).map(([campo, label]) => (
              <div key={campo} className="space-y-2">
                <Label htmlFor={campo}>{label}</Label>
                <Textarea
                  id={campo}
                  rows={3}
                  disabled={soloLectura}
                  value={(form[campo] as string) ?? ""}
                  onChange={(e) => set(campo, e.target.value)}
                />
              </div>
            ))}
            <div className="space-y-2">
              <Label htmlFor="antecedentes_alergicos" className="text-destructive">
                Alergias
              </Label>
              <Textarea
                id="antecedentes_alergicos"
                rows={3}
                disabled={soloLectura}
                placeholder="Penicilina, AINES, ninguna conocida…"
                className="border-destructive/40 focus-visible:ring-destructive/40"
                value={form.antecedentes_alergicos ?? ""}
                onChange={(e) => set("antecedentes_alergicos", e.target.value)}
              />
            </div>
          </div>
        </TabsContent>

        {/* --------------------------------------------- Especialidad */}
        <TabsContent value="especialidad" className="rounded-xl border border-border/60 bg-card p-5">
          <CamposEspecialidad
            plantilla={plantilla}
            valores={form.campos_especialidad ?? {}}
            soloLectura={soloLectura}
            onChange={(v) => set("campos_especialidad", v)}
          />
        </TabsContent>

        {/* --------------------------------------------- Examen físico */}
        <TabsContent value="examen" className="space-y-5 rounded-xl border border-border/60 bg-card p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="estado_general">Estado general</Label>
              <Input
                id="estado_general"
                list="estados-generales"
                disabled={soloLectura}
                placeholder="ABEG, ABEH, ABEN"
                value={form.estado_general ?? ""}
                onChange={(e) => set("estado_general", e.target.value)}
              />
              <datalist id="estados-generales">
                {ESTADOS_GENERALES.map((e) => (
                  <option key={e} value={e} />
                ))}
              </datalist>
            </div>
            <div className="space-y-2">
              <Label htmlFor="examen_general">Examen general / conciencia</Label>
              <Textarea
                id="examen_general"
                rows={3}
                disabled={soloLectura}
                value={form.examen_general ?? ""}
                onChange={(e) => set("examen_general", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-display text-sm font-semibold">Examen regional</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {REGIONES_EXAMEN.map((r) => (
                <div key={r.id} className="space-y-2">
                  <Label htmlFor={`reg-${r.id}`}>{r.label}</Label>
                  <Textarea
                    id={`reg-${r.id}`}
                    rows={2}
                    disabled={soloLectura}
                    value={(form.examen_regional ?? {})[r.id] ?? ""}
                    onChange={(e) =>
                      set("examen_regional", {
                        ...(form.examen_regional ?? {}),
                        [r.id]: e.target.value,
                      })
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* --------------------------------------------- Diagnósticos */}
        <TabsContent value="diagnosticos" className="space-y-5 rounded-xl border border-border/60 bg-card p-5">
          <div className="space-y-2">
            <Label>Buscar diagnóstico</Label>
            <BuscadorCie10
              disabled={soloLectura}
              yaAgregados={diagnosticos.map((d) => d.codigo_cie10)}
              onAgregar={(dx) =>
                set("diagnosticos", [
                  ...diagnosticos,
                  {
                    codigo_cie10: dx.codigo,
                    descripcion: dx.descripcion,
                    tipo: "P",
                    es_principal: diagnosticos.length === 0,
                  },
                ])
              }
            />
            <p className="text-xs text-muted-foreground">
              Flechas para elegir, Enter para agregar, Escape para cerrar.
            </p>
          </div>

          {diagnosticos.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border/70 px-4 py-6 text-center text-sm text-muted-foreground">
              Aún no agregaste diagnósticos.
            </p>
          ) : (
            <ul className="divide-y divide-border/50 overflow-hidden rounded-lg border border-border/60">
              {diagnosticos.map((d) => (
                <li
                  key={d.codigo_cie10}
                  className="flex flex-wrap items-center gap-3 px-3 py-2.5 text-sm"
                >
                  <span className="shrink-0 font-mono text-[11px] text-primary">
                    {d.codigo_cie10}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{d.descripcion}</span>
                  <Select
                    value={d.tipo}
                    disabled={soloLectura}
                    onValueChange={(v) =>
                      actualizarDiagnostico(d.codigo_cie10, {
                        tipo: v as Diagnostico["tipo"],
                      })
                    }
                  >
                    <SelectTrigger className="h-8 w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_DIAGNOSTICO.map((t) => (
                        <SelectItem key={t.valor} value={t.valor}>
                          {t.label} [{t.valor}]
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    size="sm"
                    variant={d.es_principal ? "default" : "outline"}
                    disabled={soloLectura}
                    className="gap-1"
                    aria-pressed={d.es_principal}
                    onClick={() => marcarPrincipal(d.codigo_cie10)}
                  >
                    <Star className="h-3.5 w-3.5" />
                    {d.es_principal ? "Principal" : "Marcar principal"}
                  </Button>
                  {!soloLectura ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Quitar ${d.descripcion}`}
                      onClick={() =>
                        set(
                          "diagnosticos",
                          diagnosticos.filter((x) => x.codigo_cie10 !== d.codigo_cie10),
                        )
                      }
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        {/* ------------------------------------------------------ Plan */}
        <TabsContent value="plan" className="space-y-5 rounded-xl border border-border/60 bg-card p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="plan_trabajo">Plan de trabajo (exámenes, interconsultas)</Label>
              <Textarea
                id="plan_trabajo"
                rows={4}
                disabled={soloLectura}
                value={form.plan_trabajo ?? ""}
                onChange={(e) => set("plan_trabajo", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tratamiento">Tratamiento</Label>
              <Textarea
                id="tratamiento"
                rows={4}
                disabled={soloLectura}
                value={form.tratamiento ?? ""}
                onChange={(e) => set("tratamiento", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="indicaciones">Indicaciones generales y signos de alarma</Label>
              <Textarea
                id="indicaciones"
                rows={4}
                disabled={soloLectura}
                value={form.indicaciones_generales ?? ""}
                onChange={(e) => set("indicaciones_generales", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proximo">Próximo control</Label>
              <Input
                id="proximo"
                disabled={soloLectura}
                placeholder="En 15 días / 12 de octubre"
                value={form.proximo_control ?? ""}
                onChange={(e) => set("proximo_control", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-display text-sm font-semibold">Emitir documentos</h3>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline" className="gap-2">
                <Link to="/recetario">
                  <Pill className="h-4 w-4" /> Emitir receta médica
                </Link>
              </Button>
              <Button asChild variant="outline" className="gap-2">
                <Link to="/laboratorios" search={{ paciente: paciente.id }}>
                  <FlaskConical className="h-4 w-4" /> Emitir orden de laboratorio
                </Link>
              </Button>
              <Button asChild variant="outline" className="gap-2">
                <Link to="/imagenologia" search={{ paciente: paciente.id }}>
                  <Scan className="h-4 w-4" /> Emitir orden de imagenología
                </Link>
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {firmada && adendas.length > 0 ? (
        <section className="space-y-3 rounded-xl border border-border/60 bg-card p-5">
          <h3 className="font-display text-sm font-semibold">Adendas de esta atención</h3>
          <ul className="space-y-3">
            {adendas.map((a) => (
              <li key={a.id} className="rounded-lg border border-border/60 p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <Badge variant="secondary">{a.tipo_adenda}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(a.created_at).toLocaleString("es-PE")}
                  </span>
                </div>
                <p className="mt-2 whitespace-pre-wrap">{a.contenido}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* ------------------------------------------- barra de acciones */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border/70 bg-background/95 px-4 py-3 backdrop-blur md:left-[var(--sidebar-width,0px)]">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-end gap-3">
          {firmada ? (
            <span className="mr-auto flex items-center gap-2 text-xs text-muted-foreground">
              <Lock className="h-3.5 w-3.5" /> Atención firmada e inmutable
            </span>
          ) : null}

          {!soloLectura ? (
            <Button className="gap-2" onClick={guardarBorrador} disabled={guardar.isPending}>
              <Save className="h-4 w-4" />
              {guardar.isPending ? "Guardando…" : "Guardar borrador"}
            </Button>
          ) : null}

          {!soloLectura && atencion?.id ? (
            <Button
              variant="secondary"
              className="gap-2"
              onClick={() => setConfirmarFirma(true)}
              disabled={firmar.isPending}
            >
              <ShieldCheck className="h-4 w-4" /> Firmar y finalizar atención
            </Button>
          ) : null}

          {atencion?.id ? (
            <Button asChild variant="outline" className="gap-2">
              <Link to="/atencion/$atencionId" params={{ atencionId: atencion.id }}>
                <Printer className="h-4 w-4" /> Ver / imprimir informe
              </Link>
            </Button>
          ) : null}

          {firmada ? (
            <Button variant="outline" className="gap-2" onClick={() => setAdendaAbierta(true)}>
              <FileText className="h-4 w-4" /> Agregar adenda
            </Button>
          ) : null}
        </div>
      </div>

      <AlertDialog open={confirmarFirma} onOpenChange={setConfirmarFirma}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Firmar y cerrar esta atención?</AlertDialogTitle>
            <AlertDialogDescription>
              Una vez firmada, la atención médica quedará congelada por normativa legal
              NTS 139 / Ley 29733 y no podrá modificarse salvo mediante adendas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (atencion?.id) firmar.mutate(atencion.id);
              }}
            >
              Firmar atención
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={adendaAbierta} onOpenChange={setAdendaAbierta}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar adenda</DialogTitle>
            <DialogDescription>
              La adenda se suma a la historia clínica sin alterar el registro firmado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de adenda</Label>
              <Select value={adendaTipo} onValueChange={setAdendaTipo}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_ADENDA.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="adenda-texto">Contenido</Label>
              <Textarea
                id="adenda-texto"
                rows={5}
                value={adendaTexto}
                onChange={(e) => setAdendaTexto(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdendaAbierta(false)}>
              Cancelar
            </Button>
            <Button
              disabled={adenda.isPending || adendaTexto.trim().length < 5}
              onClick={() => {
                if (!atencion?.id) return;
                adenda.mutate(
                  {
                    atencion_id: atencion.id,
                    tipo_adenda: adendaTipo,
                    contenido: adendaTexto.trim(),
                  },
                  {
                    onSuccess: () => {
                      setAdendaTexto("");
                      setAdendaAbierta(false);
                    },
                  },
                );
              }}
            >
              {adenda.isPending ? "Guardando…" : "Guardar adenda"}
            </Button>
          </DialogFooter>
        </DialogContent>

      </Dialog>
    </div>
  );
}

function CabeceraPaciente({
  paciente,
  edad,
  alergias,
  estado,
  firmadoAt,
}: {
  paciente: PacienteRow;
  edad: number | null;
  alergias: string;
  estado: string;
  firmadoAt: string | null;
}) {
  return (
    <section className="rounded-xl border border-border/60 bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-display text-lg font-semibold">{nombrePaciente(paciente)}</h2>
          <p className="text-sm text-muted-foreground">
            HC {paciente.numero_historia_clinica} · {paciente.tipo_documento}{" "}
            {paciente.documento_identidad ?? "—"} ·{" "}
            {edad !== null ? `${edad} años` : "Edad no registrada"} ·{" "}
            {paciente.sexo ?? "Sexo no registrado"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={estado === "firmada" ? "default" : "secondary"}>
            {estado === "firmada"
              ? "Firmada"
              : estado === "anulada"
                ? "Anulada"
                : "Borrador"}
          </Badge>
          {firmadoAt ? (
            <span className="text-xs text-muted-foreground">
              {new Date(firmadoAt).toLocaleString("es-PE")}
            </span>
          ) : null}
        </div>
      </div>

      {alergias ? (
        <p className="mt-3 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
          Alergias: {alergias}
        </p>
      ) : null}
    </section>
  );
}
