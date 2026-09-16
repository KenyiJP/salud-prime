import { createFileRoute, notFound } from "@tanstack/react-router";
import {
  LandingPublicaNoEncontrada,
  LandingPublicaView,
} from "@/components/marca/landing-publica-view";
import { getLandingMedicaPublicaServerFn } from "@/lib/landing-marca.server";
import type { LandingMedicaPublica } from "@/lib/landing-marca-schemas";
import { baseUrlPublica } from "@/lib/orden-url";

export const Route = createFileRoute("/dr-{$slug}")({
  // Landing 100% pública: sin `requireSession`/`requireSupabaseAuth`. SSR real
  // (a diferencia de las páginas del panel, que van con `ssr: false`) porque
  // el valor de esta ruta es justamente que buscadores y previews de
  // WhatsApp/redes reciban el HTML ya con el `head()` de abajo resuelto.
  loader: async ({ params }) => {
    const landing = await getLandingMedicaPublicaServerFn({ data: { slug: params.slug } });
    if (!landing) throw notFound();
    return landing;
  },
  head: ({ loaderData }) => construirHead(loaderData),
  component: LandingPublicaPage,
  notFoundComponent: () => <LandingPublicaNoEncontrada />,
  errorComponent: () => <LandingPublicaNoEncontrada />,
});

function construirHead(landing: LandingMedicaPublica | undefined) {
  if (!landing) {
    return {
      meta: [{ title: "Médico no encontrado — MediSuite" }, { name: "robots", content: "noindex" }],
    };
  }

  const { config } = landing;
  const nombreCompleto = [config.nombres, config.apellidos].filter(Boolean).join(" ").trim();
  const nombreMedico = nombreCompleto ? `Dr(a). ${nombreCompleto}` : "Médico";
  const titulo = config.especialidad
    ? `${nombreMedico} — ${config.especialidad} | MediSuite`
    : `${nombreMedico} | MediSuite`;
  const descripcion =
    (config.biografia && config.biografia.slice(0, 160)) ||
    `Agenda tu consulta con ${nombreMedico}${config.especialidad ? `, ${config.especialidad}` : ""} en MediSuite.`;

  const base = baseUrlPublica();
  const url = base && config.slug ? `${base}/dr-${config.slug}` : undefined;
  const imagen = config.foto_medico_url ?? config.logo_url ?? undefined;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Physician",
    name: nombreCompleto || undefined,
    medicalSpecialty: config.especialidad ?? undefined,
    image: imagen,
    url,
    description: config.biografia ?? undefined,
    address: config.mapa_direccion
      ? { "@type": "PostalAddress", streetAddress: config.mapa_direccion }
      : undefined,
    telephone: config.whatsapp_numero ?? undefined,
  };

  return {
    meta: [
      { title: titulo },
      { name: "description", content: descripcion },
      { property: "og:title", content: titulo },
      { property: "og:description", content: descripcion },
      { property: "og:type", content: "profile" },
      ...(url ? [{ property: "og:url", content: url }] : []),
      ...(imagen ? [{ property: "og:image", content: imagen }] : []),
      { name: "twitter:card", content: imagen ? "summary_large_image" : "summary" },
      { name: "twitter:title", content: titulo },
      { name: "twitter:description", content: descripcion },
    ],
    links: url ? [{ rel: "canonical", href: url }] : [],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(jsonLd),
      },
    ],
  };
}

function LandingPublicaPage() {
  const landing = Route.useLoaderData();
  return <LandingPublicaView data={landing} />;
}
