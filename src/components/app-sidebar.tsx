import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  CalendarDays,
  CalendarClock,
  CalendarSync,
  FileHeart,
  ClipboardPlus,
  FlaskConical,
  Pill,
  Receipt,
  Scan,
  Stethoscope,
  UserCog,
  LogOut,
  Palette,
  BarChart3,
  TrendingUp,
} from "lucide-react";


import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useEsAdminPlataformaQuery } from "@/lib/metricas-conversacion.queries";

const clinicalItems = [
  { title: "Dashboard Principal", url: "/", icon: LayoutDashboard },
  { title: "Calendario de Citas", url: "/calendario", icon: CalendarDays },
  { title: "Fichas Clínicas (EHR)", url: "/fichas", icon: FileHeart },
  { title: "Consulta / Historias", url: "/historias", icon: ClipboardPlus },
  { title: "Laboratorios", url: "/laboratorios", icon: FlaskConical },
  { title: "Imagenología", url: "/imagenologia", icon: Scan },
  { title: "Recetario Inteligente", url: "/recetario", icon: Pill },
  { title: "Facturación", url: "/facturacion", icon: Receipt },
] as const;

const configurationItems = [
  { title: "Identidad y landing", url: "/marca", icon: Palette },
  { title: "Horarios y bloqueos", url: "/horarios", icon: CalendarClock },
  { title: "Google Calendar", url: "/configuracion/calendario", icon: CalendarSync },
  { title: "Mi perfil médico", url: "/perfil-medico", icon: UserCog },
  { title: "Métricas del agente", url: "/configuracion/metricas-agente", icon: BarChart3 },
] as const;

// Solo administradores de plataforma (tabla `plataforma_administradores`). El
// enlace es cosmético: la barrera real es la RPC `medisuite_obtener_metricas_comercial`.
const adminItems = [
  { title: "Métricas comerciales", url: "/admin/metricas-comercial", icon: TrendingUp },
] as const;

// community_manager has no RLS access to clinical data, so these entries are
// hidden for that role instead of showing a broken page.
const SOLO_CLINICO: readonly string[] = [
  "/laboratorios",
  "/historias",
  "/imagenologia",
  "/fichas",
  "/calendario",
  "/horarios",
  "/configuracion/calendario",
  "/perfil-medico",
  "/configuracion/metricas-agente",
];



export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, rol, signOut } = useAuth();
  const navigate = useNavigate();
  const esAdminPlataforma = useEsAdminPlataformaQuery().data === true;
  const clinicalVisible = clinicalItems.filter(
    (item) => rol !== "community_manager" || !SOLO_CLINICO.includes(item.url),
  );
  const configurationVisible = configurationItems.filter(
    (item) => rol !== "community_manager" || !SOLO_CLINICO.includes(item.url),
  );

  async function handleSignOut() {
    await signOut();
    navigate({ to: "/login", replace: true });
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/30">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate font-display text-sm font-semibold tracking-tight">
              MediSuite
            </p>
            <p className="truncate text-xs text-sidebar-foreground/60">
              Salud Digital · Perú
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Clínica</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {clinicalVisible.map((item) => {
                const active =
                  item.url === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                    >
                      <Link to={item.url} className="flex items-center gap-3">
                        <item.icon className="h-4 w-4" />
                        <span className="truncate">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {configurationVisible.length > 0 ? (
          <SidebarGroup>
            <SidebarGroupLabel>Configuración</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {configurationVisible.map((item) => {
                  const active = pathname.startsWith(item.url);
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={item.title}
                      >
                        <Link to={item.url} className="flex items-center gap-3">
                          <item.icon className="h-4 w-4" />
                          <span className="truncate">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}
        {esAdminPlataforma ? (
          <SidebarGroup>
            <SidebarGroupLabel>Administración</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname.startsWith(item.url)}
                      tooltip={item.title}
                    >
                      <Link to={item.url} className="flex items-center gap-3">
                        <item.icon className="h-4 w-4" />
                        <span className="truncate">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground text-xs font-semibold uppercase">
            {(user?.email ?? "?").slice(0, 2)}
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-medium">{user?.email ?? "Sin sesión"}</p>
            <p className="truncate text-xs capitalize text-sidebar-foreground/60">
              {rol ?? "Sin rol"}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          <span className="group-data-[collapsible=icon]:hidden">Cerrar sesión</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
