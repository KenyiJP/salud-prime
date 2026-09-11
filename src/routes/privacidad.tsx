import { createFileRoute, Link } from "@tanstack/react-router";
import { Stethoscope } from "lucide-react";

export const Route = createFileRoute("/privacidad")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Política de Privacidad — MediSuite" },
      {
        name: "description",
        content:
          "Política de privacidad de MediSuite: tratamiento de datos personales y de salud conforme a la Ley N.° 29733 (Perú) y uso de la API de Google Calendar.",
      },
    ],
  }),
  component: PoliticaPrivacidadPage,
});

function PoliticaPrivacidadPage() {
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
              Política de Privacidad
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Última actualización: 11 de setiembre de 2026
            </p>
          </div>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">1. Responsable del tratamiento</h2>
            <p>
              MediSuite es una plataforma de gestión clínica para consultorios y médicos
              independientes en Perú. El responsable del tratamiento de los datos personales
              recogidos a través de esta aplicación es el titular del consultorio o clínica
              que contrata el servicio (en adelante, el &quot;Médico&quot; o el &quot;Cliente&quot;),
              quien actúa frente al paciente como responsable de sus propios datos de salud,
              conforme a la Ley N.° 29733, Ley de Protección de Datos Personales, y su
              Reglamento (D.S. N.° 003-2013-JUS).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">2. Datos que recopilamos</h2>
            <p>Según el módulo que use el Médico, MediSuite puede tratar:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Datos de identificación y contacto del Médico y su personal autorizado.</li>
              <li>
                Datos de identificación y contacto de pacientes, e historias clínicas,
                órdenes de laboratorio/imagenología y recetas asociadas a su atención médica.
              </li>
              <li>
                Datos de agenda: fecha, hora, duración y motivo general de las citas médicas
                registradas en el sistema.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">
              3. Uso de la API de Google Calendar
            </h2>
            <p>
              MediSuite ofrece a cada Médico, de forma opcional e individual, la posibilidad
              de conectar su propia cuenta de Google mediante OAuth 2.0 para sincronizar sus
              citas médicas con su Google Calendar personal o profesional. Sobre este punto:
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                La conexión es exclusivamente por médico: cada profesional autoriza su propia
                cuenta y sus credenciales nunca se comparten con otros médicos ni tenants de la
                plataforma.
              </li>
              <li>
                MediSuite únicamente crea, actualiza o elimina eventos en el calendario del
                Médico correspondientes a sus propias citas agendadas dentro de la plataforma
                (sincronización unidireccional MediSuite → Google Calendar).
              </li>
              <li>
                Los eventos creados en Google Calendar contienen únicamente datos
                administrativos de la cita (fecha, hora, nombre del paciente y motivo general
                de consulta cuando el Médico lo habilita). MediSuite no escribe diagnósticos,
                notas clínicas, resultados de laboratorio ni ninguna información clínica
                protegida en los eventos de Google Calendar.
              </li>
              <li>
                Las credenciales de acceso (tokens OAuth) se almacenan cifradas en un
                almacén de secretos aislado (Supabase Vault) y nunca son accesibles desde el
                API pública de la aplicación ni por otros usuarios, incluidos otros médicos.
              </li>
              <li>
                El Médico puede revocar el acceso de MediSuite a su Google Calendar en
                cualquier momento desde los ajustes de su cuenta de Google
                (myaccount.google.com/permissions) o desde el panel de MediSuite.
              </li>
              <li>
                El uso de los datos obtenidos a través de las APIs de Google por parte de
                MediSuite se ajusta a la{" "}
                <a
                  href="https://developers.google.com/terms/api-services-user-data-policy"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Política de Datos de Usuario de los Servicios de API de Google
                </a>
                , incluidos los requisitos de Uso Limitado.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">4. Finalidad del tratamiento</h2>
            <p>
              Los datos se utilizan exclusivamente para prestar el servicio de gestión
              clínica y agenda contratado por el Médico: registro de historias clínicas,
              generación de órdenes y recetas, y sincronización de citas con calendarios
              externos cuando el Médico lo autoriza expresamente.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">5. Derechos del titular</h2>
            <p>
              Conforme a la Ley N.° 29733, los titulares de datos personales pueden ejercer
              sus derechos de acceso, rectificación, cancelación y oposición (derechos ARCO)
              dirigiéndose al Médico responsable de su atención, o escribiendo a{" "}
              <a
                href="mailto:kenyimercadogarcia@gmail.com"
                className="text-primary underline-offset-4 hover:underline"
              >
                kenyimercadogarcia@gmail.com
              </a>
              .
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">6. Contacto</h2>
            <p>
              Ante cualquier consulta sobre esta Política de Privacidad, puede escribir a{" "}
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
