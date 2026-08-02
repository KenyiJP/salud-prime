import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { FileHeart, Search } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { PageHeader, PlaceholderCard } from "@/components/page-primitives";
import { Input } from "@/components/ui/input";
import { NuevoPacienteDialog } from "@/components/nuevo-paciente-dialog";
import { pacientesQuery } from "@/lib/pacientes.queries";

export const Route = createFileRoute("/fichas")({
  // Client-only: the data below requires an authenticated Supabase session,
  // which does not exist during SSR/prerender.
  ssr: false,
  head: () => ({
    meta: [
      { title: "Fichas Clínicas (EHR) — MediSuite" },
      {
        name: "description",
        content: "Listado de pacientes con DNI, teléfono y antecedentes conectado a tu base de datos clínica.",
      },
      { property: "og:title", content: "Fichas Clínicas (EHR) — MediSuite" },
      {
        property: "og:description",
        content: "Historia clínica electrónica para consultorios independientes en Perú.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(pacientesQuery());
  },
  component: FichasPage,
  errorComponent: ({ error }) => (
    <DashboardShell>
      <div role="alert" className="rounded-xl border border-destructive/40 bg-card p-6 text-sm">
        No se pudieron cargar los pacientes: {error.message}
      </div>
    </DashboardShell>
  ),
  notFoundComponent: () => (
    <DashboardShell>
      <p className="text-sm text-muted-foreground">Sin pacientes disponibles.</p>
    </DashboardShell>
  ),
});

function FichasPage() {
  const { data: pacientes } = useSuspenseQuery(pacientesQuery());

  return (
    <DashboardShell>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Historia clínica"
          title="Fichas Clínicas (EHR)"
          description="Pacientes registrados en tu consultorio, leídos de la tabla pacientes."
          actions={<NuevoPacienteDialog />}
        />

        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por DNI, nombre o historia…" className="h-10 pl-9" />
        </div>

        <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
          <table className="w-full text-sm">
            <thead className="bg-background/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Paciente</th>
                <th className="px-4 py-3 text-left font-medium">DNI</th>
                <th className="px-4 py-3 text-left font-medium">WhatsApp</th>
                <th className="hidden px-4 py-3 text-left font-medium md:table-cell">Antecedentes / alergias</th>
              </tr>
            </thead>
            <tbody>
              {pacientes.map((p) => (
                <tr key={p.id} className="border-t border-border/50">
                  <td className="px-4 py-3 font-medium">{p.nombre_completo}</td>
                  <td className="px-4 py-3 font-mono text-xs">{p.dni ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs">{p.telefono_whatsapp}</td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {p.antecedentes_alergias ?? "—"}
                  </td>
                </tr>
              ))}
              {pacientes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    No hay pacientes registrados.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <PlaceholderCard
            icon={<FileHeart className="h-5 w-5" />}
            title="Evoluciones y adjuntos"
            description="Cada ficha guardará antecedentes, evoluciones y exámenes vinculados al paciente."
          />
          <PlaceholderCard
            icon={<FileHeart className="h-5 w-5" />}
            title="Plantillas SOAP"
            description="Crea evoluciones estructuradas con plantillas específicas por especialidad."
          />
        </div>
      </div>
    </DashboardShell>
  );
}
