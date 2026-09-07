import { createFileRoute, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Printer } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { urlOrdenPublica } from "@/lib/orden-url";
import { MarcaAnulada } from "@/components/marca-anulada";
import { useOrdenParaImprimir } from "@/lib/laboratorio.queries";
import { edadDesde, fechaLarga } from "@/lib/laboratorio-schemas";
import { nombrePaciente } from "@/lib/clinica-schemas";

export const Route = createFileRoute("/orden-laboratorio/$ordenId")({
  // Sin guard de sesión: con un token firmado en la URL (?acceso=) el
  // laboratorio abre la orden desde el QR sin tener cuenta. Sin token, la
  // lectura exige sesión del médico dueño de la orden.
  ssr: false,
  validateSearch: (search: Record<string, unknown>): { acceso?: string } =>
    typeof search.acceso === "string" ? { acceso: search.acceso } : {},
  head: () => ({
    meta: [
      { title: "Orden de laboratorio — MediSuite" },
      {
        name: "description",
        content:
          "Vista de impresión en A4 de la orden de laboratorio con datos del médico y del paciente.",
      },
      { property: "og:title", content: "Orden de laboratorio — MediSuite" },
      {
        property: "og:description",
        content: "Imprime la orden de laboratorio de tu paciente en formato A4.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ImprimirOrdenPage,
  errorComponent: ({ error }) => (
    <div role="alert" className="p-8 text-sm">
      No se pudo cargar la orden: {error.message}
    </div>
  ),
  notFoundComponent: () => <p className="p-8 text-sm">Orden no encontrada.</p>,
});

function ImprimirOrdenPage() {
  const { ordenId } = Route.useParams();
  const router = useRouter();
  const { acceso } = Route.useSearch();
  const { data, isLoading, error } = useOrdenParaImprimir(ordenId, acceso);

  if (isLoading) {
    return <p className="p-8 text-sm text-muted-foreground">Cargando orden…</p>;
  }
  if (error || !data || "errorAcceso" in data) {
    return (
      <p role="alert" className="p-8 text-sm text-destructive">
        {(data && "errorAcceso" in data ? data.errorAcceso : null) ??
          (error as Error)?.message ??
          "No se pudo cargar la orden."}
      </p>
    );
  }

  const { orden, paciente, medico, token } = data;
  const urlOrden = urlOrdenPublica(`/orden-laboratorio/${orden.id}`, token);

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
          <Printer className="h-4 w-4" /> Imprimir orden
        </Button>
      </div>

      <article className="hoja relative mx-auto w-[210mm] max-w-full bg-white p-[16mm] text-[12pt] leading-relaxed text-neutral-900 shadow-lg">
        {orden.estado === "anulada" ? <MarcaAnulada /> : null}
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
          Orden de laboratorio
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
            <span className="text-neutral-600">Fecha de la orden: </span>
            {fechaLarga(orden.fecha_orden)}
          </p>
        </section>

        {orden.diagnostico_presuntivo ? (
          <p className="mt-4 text-[11pt]">
            <span className="text-neutral-600">Diagnóstico presuntivo: </span>
            {orden.diagnostico_presuntivo}
          </p>
        ) : null}

        <section className="mt-6">
          <h3 className="mb-2 text-[11pt] font-semibold uppercase tracking-wide text-neutral-700">
            Exámenes solicitados
          </h3>
          <ol className="space-y-1.5">
            {orden.examenes.map((e) => (
              <li key={e.examen_id} className="flex gap-3 border-b border-dotted border-neutral-300 pb-1">
                <span className="w-6 text-neutral-600">{e.orden}.</span>
                <span>{e.nombre_display}</span>
              </li>
            ))}
          </ol>
        </section>

        {orden.observaciones ? (
          <p className="mt-5 text-[11pt]">
            <span className="text-neutral-600">Observaciones: </span>
            {orden.observaciones}
          </p>
        ) : null}

        <footer className="mt-20 flex items-end justify-between gap-8">
          <div className="w-72 text-center">
            <div className="h-16 border-b border-dashed border-neutral-500" />
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

          <div className="text-center" data-orden-url={urlOrden}>
            {urlOrden ? <QRCodeSVG value={urlOrden} size={96} /> : null}
            <p className="mt-1 max-w-[96px] text-[8pt] leading-tight text-neutral-600">
              Escanea para ver esta orden
            </p>
          </div>
        </footer>
      </article>
    </div>
  );
}
