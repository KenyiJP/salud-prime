import { createFileRoute, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Printer } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { useAtencionImpresion } from "@/lib/ehr.queries";
import {
  FUNCIONES_BIOLOGICAS,
  REGIONES_EXAMEN,
  diagnosticosDe,
  edadEnAnios,
  etiqueta,
  etiquetaAdenda,
  seccionesDe,
  type CampoPlantilla,
} from "@/lib/ehr-schemas";
import { nombrePaciente } from "@/lib/clinica-schemas";
import { urlOrdenPublica } from "@/lib/orden-url";
import { MarcaAnulada } from "@/components/marca-anulada";
import type { PlantillaRow } from "@/lib/ehr-schemas";

export const Route = createFileRoute("/atencion/$atencionId")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): { acceso?: string } =>
    typeof search.acceso === "string" ? { acceso: search.acceso } : {},
  head: () => ({
    meta: [
      { title: "Informe de consulta — MediSuite" },
      {
        name: "description",
        content:
          "Informe A4 de la atención médica con membrete del médico, CMP/RNE y resumen clínico completo.",
      },
      { property: "og:title", content: "Informe de consulta — MediSuite" },
      {
        property: "og:description",
        content: "Imprime el informe de la consulta médica de tu paciente en formato A4.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InformeAtencionPage,
  errorComponent: ({ error }) => (
    <div role="alert" className="p-8 text-sm">
      No se pudo cargar el informe: {error.message}
    </div>
  ),
  notFoundComponent: () => <p className="p-8 text-sm">Atención no encontrada.</p>,
});

function Campo({ label, valor }: { label: string; valor?: string | null }) {
  if (!valor || !`${valor}`.trim()) return null;
  return (
    <p className="text-[11pt]">
      <span className="text-neutral-600">{label}: </span>
      <span className="whitespace-pre-wrap">{valor}</span>
    </p>
  );
}

function InformeAtencionPage() {
  const { atencionId } = Route.useParams();
  const { acceso } = Route.useSearch();
  const router = useRouter();
  const { data, isLoading, error } = useAtencionImpresion(atencionId, acceso);

  if (isLoading) {
    return <p className="p-8 text-sm text-muted-foreground">Cargando informe…</p>;
  }
  if (error || !data || "errorAcceso" in data) {
    return (
      <p role="alert" className="p-8 text-sm text-destructive">
        {(data && "errorAcceso" in data ? data.errorAcceso : null) ??
          (error as Error)?.message ??
          "No se pudo cargar el informe."}
      </p>
    );
  }

  const { atencion, paciente, medico, adendas, plantilla, token } = data;
  const urlInforme = urlOrdenPublica(`/atencion/${atencion.id}`, token);
  const dx = diagnosticosDe(atencion);
  const edad = edadEnAnios(paciente.fecha_nacimiento);
  const vitales = [
    atencion.presion_arterial_sistolica && atencion.presion_arterial_diastolica
      ? `PA ${atencion.presion_arterial_sistolica}/${atencion.presion_arterial_diastolica} mmHg`
      : null,
    atencion.frecuencia_cardiaca ? `FC ${atencion.frecuencia_cardiaca} lpm` : null,
    atencion.frecuencia_respiratoria ? `FR ${atencion.frecuencia_respiratoria} rpm` : null,
    atencion.temperatura ? `T° ${atencion.temperatura} °C` : null,
    atencion.saturacion_oxigeno ? `SatO₂ ${atencion.saturacion_oxigeno}%` : null,
    atencion.peso ? `Peso ${atencion.peso} kg` : null,
    atencion.talla ? `Talla ${atencion.talla}` : null,
    atencion.imc ? `IMC ${atencion.imc} (${atencion.estado_nutricional ?? ""})` : null,
    atencion.perimetro_abdominal ? `PAbd ${atencion.perimetro_abdominal} cm` : null,
  ].filter(Boolean);

  const funciones = FUNCIONES_BIOLOGICAS.map((f) => {
    const valor = (atencion.funciones_biologicas as Record<string, string>)?.[f.id];
    return valor ? `${f.label}: ${valor}` : null;
  }).filter(Boolean);

  const regional = REGIONES_EXAMEN.map((r) => {
    const valor = (atencion.examen_regional as Record<string, string>)?.[r.id];
    return valor ? { label: r.label, valor } : null;
  }).filter(Boolean) as { label: string; valor: string }[];

  const campos = atencion.campos_especialidad as Record<string, unknown>;

  return (
    <div className="min-h-screen bg-neutral-200 py-6 print:bg-white print:py-0">
      <style>{`
        @page { size: A4; margin: 16mm; }
        @media print {
          .no-print { display: none !important; }
          html, body { background: #fff !important; }
          .hoja { box-shadow: none !important; margin: 0 !important; width: auto !important; }
        }
      `}</style>

      <div className="no-print mx-auto mb-4 flex w-full max-w-[210mm] items-center justify-between px-4">
        <Button variant="secondary" className="gap-2" onClick={() => router.history.back()}>
          <ArrowLeft className="h-4 w-4" /> Volver
        </Button>
        <Button className="gap-2" onClick={() => window.print()}>
          <Printer className="h-4 w-4" /> Imprimir informe
        </Button>
      </div>

      <article className="hoja relative mx-auto w-[210mm] max-w-full bg-white p-[16mm] text-[12pt] leading-relaxed text-neutral-900 shadow-lg">
        {atencion.estado === "anulada" ? <MarcaAnulada tipo="Atención" /> : null}
        <header className="border-b-2 border-neutral-800 pb-3">
          <h1 className="text-[16pt] font-semibold">
            Dr(a). {medico.nombres} {medico.apellidos}
          </h1>
          <p className="text-[11pt] text-neutral-700">
            {medico.especialidad ?? "Medicina general"}
          </p>
          <p className="text-[10pt] text-neutral-600">
            {medico.cmp ? `CMP ${medico.cmp}` : null}
            {medico.cmp && medico.rne ? " · " : null}
            {medico.rne ? `RNE ${medico.rne}` : null}
          </p>
        </header>

        <h2 className="mt-6 text-center text-[14pt] font-semibold uppercase tracking-wide">
          Informe de consulta médica
        </h2>

        <section className="mt-5 grid grid-cols-2 gap-x-6 gap-y-1 text-[11pt]">
          <p>
            <span className="text-neutral-600">Paciente: </span>
            {nombrePaciente(paciente)}
          </p>
          <p>
            <span className="text-neutral-600">N° historia clínica: </span>
            {paciente.numero_historia_clinica}
          </p>
          <p>
            <span className="text-neutral-600">Documento: </span>
            {paciente.tipo_documento} {paciente.documento_identidad ?? "—"}
          </p>
          <p>
            <span className="text-neutral-600">Edad: </span>
            {edad !== null ? `${edad} años` : "—"}
          </p>
          <p>
            <span className="text-neutral-600">Sexo: </span>
            {paciente.sexo ?? "—"}
          </p>
          <p>
            <span className="text-neutral-600">Fecha y hora: </span>
            {new Date(
              `${atencion.fecha_atencion}T${atencion.hora_atencion}`,
            ).toLocaleString("es-PE", { dateStyle: "long", timeStyle: "short" })}
          </p>
          <p>
            <span className="text-neutral-600">Tipo de atención: </span>
            {etiqueta(atencion.tipo_atencion)}
          </p>
          <p>
            <span className="text-neutral-600">Estado: </span>
            {atencion.estado === "anulada"
              ? "Anulada"
              : atencion.estado === "firmada"
                ? "Firmada"
                : "Borrador"}
          </p>
        </section>

        {atencion.estado === "anulada" && atencion.motivo_anulacion ? (
          <p className="mt-4 border border-red-500 px-3 py-2 text-[11pt] text-red-700">
            <span className="font-semibold">Motivo de anulación: </span>
            {atencion.motivo_anulacion}
          </p>
        ) : null}

        {atencion.antecedentes_alergicos ? (
          <p className="mt-4 border border-red-500 px-3 py-2 text-[11pt] font-semibold text-red-700">
            Alergias: {atencion.antecedentes_alergicos}
          </p>
        ) : null}

        {vitales.length > 0 ? (
          <section className="mt-5">
            <h3 className="mb-1 text-[11pt] font-semibold uppercase tracking-wide text-neutral-700">
              Signos vitales y antropometría
            </h3>
            <p className="text-[11pt]">{vitales.join(" · ")}</p>
            {funciones.length > 0 ? (
              <p className="text-[11pt]">
                <span className="text-neutral-600">Funciones biológicas: </span>
                {funciones.join(" · ")}
              </p>
            ) : null}
          </section>
        ) : null}

        <section className="mt-5 space-y-1">
          <h3 className="mb-1 text-[11pt] font-semibold uppercase tracking-wide text-neutral-700">
            Anamnesis
          </h3>
          <Campo label="Motivo de consulta" valor={atencion.motivo_consulta} />
          <Campo label="Tiempo de enfermedad" valor={atencion.tiempo_enfermedad} />
          <Campo label="Forma de inicio" valor={etiqueta(atencion.forma_inicio)} />
          <Campo label="Curso" valor={etiqueta(atencion.curso_enfermedad)} />
          <Campo label="Relato cronológico" valor={atencion.relato_cronologico} />
          <Campo label="Antecedentes patológicos" valor={atencion.antecedentes_patologicos} />
          <Campo label="Antecedentes quirúrgicos" valor={atencion.antecedentes_quirurgicos} />
          <Campo label="Antecedentes familiares" valor={atencion.antecedentes_familiares} />
          <Campo label="Antecedentes personales" valor={atencion.antecedentes_personales} />
          <Campo label="Medicación habitual" valor={atencion.medicacion_habitual} />
        </section>

        <section className="mt-5 space-y-1">
          <h3 className="mb-1 text-[11pt] font-semibold uppercase tracking-wide text-neutral-700">
            Examen físico
          </h3>
          <Campo label="Estado general" valor={atencion.estado_general} />
          <Campo label="Examen general" valor={atencion.examen_general} />
          {regional.map((r) => (
            <Campo key={r.label} label={r.label} valor={r.valor} />
          ))}
        </section>

        {campos && Object.keys(campos).length > 0 ? (
          <section className="mt-5 space-y-1">
            <h3 className="mb-1 text-[11pt] font-semibold uppercase tracking-wide text-neutral-700">
              Evaluación por especialidad
            </h3>
            <CamposEspecialidadImpresos campos={campos} plantilla={plantilla} />
          </section>
        ) : null}

        {dx.length > 0 ? (
          <section className="mt-5">
            <h3 className="mb-1 text-[11pt] font-semibold uppercase tracking-wide text-neutral-700">
              Diagnósticos
            </h3>
            <ol className="space-y-1 text-[11pt]">
              {dx.map((d, i) => (
                <li key={d.codigo_cie10} className="flex gap-3">
                  <span className="w-6 text-neutral-600">{i + 1}.</span>
                  <span>
                    <span className="font-mono">{d.codigo_cie10}</span> {d.descripcion} [
                    {d.tipo}]{d.es_principal ? " · Principal" : ""}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        <section className="mt-5 space-y-1">
          <h3 className="mb-1 text-[11pt] font-semibold uppercase tracking-wide text-neutral-700">
            Plan, tratamiento e indicaciones
          </h3>
          <Campo label="Plan de trabajo" valor={atencion.plan_trabajo} />
          <Campo label="Tratamiento" valor={atencion.tratamiento} />
          <Campo label="Indicaciones generales" valor={atencion.indicaciones_generales} />
          <Campo label="Próximo control" valor={atencion.proximo_control} />
        </section>

        {adendas.length > 0 ? (
          <section className="mt-5 space-y-2">
            <h3 className="mb-1 text-[11pt] font-semibold uppercase tracking-wide text-neutral-700">
              Adendas
            </h3>
            {adendas.map((a) => (
              <div key={a.id} className="border-l-2 border-neutral-400 pl-3 text-[11pt]">
                <p className="text-neutral-600">
                  {etiquetaAdenda(a.tipo_adenda)} · {new Date(a.created_at).toLocaleString("es-PE")}
                </p>
                <p className="whitespace-pre-wrap">{a.contenido}</p>
              </div>
            ))}
          </section>
        ) : null}

        <footer className="mt-16 flex items-end justify-between gap-8">
          <div className="w-72 text-center">
            {atencion.firma_digital_url ? (
              <img
                src={atencion.firma_digital_url}
                alt={`Firma de ${medico.nombres} ${medico.apellidos}`}
                className="mx-auto max-h-20 object-contain"
              />
            ) : (
              <div className="h-16" />
            )}
            <div className="mt-1 border-t border-dashed border-neutral-600 pt-2">
              <p className="text-[11pt] font-semibold">
                Dr(a). {medico.nombres} {medico.apellidos}
              </p>
              <p className="text-[10pt] text-neutral-700">
                {medico.especialidad ?? "Medicina general"}
              </p>
              {medico.cmp ? <p className="text-[10pt] text-neutral-700">CMP: {medico.cmp}</p> : null}
              {medico.rne ? <p className="text-[10pt] text-neutral-700">RNE: {medico.rne}</p> : null}
            </div>
          </div>

          <div className="text-center" data-informe-url={urlInforme}>
            {urlInforme ? <QRCodeSVG value={urlInforme} size={96} /> : null}
            <p className="mt-1 max-w-[96px] text-[8pt] leading-tight text-neutral-600">
              Escanea para ver este informe
            </p>
            {atencion.firmado_at ? (
              <p className="mt-2 max-w-[110px] text-[7pt] leading-tight text-neutral-600">
                Firmada el {new Date(atencion.firmado_at).toLocaleString("es-PE")}
              </p>
            ) : null}
            {atencion.firma_hash ? (
              <p className="mt-1 max-w-[110px] break-all text-[6pt] text-neutral-500">
                {atencion.firma_hash.slice(0, 24)}…
              </p>
            ) : null}
            </div>
        </footer>
      </article>
    </div>
  );
}

/** Muestra las respuestas de la plantilla usando sus etiquetas cuando existen. */
function CamposEspecialidadImpresos({
  campos,
  plantilla,
}: {
  campos: Record<string, unknown>;
  plantilla: PlantillaRow | null;
}) {
  const etiquetas = new Map<string, CampoPlantilla>();
  for (const seccion of seccionesDe(plantilla)) {
    for (const campo of seccion.campos) etiquetas.set(campo.id, campo);
  }

  return (
    <>
      {Object.entries(campos).map(([id, valor]) => {
        const texto = Array.isArray(valor) ? valor.join(", ") : `${valor ?? ""}`;
        if (!texto.trim()) return null;
        const campo = etiquetas.get(id);
        return (
          <Campo
            key={id}
            label={campo?.label ?? id}
            valor={campo?.unit ? `${texto} ${campo.unit}` : texto}
          />
        );
      })}
    </>
  );
}

