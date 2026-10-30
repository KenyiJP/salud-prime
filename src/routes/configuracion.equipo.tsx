import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Copy, Mail, MessageCircle, UserPlus, Ban } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard-shell";
import { guardPorRuta } from "@/components/require-ruta";
import { PageHeader } from "@/components/page-primitives";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import { requireSession } from "@/lib/auth-guard";
import {
  enlaceInvitacion,
  enlaceMailto,
  enlaceWhatsapp,
  esCorreo,
  estadoInvitacion,
  etiquetaRol,
  mensajeEquipo,
  mensajeInvitacion,
  ROLES_INVITABLES,
} from "@/lib/equipo-utils";
import {
  useCambiarRol,
  useCrearInvitacion,
  useInvitacionesQuery,
  useMiembrosQuery,
  useRevocarAcceso,
  useRevocarInvitacion,
  type Invitacion,
  type Miembro,
} from "@/lib/equipo.queries";

const Guard = guardPorRuta("/configuracion/equipo");

export const Route = createFileRoute("/configuracion/equipo")({
  beforeLoad: () => requireSession(),
  ssr: false,
  head: () => ({
    meta: [
      { title: "Equipo y accesos — MediSuite" },
      { name: "description", content: "Invita a tu equipo y administra sus roles en el consultorio." },
    ],
  }),
  component: EquipoPage,
});

// El correo sale por `mailto:` desde la cuenta del propio médico. El envío desde
// un correo oficial de MediSuite queda pendiente hasta tener dominio propio y
// SMTP (ver docs/semana-05.md, "Pendientes de Etapa 3").

type Generada = { token: string; rol: string; nombre: string; expira_en: string };

function EquipoPage() {
  const { rol: miRol } = useAuth();
  const miembros = useMiembrosQuery();
  const esTitular = miRol === "founder" || miRol === "medico";
  const invitaciones = useInvitacionesQuery(esTitular);
  const [generada, setGenerada] = useState<Generada | null>(null);

  const lista = miembros.data && miembros.data.ok ? miembros.data.miembros : [];
  const errorLista = miembros.data && !miembros.data.ok ? mensajeEquipo(miembros.data.codigo) : null;

  return (
    <DashboardShell Guard={Guard}>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Configuración"
          title="Equipo y accesos"
          description="Invita a recepción, enfermería, facturación o community manager. Cada rol ve solo lo que necesita."
        />

        <InvitarCard onGenerada={setGenerada} />
        {generada ? <EnlaceCard generada={generada} onCerrar={() => setGenerada(null)} /> : null}

        <Card className="border-border/60 shadow-none">
          <CardHeader>
            <CardTitle>Miembros</CardTitle>
            <CardDescription>Personas con acceso a este consultorio.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {miembros.isLoading ? <p className="text-sm text-muted-foreground">Cargando…</p> : null}
            {errorLista ? (
              <Alert variant="destructive">
                <AlertDescription>{errorLista}</AlertDescription>
              </Alert>
            ) : null}
            {lista.map((m) => (
              <FilaMiembro key={m.user_id} m={m} />
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-none">
          <CardHeader>
            <CardTitle>Invitaciones</CardTitle>
            <CardDescription>
              Cada enlace vale 72 horas y se usa una sola vez. Cualquier persona con el enlace puede unirse con el
              rol indicado: envíalo solo a quien corresponde. Por seguridad no se puede volver a ver; si lo
              perdiste, revoca la invitación y crea otra.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {invitaciones.isError ? (
              <Alert variant="destructive">
                <AlertDescription>No se pudieron cargar las invitaciones.</AlertDescription>
              </Alert>
            ) : (
              <ListaInvitaciones items={invitaciones.data ?? []} />
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}

function InvitarCard({ onGenerada }: { onGenerada: (g: Generada) => void }) {
  const [rol, setRol] = useState<string>("recepcion");
  const [nombre, setNombre] = useState("");
  const crear = useCrearInvitacion();
  const ayuda = ROLES_INVITABLES.find((r) => r.valor === rol)?.ayuda;

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const r = await crear.mutateAsync({ rol, nombre });
    if (!r.ok) {
      toast.error(mensajeEquipo(r.codigo));
      return;
    }
    onGenerada({ token: r.token, rol, nombre: nombre.trim(), expira_en: r.expira_en });
    crear.reset(); // el token en claro no debe quedar en el caché de mutaciones
    setNombre("");
    toast.success("Invitación creada. Copia o envía el enlace.");
  }

  return (
    <Card className="border-border/60 shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" /> Invitar a una persona
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={enviar} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div className="space-y-1.5">
            <Label htmlFor="inv-nombre">Nombre (opcional)</Label>
            <Input
              id="inv-nombre"
              value={nombre}
              maxLength={80}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Ana"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="inv-rol">Rol</Label>
            <Select value={rol} onValueChange={setRol}>
              <SelectTrigger id="inv-rol">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES_INVITABLES.map((r) => (
                  <SelectItem key={r.valor} value={r.valor}>
                    {r.etiqueta}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={crear.isPending}>
            {crear.isPending ? "Creando…" : "Crear invitación"}
          </Button>
          {ayuda ? <p className="text-xs text-muted-foreground sm:col-span-3">{ayuda}</p> : null}
        </form>
      </CardContent>
    </Card>
  );
}

function EnlaceCard({ generada, onCerrar }: { generada: Generada; onCerrar: () => void }) {
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const enlace = enlaceInvitacion(window.location.origin, generada.token);
  const mensaje = mensajeInvitacion({ enlace, rol: generada.rol, nombre: generada.nombre });

  async function copiar() {
    try {
      await navigator.clipboard.writeText(enlace);
      toast.success("Enlace copiado.");
    } catch {
      toast.error("No se pudo copiar. Selecciónalo y cópialo a mano.");
    }
  }

  return (
    <Card className="border-primary/40 shadow-none">
      <CardHeader>
        <CardTitle>Enlace de invitación — {etiquetaRol(generada.rol)}</CardTitle>
        <CardDescription>
          Se muestra una sola vez. Vence el {new Date(generada.expira_en).toLocaleString("es-PE")}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input readOnly value={enlace} onFocus={(e) => e.currentTarget.select()} aria-label="Enlace de invitación" />
          <Button type="button" variant="outline" onClick={copiar}>
            <Copy className="mr-2 h-4 w-4" /> Copiar
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="inv-tel">WhatsApp de la persona (opcional)</Label>
            <div className="flex gap-2">
              <Input id="inv-tel" inputMode="tel" placeholder="51987654321" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
              <Button type="button" variant="outline" asChild>
                <a href={enlaceWhatsapp(mensaje, telefono)} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
                </a>
              </Button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="inv-mail">Correo de la persona</Label>
            <div className="flex gap-2">
              <Input id="inv-mail" type="email" placeholder="persona@correo.com" value={correo} onChange={(e) => setCorreo(e.target.value)} />
              <Button type="button" variant="outline" asChild={esCorreo(correo)} disabled={!esCorreo(correo)}>
                {esCorreo(correo) ? (
                  <a href={enlaceMailto({ para: correo, asunto: "Invitación a MediSuite", cuerpo: mensaje })}>
                    <Mail className="mr-2 h-4 w-4" /> Enviar invitación por correo
                  </a>
                ) : (
                  <span>
                    <Mail className="mr-2 inline h-4 w-4" /> Enviar invitación por correo
                  </span>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Se abre tu programa de correo con el mensaje listo; sale desde tu propia cuenta. El envío
              automático desde MediSuite se activará cuando exista el correo oficial.
            </p>
          </div>
        </div>

        <Button type="button" variant="ghost" size="sm" onClick={onCerrar}>
          Ocultar enlace
        </Button>
      </CardContent>
    </Card>
  );
}

function FilaMiembro({ m }: { m: Miembro }) {
  const { user } = useAuth();
  const cambiar = useCambiarRol();
  const revocar = useRevocarAcceso();
  const soyYo = user?.id === m.user_id;
  const editable = !m.es_titular && !soyYo;

  async function alCambiar(nuevo: string) {
    const r = await cambiar.mutateAsync({ userId: m.user_id, rol: nuevo });
    if (r.ok) toast.success("Rol actualizado.");
    else toast.error(mensajeEquipo(r.codigo));
  }

  async function alRevocar() {
    if (!window.confirm(`¿Quitar el acceso de ${m.email ?? "este usuario"}? Perderá el acceso de inmediato.`)) return;
    const r = await revocar.mutateAsync({ userId: m.user_id });
    if (r.ok) toast.success("Acceso revocado.");
    else toast.error(mensajeEquipo(r.codigo));
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border/60 p-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{m.email ?? "Sin correo"}</p>
        <p className="text-xs text-muted-foreground">
          {m.es_titular ? "Titular del consultorio" : soyYo ? "Tú" : `Desde ${new Date(m.created_at).toLocaleDateString("es-PE")}`}
        </p>
      </div>
      {editable ? (
        <>
          <Select value={m.rol} onValueChange={alCambiar} disabled={cambiar.isPending}>
            <SelectTrigger className="w-44" aria-label={`Rol de ${m.email ?? "usuario"}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {!ROLES_INVITABLES.some((r) => r.valor === m.rol) ? (
                <SelectItem value={m.rol} disabled>
                  {etiquetaRol(m.rol)}
                </SelectItem>
              ) : null}
              {ROLES_INVITABLES.map((r) => (
                <SelectItem key={r.valor} value={r.valor}>
                  {r.etiqueta}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" variant="outline" size="sm" onClick={alRevocar} disabled={revocar.isPending}>
            Quitar acceso
          </Button>
        </>
      ) : (
        <Badge variant="secondary">{etiquetaRol(m.rol)}</Badge>
      )}
    </div>
  );
}

function ListaInvitaciones({ items }: { items: Invitacion[] }) {
  const revocar = useRevocarInvitacion();
  if (items.length === 0) return <p className="text-sm text-muted-foreground">Aún no hay invitaciones.</p>;

  return (
    <>
      {items.map((i) => {
        const estado = estadoInvitacion(i);
        return (
          <div key={i.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border/60 p-3 text-sm">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">
                {i.nombre_referencia?.trim() || "Sin nombre"} · {etiquetaRol(i.rol)}
              </p>
              <p className="text-xs text-muted-foreground">
                Creada {new Date(i.creado_en).toLocaleString("es-PE")}
              </p>
            </div>
            <Badge variant={estado === "vigente" ? "default" : "outline"} className="capitalize">
              {estado}
            </Badge>
            {estado === "vigente" ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={revocar.isPending}
                onClick={async () => {
                  const r = await revocar.mutateAsync({ id: i.id });
                  if (r.ok) toast.success("Invitación revocada.");
                  else toast.error(mensajeEquipo(r.codigo));
                }}
              >
                <Ban className="mr-2 h-4 w-4" /> Revocar
              </Button>
            ) : null}
          </div>
        );
      })}
    </>
  );
}
