# Complemento Día 11B — EHR NTS 139

## Alcance
- Mantener el módulo actual de consultas e integrar las reglas de firma, acceso QR, trazabilidad y anulación sin cambios de esquema ni RLS.

## Implementación
1. **Informe público firmado**
   - Reutilizar el token HMAC de 90 días de las órdenes.
   - Permitir abrir `/atencion/:atencionId?acceso=...` sin sesión cuando el token sea válido.
   - Obtener el informe con lectura server-side y mostrar firma o espacio manuscrito, línea punteada, datos médicos centrados y QR de 96×96 px con URL pública.

2. **Órdenes vinculadas a la consulta**
   - Propagar `atencion_id` al abrir Laboratorio o Imagenología desde una atención guardada.
   - Resolver y validar la atención en el servidor antes de guardar cada orden.
   - Mostrar en el expediente las órdenes vinculadas, separando vigentes y anuladas en un acordeón de auditoría.
   - Mantener la anulación como cambio de estado; no añadir ninguna operación DELETE para órdenes existentes.

3. **Anulación de atención**
   - Añadir acción disponible solo para atenciones firmadas.
   - Solicitar obligatoriamente `motivo_anulacion` en un diálogo y enviarlo al servidor junto al estado `anulada`.
   - Mantener firmadas/anuladas en solo lectura; las firmadas permiten adenda o anulación, y las anuladas conservan contenido y trazabilidad.
   - Mostrar badge distintivo y motivo en la línea de tiempo, sin tachar el contenido.

## Validación
- Comprobar tipos y flujo visual del expediente.
- Probar acceso del informe con token en un navegador sin sesión.
- Confirmar que una atención firmada no ofrece edición ni retorno a borrador.
