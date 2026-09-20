# Registro de Cambios (Changelog)

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/).

## [Fase 1] - 2026-09-20

### Añadido
- **PR #6** - FASE1-C: panel solo-lectura log sync Google Calendar: Vista y ruta `/configuracion/google-calendar-log` para auditar el historial y resultado de sincronizaciones de citas (`google_calendar_sync_log`).
- **PR #5** - FASE1-D: panel solo-lectura cola reintentos Google Calendar: Vista y ruta `/configuracion/google-calendar-cola` para consultar los reintentos pendientes de sincronización (`google_calendar_sync_cola`).
- **PR #4** - FASE1-B: card solo-lectura de integración WhatsApp: Componente informativo y ruta `/configuracion/whatsapp` que muestra el estado de conexión de WhatsApp Business (`whatsapp_integraciones`).
- **PR #3** - FASE1-A: panel solo-lectura de eventos webhook WhatsApp: Vista y ruta `/configuracion/whatsapp-eventos` para auditar los últimos 50 eventos recibidos (`whatsapp_webhook_events`) con estado y detalle de errores.

### Modificado
- **PR #2** - Badge de testimonio pendiente con color ámbar: Actualización visual del badge de estado para testimonios pendientes en el panel de Marca usando variante ámbar de advertencia.
