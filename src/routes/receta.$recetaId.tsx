import { createFileRoute, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Printer } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { urlOrdenPublica } from "@/lib/orden-url";
import { MarcaAnulada } from "@/components/marca-anulada";
import { useRecetaParaImprimir } from "@/lib/recetas.queries";
import { fechaLargaReceta, fechaVencimiento } from "@/lib/recetas-schemas";
import { edadDesde } from "@/lib/laboratorio-schemas";
import { nombrePaciente } from "@/lib/clinica-schemas";

export const Route = createFileRoute("/receta/$recetaId")({
  // Sin guard de sesión: con un token firmado en la URL (?acceso=) la farmacia
  // o el paciente abren la receta desde el QR sin tener cuenta. Sin token, la
  // lectura exige sesión del médico dueño de la receta.
  ssr: false,
  validateSearch: (search: Record<string, unknown>): { acceso?: string } =>
    typeof search.acceso === "string" ? { acceso: search.acceso } : {},
  head: () => ({
    meta: [
      { title: "Receta médica — MediSuite" },
      {
        name: "description",
        content:
          "Vista de impresión en A4 de la receta médica con membrete, CMP/RNE, DCI y QR de verificación.",
      },
      { property: "og:title", content: "Receta médica — MediSuite" },
      {
        property: "og:description",
        content: "Imprime la receta médica de tu paciente en formato A4.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ImprimirRecetaPage,
  errorComponent: ({ error }) => (
    <div role="alert" className="p-8 text-sm">
      No se pudo cargar la receta: {error.message}
    </div>
  ),
  notFoundComponent: () => <p className="p-8 text-sm">Receta no encontrada.</p>,
});

function ImprimirRecetaPage() {
  const { recetaId } = Route.useParams();
  const router = useRouter();
  const { acceso } = Route.useSearch();
  const { data, isLoading, error } = useRecetaParaImprimir(recetaId, acceso);

  if (isLoading) {
    return <p className="p-8 text-sm text-muted-foreground">Cargando receta…</p>;
  }
  if (error || !data || "errorAcceso" in data) {
    return (
      <p role="alert" className="p-8 text-sm text-destructive">
        {(data && "errorAcceso" in data ? data.errorAcceso : null) ??
          (error as Error)?.message ??
          "No se pudo cargar la receta."}
      </p>
    );
  }

  const { receta, paciente, medico, token } = data;
  const urlReceta = urlOrdenPublica(`/receta/${receta.id}`, token);
  const vence = fechaVencimiento(receta.fecha_emision, receta.vigencia_dias);

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
          <Printer className="h-4 w-4" /> Imprimir receta
        </Button>
      </div>

      <article className="hoja relative mx-auto w-[210mm] max-w-full bg-white p-[16mm] text-[12pt] leading-relaxed text-neutral-900 shadow-lg">
        {receta.estado === "anulada" ? <MarcaAnulada tipo="Receta" /> : null}
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
          Receta médica
        </h2>

        <section className="mt-5 grid grid-cols-2 gap-x-6 gap-y-1 text-[11pt]">
          <p>
            <span className="text-neutral-600">Paciente: </span>
            {nombrePaciente(paciente)}
          </p>
          <p>
            <span className="text-neutral-600">Documento: </span>
            {paciente.documento_identidad ?? "—"}
          </p>
          <p>
            <span className="text-neutral-600">Fecha de nacimiento: </span>
            {paciente.fecha_nacimiento ?? "—"}
          </p>
          <p>
            <span className="text-neutral-600">Edad: </span>
            {edadDesde(paciente.fecha_nacimiento)}
          </p>
          <p>
            <span className="text-neutral-600">Fecha de emisión: </span>
            {fechaLargaReceta(receta.fecha_emision)}
          </p>
          <p>
            <span className="text-neutral-600">Vigencia hasta: </span>
            {fechaLargaReceta(vence.toISOString())}
          </p>
        </section>

        {receta.diagnostico_presuntivo ? (
          <p className="mt-4 text-[11pt]">
            <span className="text-neutral-600">Diagnóstico presuntivo: </span>
            {receta.diagnostico_presuntivo}
          </p>
        ) : null}

        <section className="mt-6">
          <h3 className="mb-2 text-[11pt] font-semibold uppercase tracking-wide text-neutral-700">
            Rp/
          </h3>
          <ol className="space-y-3">
            {receta.medicamentos.map((m) => (
              <li key={m.id} className="border-b border-dotted border-neutral-300 pb-2">
                <div className="flex gap-3">
                  <span className="w-6 text-neutral-600">{m.orden}.</span>
                  <div>
                    <p className="font-medium">{m.nombre_display}</p>
                    <p className="text-[10pt] text-neutral-700">
                      {[m.dosis, m.via_administracion, m.frecuencia, m.duracion, m.cantidad]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    {m.indicaciones ? (
                      <p className="text-[10pt] text-neutral-600">{m.indicaciones}</p>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {receta.observaciones ? (
          <p className="mt-5 text-[11pt]">
            <span className="text-neutral-600">Observaciones: </span>
            {receta.observaciones}
          </p>
        ) : null}

        <footer className="mt-20 flex items-end justify-between gap-8">
          <div className="w-72 text-center">
            {medico.firma_url ? (
              <img
                src={medico.firma_url}
                alt={`Firma de ${medico.nombres} ${medico.apellidos}`}
                className="mx-auto max-h-20 object-contain"
              />
            ) : (
              <div className="h-16 border-b border-dashed border-neutral-500" />
            )}
            <p className="mt-2 text-[11pt] font-semibold">
              Dr(a). {medico.nombres} {medico.apellidos}
            </p>
            <p className="text-[10pt] text-neutral-700">
              {medico.especialidad ?? "Medicina general"}
            </p>
            {medico.cmp ? (
              <p className="text-[10pt] text-neutral-700">CMP: {medico.cmp}</p>
            ) : null}
            {medico.rne ? (
              <p className="text-[10pt] text-neutral-700">RNE: {medico.rne}</p>
            ) : null}
          </div>

          <div className="text-center" data-receta-url={urlReceta}>
            {urlReceta ? <QRCodeSVG value={urlReceta} size={96} /> : null}
            <p className="mt-1 max-w-[96px] text-[8pt] leading-tight text-neutral-600">
              Escanea para verificar esta receta
            </p>
          </div>
        </footer>
      </article>
    </div>
  );
}
