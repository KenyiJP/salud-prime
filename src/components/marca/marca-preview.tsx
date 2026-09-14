import { useState } from "react";
import { Laptop, MapPin, Phone, Smartphone, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ETIQUETA_TIPOGRAFIA,
  construirUrlGoogleMaps,
  type LandingConfigInput,
  type LandingServicioRow,
  type LandingTestimonioRow,
} from "@/lib/landing-marca-schemas";

const FUENTE_CSS: Record<LandingConfigInput["tipografia"], string> = {
  inter: "'Inter', sans-serif",
  roboto: "'Roboto', sans-serif",
  poppins: "'Poppins', sans-serif",
  merriweather: "'Merriweather', serif",
  "playfair-display": "'Playfair Display', serif",
  lora: "'Lora', serif",
};

export function MarcaPreview({
  config,
  servicios,
  testimonios,
  nombreConsultorio,
}: {
  config: LandingConfigInput;
  servicios: LandingServicioRow[];
  testimonios: LandingTestimonioRow[];
  nombreConsultorio: string;
}) {
  const [modo, setModo] = useState<"desktop" | "mobile">("desktop");

  const serviciosActivos = servicios.filter((s) => s.activo);
  const testimoniosAprobados = testimonios.filter((t) => t.aprobado);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Vista previa en vivo
        </h3>
        <div className="flex gap-1 rounded-md border border-border/60 p-1">
          <Button
            type="button"
            size="sm"
            variant={modo === "desktop" ? "secondary" : "ghost"}
            className="gap-1.5 px-2"
            onClick={() => setModo("desktop")}
          >
            <Laptop className="h-3.5 w-3.5" /> Escritorio
          </Button>
          <Button
            type="button"
            size="sm"
            variant={modo === "mobile" ? "secondary" : "ghost"}
            className="gap-1.5 px-2"
            onClick={() => setModo("mobile")}
          >
            <Smartphone className="h-3.5 w-3.5" /> Móvil
          </Button>
        </div>
      </div>

      {!config.publicado ? (
        <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-600">
          Tu landing está en modo borrador: aún no es visible al público.
        </p>
      ) : null}

      <div className="flex justify-center rounded-xl border border-border/60 bg-muted/30 p-4">
        <div
          className={cn(
            "overflow-hidden rounded-lg border border-border/60 shadow-xl transition-all",
            modo === "desktop" ? "w-full max-w-2xl" : "w-[320px]",
          )}
          style={{
            backgroundColor: config.color_fondo,
            fontFamily: FUENTE_CSS[config.tipografia],
          }}
        >
          <div
            className="flex items-center gap-3 px-5 py-6"
            style={{ backgroundColor: config.color_primario }}
          >
            {config.logo_url ? (
              <img
                src={config.logo_url}
                alt="Logo"
                className="h-10 w-10 shrink-0 rounded-full border-2 border-white/70 object-cover"
              />
            ) : null}
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-white">{nombreConsultorio}</p>
              {config.mostrar_cmp || config.mostrar_rne ? (
                <p className="truncate text-xs text-white/80">
                  {config.mostrar_cmp ? "CMP visible" : ""}
                  {config.mostrar_cmp && config.mostrar_rne ? " · " : ""}
                  {config.mostrar_rne ? "RNE visible" : ""}
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-6 p-5">
            {config.foto_medico_url ? (
              <div className="flex justify-center">
                <img
                  src={config.foto_medico_url}
                  alt="Foto del médico"
                  className="h-20 w-20 rounded-full object-cover ring-4"
                  style={{ ["--tw-ring-color" as string]: config.color_secundario }}
                />
              </div>
            ) : null}

            {config.biografia ? (
              <p className="text-center text-sm leading-relaxed text-gray-700">
                {config.biografia}
              </p>
            ) : (
              <p className="text-center text-xs italic text-gray-400">
                Agrega una biografía corta para que tus pacientes te conozcan.
              </p>
            )}

            {serviciosActivos.length > 0 ? (
              <div>
                <p
                  className="mb-2 text-xs font-semibold uppercase tracking-wide"
                  style={{ color: config.color_secundario }}
                >
                  Servicios
                </p>
                <div
                  className={cn(
                    "grid gap-2",
                    modo === "desktop" ? "grid-cols-2" : "grid-cols-1",
                  )}
                >
                  {serviciosActivos.slice(0, 4).map((s) => (
                    <div
                      key={s.id}
                      className="rounded-md border p-2.5 text-xs"
                      style={{ borderColor: `${config.color_secundario}40` }}
                    >
                      <p className="font-medium text-gray-800">{s.nombre}</p>
                      {s.precio != null ? (
                        <p className="text-gray-500">S/ {s.precio.toFixed(2)}</p>
                      ) : null}
                      {s.duracion_minutos != null ? (
                        <p className="text-gray-400">{s.duracion_minutos} min</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {testimoniosAprobados.length > 0 ? (
              <div>
                <p
                  className="mb-2 text-xs font-semibold uppercase tracking-wide"
                  style={{ color: config.color_secundario }}
                >
                  Testimonios
                </p>
                <div className="space-y-2">
                  {testimoniosAprobados.slice(0, 2).map((t) => (
                    <div key={t.id} className="rounded-md bg-gray-50 p-2.5 text-xs">
                      <div className="mb-1 flex items-center gap-0.5">
                        {Array.from({ length: t.calificacion ?? 0 }).map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <p className="italic text-gray-600">"{t.contenido}"</p>
                      <p className="mt-1 font-medium text-gray-700">— {t.nombre_paciente}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {config.mapa_direccion ? (
              <a
                href={construirUrlGoogleMaps(config.mapa_direccion)}
                target="_blank"
                rel="noreferrer"
                className="flex items-start gap-2 rounded-md bg-gray-50 p-2.5 text-xs text-gray-600 hover:bg-gray-100"
              >
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span className="underline-offset-2 hover:underline">{config.mapa_direccion}</span>
              </a>
            ) : null}

            <div className="flex flex-wrap justify-center gap-2 pt-2">
              {config.mostrar_boton_reserva ? (
                <span
                  className="rounded-md px-4 py-2 text-xs font-semibold text-white"
                  style={{ backgroundColor: config.color_primario }}
                >
                  Reservar cita
                </span>
              ) : null}
              {config.mostrar_boton_whatsapp && config.whatsapp_numero ? (
                <span className="inline-flex items-center gap-1.5 rounded-md border border-green-500/40 px-4 py-2 text-xs font-semibold text-green-700">
                  <Phone className="h-3.5 w-3.5" /> WhatsApp
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      <p className="text-center text-[11px] text-muted-foreground">
        Fuente: {ETIQUETA_TIPOGRAFIA[config.tipografia]} · Simulación aproximada, el diseño final
        puede variar.
      </p>
    </div>
  );
}
