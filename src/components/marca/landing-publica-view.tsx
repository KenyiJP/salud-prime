import { CalendarCheck, FileWarning, GraduationCap, MapPin, MessageCircle, Star } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ReservaPublicaDialog } from "@/components/marca/reserva-publica-dialog";
import {
  construirUrlGoogleMaps,
  construirUrlWhatsapp,
  FUENTE_CSS,
  TIPOGRAFIAS_PERMITIDAS,
  type LandingMedicaPublica,
  type Tipografia,
} from "@/lib/landing-marca-schemas";

const FAQS_FIJAS = [
  {
    pregunta: "¿Cómo agendo una consulta?",
    respuesta:
      "Escríbenos por WhatsApp o usa el botón de reserva de esta página: coordinamos el horario disponible más cercano contigo.",
  },
  {
    pregunta: "¿Qué debo llevar a mi primera consulta?",
    respuesta:
      "Tu documento de identidad, resultados de exámenes previos si los tienes, y la lista de medicamentos que estés tomando actualmente.",
  },
  {
    pregunta: "¿Atienden por seguro o solo consulta particular?",
    respuesta:
      "Consulta directamente por WhatsApp las modalidades de pago y cobertura vigentes antes de agendar tu cita.",
  },
  {
    pregunta: "¿Puedo cancelar o reprogramar mi cita?",
    respuesta:
      "Sí, avísanos con anticipación por WhatsApp y coordinamos un nuevo horario sin costo adicional.",
  },
];

function esTipografiaValida(valor: string | null): valor is Tipografia {
  return valor != null && (TIPOGRAFIAS_PERMITIDAS as readonly string[]).includes(valor);
}

/**
 * Vista pública y modular de la landing médica (Día 17). Recibe exactamente
 * lo que devuelve `getLandingMedicaPublicaServerFn` (vistas `landing_publica`
 * / `landing_servicios_publica` / `landing_testimonios_publica`, ya filtradas
 * por `publicado/activo/aprobado`) y solo se encarga de la presentación:
 * ningún componente hijo vuelve a decidir qué es visible.
 */
export function LandingPublicaView({ data }: { data: LandingMedicaPublica }) {
  const { config, servicios, testimonios } = data;
  const nombreCompleto = [config.nombres, config.apellidos].filter(Boolean).join(" ").trim();
  const nombreMedico = nombreCompleto || "el médico";
  const tipografia: Tipografia = esTipografiaValida(config.tipografia)
    ? config.tipografia
    : "inter";
  const colorPrimario = config.color_primario ?? "#0f766e";
  const colorSecundario = config.color_secundario ?? "#0891b2";
  const colorFondo = config.color_fondo ?? "#ffffff";

  const urlWhatsapp = config.whatsapp_numero
    ? construirUrlWhatsapp(config.whatsapp_numero, nombreMedico)
    : null;
  const mostrarWhatsapp = Boolean(config.mostrar_boton_whatsapp) && Boolean(urlWhatsapp);
  const mostrarReserva = Boolean(config.mostrar_boton_reserva);
  const credenciales = [
    config.cmp ? `CMP ${config.cmp}` : null,
    config.rne ? `RNE ${config.rne}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: colorFondo, fontFamily: FUENTE_CSS[tipografia] }}
    >
      {/* Header */}
      <header
        className="flex items-center justify-between gap-4 px-6 py-4 text-white"
        style={{ backgroundColor: colorPrimario }}
      >
        <div className="flex items-center gap-3 min-w-0">
          {config.logo_url ? (
            <img
              src={config.logo_url}
              alt={`Logo de ${nombreMedico}`}
              className="h-11 w-11 shrink-0 rounded-full border-2 border-white/70 object-cover"
            />
          ) : null}
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold">Dr(a). {nombreMedico}</p>
            {config.especialidad ? (
              <p className="truncate text-sm text-white/85">{config.especialidad}</p>
            ) : null}
          </div>
        </div>
        {mostrarWhatsapp && urlWhatsapp ? (
          <a
            href={urlWhatsapp}
            target="_blank"
            rel="noreferrer"
            className="hidden shrink-0 items-center gap-2 rounded-md bg-white/15 px-4 py-2 text-sm font-medium hover:bg-white/25 sm:flex"
          >
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </a>
        ) : null}
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        {/* Hero */}
        <section className="flex flex-col items-center gap-4 text-center">
          {config.foto_medico_url ? (
            <img
              src={config.foto_medico_url}
              alt={`Foto de Dr(a). ${nombreMedico}`}
              className="h-32 w-32 rounded-full object-cover ring-4"
              style={{ ["--tw-ring-color" as string]: colorSecundario }}
            />
          ) : null}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Dr(a). {nombreMedico}</h1>
            {config.especialidad ? (
              <p className="mt-1 text-base text-gray-600">{config.especialidad}</p>
            ) : null}
            {credenciales ? <p className="mt-1 text-sm text-gray-500">{credenciales}</p> : null}
          </div>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            {mostrarReserva ? (
              <ReservaPublicaDialog
                slug={config.slug ?? ""}
                nombreMedico={nombreMedico}
                colorPrimario={colorPrimario}
                trigger={
                  <Button
                    style={{ backgroundColor: colorPrimario }}
                    className="gap-2 text-white hover:opacity-90"
                  >
                    <CalendarCheck className="h-4 w-4" /> Reservar cita
                  </Button>
                }
              />
            ) : null}
            {mostrarWhatsapp && urlWhatsapp ? (
              <Button
                asChild
                variant="outline"
                className="gap-2 border-green-500/50 text-green-700"
              >
                <a href={urlWhatsapp} target="_blank" rel="noreferrer">
                  <MessageCircle className="h-4 w-4" /> Escribir por WhatsApp
                </a>
              </Button>
            ) : null}
          </div>
        </section>

        {/* Sobre mí / biografía */}
        {config.biografia || config.formacion_academica ? (
          <section className="mt-12">
            <h2
              className="mb-3 text-sm font-semibold uppercase tracking-wide"
              style={{ color: colorSecundario }}
            >
              Sobre mí
            </h2>
            {config.biografia ? (
              <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700">
                {config.biografia}
              </p>
            ) : null}
            {config.formacion_academica ? (
              <div className="mt-4 flex items-start gap-2 text-sm text-gray-600">
                <GraduationCap
                  className="mt-0.5 h-4 w-4 shrink-0"
                  style={{ color: colorSecundario }}
                />
                <p className="whitespace-pre-line">{config.formacion_academica}</p>
              </div>
            ) : null}
          </section>
        ) : null}

        {/* Video de presentación */}
        {config.video_url ? (
          <section className="mt-12">
            <div className="aspect-video w-full overflow-hidden rounded-lg border border-gray-200">
              <iframe
                src={config.video_url}
                title="Video de presentación"
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </section>
        ) : null}

        {/* Galería */}
        {config.galeria_fotos_urls && config.galeria_fotos_urls.length > 0 ? (
          <section className="mt-12">
            <h2
              className="mb-3 text-sm font-semibold uppercase tracking-wide"
              style={{ color: colorSecundario }}
            >
              Galería
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {config.galeria_fotos_urls.map((url) => (
                <img
                  key={url}
                  src={url}
                  alt="Foto del consultorio"
                  className="aspect-square w-full rounded-lg object-cover"
                />
              ))}
            </div>
          </section>
        ) : null}

        {/* Servicios */}
        {servicios.length > 0 ? (
          <section className="mt-12">
            <h2
              className="mb-4 text-sm font-semibold uppercase tracking-wide"
              style={{ color: colorSecundario }}
            >
              Servicios
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {servicios.map((s, i) => (
                <Card key={`${s.nombre ?? "servicio"}-${i}`} className="border-gray-200">
                  <CardContent className="p-4">
                    <p className="font-medium text-gray-900">{s.nombre}</p>
                    {s.descripcion ? (
                      <p className="mt-1 text-sm text-gray-600">{s.descripcion}</p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                      {s.precio != null ? <span>S/ {Number(s.precio).toFixed(2)}</span> : null}
                      {s.duracion_minutos != null ? <span>{s.duracion_minutos} min</span> : null}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ) : null}

        {/* Testimonios */}
        {testimonios.length > 0 ? (
          <section className="mt-12">
            <h2
              className="mb-4 text-sm font-semibold uppercase tracking-wide"
              style={{ color: colorSecundario }}
            >
              Testimonios
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {testimonios.map((t, i) => (
                <Card
                  key={`${t.nombre_paciente ?? "testimonio"}-${i}`}
                  className="border-gray-200 bg-gray-50"
                >
                  <CardContent className="p-4">
                    <div className="mb-2 flex items-center gap-0.5">
                      {Array.from({ length: t.calificacion ?? 0 }).map((_, j) => (
                        <Star key={j} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-sm italic text-gray-700">"{t.contenido}"</p>
                    <p className="mt-2 text-sm font-medium text-gray-600">— {t.nombre_paciente}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ) : null}

        {/* FAQs fijas */}
        <section className="mt-12" id="faq">
          <h2
            className="mb-4 text-sm font-semibold uppercase tracking-wide"
            style={{ color: colorSecundario }}
          >
            Preguntas frecuentes
          </h2>
          <Accordion type="single" collapsible className="w-full">
            {FAQS_FIJAS.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left text-sm font-medium text-gray-900">
                  {faq.pregunta}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-gray-600">
                  {faq.respuesta}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* Ubicación / contacto */}
        {config.mapa_direccion ? (
          <section className="mt-12">
            <h2
              className="mb-3 text-sm font-semibold uppercase tracking-wide"
              style={{ color: colorSecundario }}
            >
              Ubicación
            </h2>
            <a
              href={construirUrlGoogleMaps(config.mapa_direccion)}
              target="_blank"
              rel="noreferrer"
              className="flex items-start gap-2 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 hover:bg-gray-100"
            >
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" style={{ color: colorSecundario }} />
              <span className="underline-offset-2 hover:underline">{config.mapa_direccion}</span>
            </a>
          </section>
        ) : null}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 px-6 py-8 text-center text-xs text-gray-500">
        <p>
          Dr(a). {nombreMedico}
          {config.especialidad ? ` · ${config.especialidad}` : ""}
        </p>
        {credenciales ? <p className="mt-1">{credenciales}</p> : null}
        <div className="mt-3 flex items-center justify-center gap-3 text-gray-400">
          <Link to="/libro-reclamaciones" search={{ slug: config.slug ?? undefined }} className="inline-flex items-center gap-1 hover:underline">
            <FileWarning className="h-3.5 w-3.5" />
            Libro de Reclamaciones
          </Link>
        </div>
        <p className="mt-3 text-gray-400">Web publicada con MediSuite</p>
      </footer>
    </div>
  );
}

export function LandingPublicaNoEncontrada() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-6xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">
          No encontramos esta página médica
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          El enlace no existe o el médico aún no publicó su web pública.
        </p>
        <div className="mt-6">
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Ir al inicio
          </a>
        </div>
      </div>
    </div>
  );
}
