import { createFileRoute, Link } from "@tanstack/react-router";
import { Stethoscope } from "lucide-react";

export const Route = createFileRoute("/terminos")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Términos y Condiciones — MediSuite" },
      {
        name: "description",
        content:
          "Términos y condiciones de uso de MediSuite, plataforma de gestión clínica para médicos independientes en Perú.",
      },
    ],
  }),
  component: TerminosPage,
});

function TerminosPage() {
  return (
    <div className="dark min-h-screen w-full bg-background px-4 py-12 text-foreground">
      <div className="mx-auto w-full max-w-2xl space-y-8">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/30">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display text-base font-semibold">MediSuite</p>
            <p className="text-xs text-muted-foreground">Salud Digital · Perú</p>
          </div>
        </div>

        <div className="space-y-6 rounded-xl border border-border/60 bg-card p-6 text-sm leading-relaxed text-muted-foreground">
          <div>
            <h1 className="font-display text-2xl font-semibold text-foreground">
              Términos y Condiciones de Uso
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Última actualización: 11 de setiembre de 2026
            </p>
          </div>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">1. Objeto</h2>
            <p>
              Estos Términos y Condiciones regulan el acceso y uso de MediSuite, una
              plataforma de software como servicio (SaaS) para la gestión de consultorios
              médicos, historias clínicas, agenda de citas, órdenes de laboratorio e
              imagenología, recetas y facturación, dirigida a médicos y clínicas
              independientes en Perú.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">2. Cuentas y aislamiento por médico</h2>
            <p>
              Cada Médico registrado opera dentro de su propio espacio de datos aislado
              (multi-tenant). Ningún dato clínico, de agenda o de integración con terceros
              (incluida la conexión con Google Calendar) es visible ni accesible para otros
              médicos o clínicas registrados en la plataforma.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">
              3. Integraciones de terceros (Google Calendar)
            </h2>
            <p>
              El Médico puede, de forma voluntaria, autorizar a MediSuite a acceder a su
              cuenta de Google Calendar mediante el protocolo estándar OAuth 2.0, con el
              único fin de sincronizar las citas registradas en MediSuite hacia su
              calendario personal. El Médico puede revocar esta autorización en cualquier
              momento sin que ello afecte el resto de funcionalidades de la plataforma.
              El uso de esta integración se rige además por la{" "}
              <Link to="/privacidad" className="text-primary underline-offset-4 hover:underline">
                Política de Privacidad
              </Link>{" "}
              de MediSuite.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">4. Responsabilidad del Médico</h2>
            <p>
              El Médico es responsable del uso adecuado de la plataforma, de la veracidad
              de la información clínica que registra y del cumplimiento de la normativa
              peruana aplicable al ejercicio de la medicina y a la protección de datos
              personales de sus pacientes (Ley N.° 29733).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">5. Disponibilidad del servicio</h2>
            <p>
              MediSuite se ofrece &quot;tal cual&quot; y &quot;según disponibilidad&quot;. Se realizan
              esfuerzos razonables para mantener la continuidad del servicio, sin garantizar
              disponibilidad ininterrumpida.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">6. Modificaciones</h2>
            <p>
              Estos Términos pueden actualizarse periódicamente. Los cambios sustanciales
              serán comunicados a los médicos registrados por los medios de contacto
              habituales de la plataforma.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">7. Contacto</h2>
            <p>
              Para consultas sobre estos Términos, puede escribir a{" "}
              <a
                href="mailto:kenyimercadogarcia@gmail.com"
                className="text-primary underline-offset-4 hover:underline"
              >
                kenyimercadogarcia@gmail.com
              </a>
              .
            </p>
          </section>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          <Link to="/" className="text-primary underline-offset-4 hover:underline">
            Volver al inicio
          </Link>
        </p>
      </div>
    </div>
  );
}
