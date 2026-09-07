import { createFileRoute } from "@tanstack/react-router";
import { Printer } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { useOrdenImagenImpresion } from "@/lib/imagenologia.queries";
import { edadDesde, fechaLarga } from "@/lib/laboratorio-schemas";
import { etiquetaModalidad } from "@/lib/imagenologia-schemas";
import { nombrePaciente } from "@/lib/clinica-schemas";
import { urlOrdenPublica } from "@/lib/orden-url";

export const Route = createFileRoute("/orden-imagen/$ordenId")({
  // Sin `requireSession`: con un token firmado en la URL (?acceso=) el servicio
  // de imágenes abre la orden desde el QR sin tener cuenta. Sin token, la
  // lectura exige sesión del médico dueño de la orden.
  ssr: false,
  validateSearch: (search: Record<string, unknown>): { acceso?: string } =>
    typeof search.acceso === "string" ? { acceso: search.acceso } : {},
  head: () => ({
    meta: [
      { title: "Orden de imágenes — MediSuite" },
      {
        name: "description",
        content:
          "Vista de impresión A4 de la orden de imagenología con indicación clínica, preparación, firma y código QR.",
      },
      { property: "og:title", content: "Orden de imágenes — MediSuite" },
      {
        property: "og:description",
        content: "Imprime la orden de imágenes de tu paciente en formato A4 con QR.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ImprimirOrdenImagenPage,
  errorComponent: ({ error }) => (
    <div role="alert" className="p-8 text-sm">
      No se pudo cargar la orden: {error.message}
    </div>
  ),
  notFoundComponent: () => <p className="p-8 text-sm">Orden no encontrada.</p>,
});

function ImprimirOrdenImagenPage() {
  const { ordenId } = Route.useParams();
  const { acceso } = Route.useSearch();
  const { data, isLoading, error } = useOrdenImagenImpresion(ordenId, acceso);

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

  const urlOrden = urlOrdenPublica(`/orden-imagen/${orden.id}`, token);
  const conPreparacion = orden.estudios.filter(
    (e) => e.requiere_preparacion && e.instrucciones_preparacion,
  );

  return (
    <div className="min-h-screen bg-neutral-200 py-6 print:bg-white print:py-0">
      <style>{`
        @page { size: A4; margin: 14mm; }
        @media print {
          .no-print { display: none !important; }
          html, body { background: #fff !important; }
          .hoja { box-shadow: none !important; margin: 0 !important; width: auto !important; }
        }
      `}</style>

      <div className="no-print mx-auto mb-4 flex w-full max-w-[210mm] items-center justify-end px-4">
        <Button className="gap-2" onClick={() => window.print()}>
          <Printer className="h-4 w-4" /> Imprimir orden
        </Button>
      </div>

      <article className="hoja mx-auto w-[210mm] max-w-full bg-white p-[14mm] text-[12pt] leading-relaxed text-neutral-900 shadow-lg">
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
            {medico.email ? ` · ${medico.email}` : null}
          </p>
        </header>

        <h2 className="mt-5 text-center text-[14pt] font-semibold uppercase tracking-wide">
          Orden de estudios de imágenes
        </h2>

        <section className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1 text-[11pt]">
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

        <section className="mt-4 rounded border border-neutral-300 p-3 text-[11pt]">
          <p>
            <span className="font-semibold">Pregunta al radiólogo: </span>
            {orden.indicacion_clinica}
          </p>
          {orden.diagnostico_presuntivo ? (
            <p className="mt-1">
              <span className="text-neutral-600">Diagnóstico presuntivo: </span>
              {orden.diagnostico_presuntivo}
            </p>
          ) : null}
        </section>

        <section className="mt-5">
          <h3 className="mb-2 text-[11pt] font-semibold uppercase tracking-wide text-neutral-700">
            Estudios solicitados
          </h3>
          <ol className="space-y-2">
            {orden.estudios.map((e) => (
              <li
                key={e.estudio_id}
                className="flex gap-3 border-b border-dotted border-neutral-300 pb-1.5"
              >
                <span className="w-6 text-neutral-600">{e.orden}.</span>
                <span className="min-w-0">
                  <span>{e.nombre_display}</span>
                  <span className="ml-2 text-[9.5pt] text-neutral-600">
                    ({etiquetaModalidad(e.modalidad)}
                    {e.region ? ` · ${e.region}` : ""})
                  </span>
                  {e.requiere_contraste ? (
                    <span className="ml-2 rounded border border-neutral-400 px-1 text-[9pt] uppercase">
                      Con contraste
                    </span>
                  ) : null}
                  {e.requiere_preparacion ? (
                    <span className="ml-2 rounded border border-neutral-400 px-1 text-[9pt] uppercase">
                      Requiere preparación
                    </span>
                  ) : null}
                  {e.nota ? (
                    <span className="block text-[10pt] text-neutral-700">
                      Nota: {e.nota}
                    </span>
                  ) : null}
                </span>
              </li>
            ))}
          </ol>
        </section>

        {conPreparacion.length > 0 ? (
          <section className="mt-5 rounded border-2 border-amber-500 bg-amber-50 p-3">
            <h3 className="text-[11pt] font-bold uppercase tracking-wide text-amber-800">
              Instrucciones para el paciente
            </h3>
            <ul className="mt-1 space-y-1 text-[10.5pt] text-neutral-800">
              {conPreparacion.map((e) => (
                <li key={e.estudio_id}>
                  <span className="font-semibold">{e.nombre_display}: </span>
                  {e.instrucciones_preparacion}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {orden.observaciones ? (
          <p className="mt-4 text-[11pt]">
            <span className="text-neutral-600">Observaciones: </span>
            {orden.observaciones}
          </p>
        ) : null}

        <footer className="mt-16 flex items-end justify-between gap-8">
          <div className="w-72">
            {medico.firma_url ? (
              <img
                src={medico.firma_url}
                alt={`Firma y sello de Dr(a). ${medico.nombres} ${medico.apellidos}`}
                className="mx-auto max-h-28 object-contain"
              />
            ) : (
              <div className="h-20 border-b border-dashed border-neutral-600" />
            )}
            <div className="mt-1 border-t border-neutral-800 pt-1">
              <p className="text-[11pt] font-semibold">
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
