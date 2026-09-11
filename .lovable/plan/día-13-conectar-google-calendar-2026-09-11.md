# Día 13 — Conectar Google Calendar

## Objetivo
Crear la pantalla protegida `/configuracion/calendario` dentro del diseño actual de MediSuite, sin modificar tablas, políticas, funciones SQL ni Edge Functions.

## Cambios
- Añadir una tarjeta de integración que consulte la conexión Google Calendar del médico autenticado respetando RLS.
- Mostrar el correo vinculado y estado cuando exista una integración activa; en caso contrario, ofrecer “Conectar con Google Calendar”.
- Iniciar OAuth llamando `google-calendar-oauth-start` con el JWT vigente y redirigir el navegador a la URL de Google devuelta.
- Leer `gcal`, `email` y `detalle` al volver de Google, mostrar el resultado y limpiar esos parámetros para evitar mensajes repetidos.
- Añadir desconexión con diálogo de confirmación y llamada al RPC `gcal_revocar_integracion`.
- Añadir acceso desde el menú de Configuración y mantenerlo oculto para `community_manager`, como las demás funciones clínicas.

## Validación
- Comprobar tipos y compilación.
- Verificar en el navegador la protección de la ruta, los estados visuales y que no haya errores de consola.

## Detalles técnicos
- Se reutilizarán el cliente Supabase, TanStack Query, Sonner, los botones y diálogos existentes.
- Los errores HTTP de la función se leerán desde su cuerpo para mostrar el mensaje exacto devuelto por el backend.
- No se aceptarán `tenant_id` ni `medico_id` desde formularios o parámetros de usuario.
