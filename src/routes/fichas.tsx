import { createFileRoute, Link } from "@tanstack/react-router";
import { requireSession } from "@/lib/auth-guard";
import { useMemo, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { FileHeart, FlaskConical, Pencil, Search, Trash2, UserPlus } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { PageHeader, PlaceholderCard } from "@/components/page-primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PacienteDialog } from "@/components/paciente-dialog";
import { ConfirmarEliminar } from "@/components/confirmar-eliminar";
import { nombrePaciente, pacientesQuery, useEliminarPaciente } from "@/lib/pacientes.queries";

export const Route = createFileRoute("/fichas")({
  beforeLoad: () => requireSession(),
  // Client-only: the data below requires an authenticated Supabase session,
  // which does not exist during SSR/prerender.
  ssr: false,
  head: () => ({
    meta: [
      { title: "Fichas Clínicas (EHR) — MediSuite" },
      {
        name: "description",
        content: "Listado de pacientes con documento de identidad, teléfono y contacto conectado a tu base de datos clínica.",
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
  const eliminar = useEliminarPaciente();
  const [busqueda, setBusqueda] = useState("");

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return pacientes;
    return pacientes.filter((p) =>
      [nombrePaciente(p), p.documento_identidad ?? "", p.telefono ?? "", p.email ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [pacientes, busqueda]);

  return (
    <DashboardShell>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Historia clínica"
          title="Fichas Clínicas (EHR)"
          description="Pacientes registrados en tu consultorio, leídos de la tabla pacientes."
          actions={
            <PacienteDialog
              trigger={
                <Button className="gap-2">
                  <UserPlus className="h-4 w-4" /> Nuevo paciente
                </Button>
              }
            />
          }
        />

        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por documento, nombre o teléfono…"
            className="h-10 pl-9"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
          <table className="w-full text-sm">
            <thead className="bg-background/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Paciente</th>
                <th className="px-4 py-3 text-left font-medium">Documento</th>
                <th className="px-4 py-3 text-left font-medium">Teléfono</th>
                <th className="hidden px-4 py-3 text-left font-medium md:table-cell">Correo</th>
                <th className="hidden px-4 py-3 text-left font-medium md:table-cell">Nacimiento</th>
                <th className="px-4 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((p) => (
                <tr key={p.id} className="border-t border-border/50">
                  <td className="px-4 py-3 font-medium">{nombrePaciente(p)}</td>
                  <td className="px-4 py-3 font-mono text-xs">{p.documento_identidad ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs">{p.telefono ?? "—"}</td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {p.email ?? "—"}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {p.fecha_nacimiento ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        asChild
                        variant="ghost"
                        size="icon"
                        aria-label={`Laboratorios de ${nombrePaciente(p)}`}
                      >
                        <Link to="/laboratorios" search={{ paciente: p.id }}>
                          <FlaskConical className="h-4 w-4" />
                        </Link>
                      </Button>
                      <PacienteDialog
                        paciente={p}
                        trigger={
                          <Button variant="ghost" size="icon" aria-label={`Editar ${nombrePaciente(p)}`}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        }
                      />
                      <ConfirmarEliminar
                        title="¿Eliminar paciente?"
                        description={`Se eliminará ${nombrePaciente(p)} y todas sus citas. Esta acción no se puede deshacer.`}
                        onConfirm={() => eliminar.mutate({ id: p.id })}
                        disabled={eliminar.isPending}
                        trigger={
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Eliminar ${nombrePaciente(p)}`}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        }
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
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
