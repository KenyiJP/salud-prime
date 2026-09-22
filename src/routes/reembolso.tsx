import { createFileRoute, Link } from "@tanstack/react-router";
import { Stethoscope } from "lucide-react";

export const Route = createFileRoute("/reembolso")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Política de Cancelación y Reembolsos — MediSuite" },
      {
        name: "description",
        content:
          "Política de cancelación de suscripción y reembolsos de MediSuite, plataforma de gestión clínica para médicos independientes en Perú.",
      },
    ],
  }),
  component: PoliticaReembolsoPage,
});

function PoliticaReembolsoPage() {
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
              Política de Cancelación y Reembolsos
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Última actualización: 22 de setiembre de 2026
            </p>
          </div>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">1. Alcance</h2>
            <p>
              Esta política aplica exclusivamente a la relación contractual entre MediSuite y
              el Médico o clínica que contrata la suscripción al software (en adelante, el
              &quot;Plan&quot;). No regula los pagos que un paciente realiza directamente a un
              Médico por una consulta o servicio médico a través de la pasarela de pago propia
              de ese Médico (modalidad &quot;BYOK&quot;) — esos reembolsos son responsabilidad
              exclusiva del Médico, conforme a lo indicado en la sección 4.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">
              2. Cancelación de la suscripción
            </h2>
            <p>
              El Médico puede cancelar su Plan en cualquier momento desde el panel de
              Facturación de MediSuite, sin necesidad de justificar el motivo ni de contactar
              con soporte. La cancelación:
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                Detiene la renovación automática del siguiente periodo de facturación
                (mensual o anual, según el Plan contratado).
              </li>
              <li>
                No interrumpe el acceso a la plataforma durante el periodo ya pagado y
                vigente: el Médico conserva el uso completo del Plan hasta la fecha de
                vencimiento de dicho periodo.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">
              3. Devolución de dinero
            </h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <strong className="text-foreground">Primeros 7 días naturales</strong> desde el
                primer cargo de un Plan nuevo: el Médico puede solicitar la devolución íntegra
                del monto pagado, escribiendo a{" "}
                <a
                  href="mailto:kenyimercadogarcia@gmail.com"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  kenyimercadogarcia@gmail.com
                </a>
                , siempre que no se trate de una renovación de un periodo anterior.
              </li>
              <li>
                <strong className="text-foreground">Después de los 7 días naturales</strong>{" "}
                iniciales, o en renovaciones posteriores: no se realizan devoluciones
                proporcionales por el tiempo no utilizado del periodo ya facturado. El Médico
                puede cancelar para evitar el siguiente cobro, pero el periodo vigente ya
                facturado no es reembolsable.
              </li>
              <li>
                Los cambios de Plan (upgrade o downgrade) durante un periodo vigente se
                ajustan de forma prorrateada en el siguiente ciclo de facturación, no mediante
                devolución de dinero.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">
              4. Pagos de pacientes a médicos (modalidad BYOK)
            </h2>
            <p>
              Cuando un paciente paga una consulta u otro servicio médico directamente al
              Médico a través de la pasarela de pago que el propio Médico conecta a su cuenta
              (Culqi u otro proveedor, bajo llaves propias del Médico), MediSuite actúa
              únicamente como intermediario tecnológico y no es parte de esa relación de
              consumo. Cualquier reclamo, cancelación o reembolso relacionado con ese pago debe
              dirigirse directamente al Médico, quien es el proveedor real del servicio frente
              al paciente y el responsable de atenderlo conforme a la normativa de protección
              al consumidor (Ley N.° 29571).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">5. Medio de devolución</h2>
            <p>
              Cuando proceda una devolución conforme a la sección 3, esta se realiza por el
              mismo medio de pago utilizado en el cargo original, en un plazo de hasta 10 días
              hábiles desde la confirmación de la solicitud.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">6. Contacto</h2>
            <p>
              Para solicitar una cancelación o reembolso, o ante cualquier consulta sobre esta
              política, puede escribir a{" "}
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
