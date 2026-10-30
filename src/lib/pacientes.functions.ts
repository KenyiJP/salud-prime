import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  actualizarPacienteSchema,
  eliminarPacienteSchema,
  nuevoPacienteSchema,
  type PacienteRow,
} from "./clinica-schemas";

export const getPacientes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { resolveContextoConsultorio } = await import("./clinica-tenant.server");
    const { medicoId } = await resolveContextoConsultorio(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("pacientes")
      .select("*")
      .eq("medico_id", medicoId)
      .order("apellidos");
    if (error) throw new Error(error.message);
    return (data ?? []) as PacienteRow[];
  });

export const crearPaciente = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(nuevoPacienteSchema.parse)
  .handler(async ({ context, data }) => {
    const { resolveContextoConsultorio } = await import("./clinica-tenant.server");
    const { medicoId, tenantId } = await resolveContextoConsultorio(
      context.supabase,
      context.userId,
    );
    const { data: row, error } = await context.supabase
      .from("pacientes")
      // `numero_historia_clinica` lo asigna la base de datos, por eso el insert
      // no lo envía (los tipos generados lo marcan como obligatorio).
      .insert({
        // tenant_id / medico_id always come from the session, never the client.
        tenant_id: tenantId,
        medico_id: medicoId,
        nombres: data.nombres,
        apellidos: data.apellidos,
        documento_identidad: data.documento_identidad || null,
        telefono: data.telefono || null,
        email: data.email || null,
        fecha_nacimiento: data.fecha_nacimiento || null,
      } as never)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row as PacienteRow;
  });

export const actualizarPaciente = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(actualizarPacienteSchema.parse)
  .handler(async ({ context, data }) => {
    // Neither medico_id nor tenant_id are accepted from the client; RLS also
    // scopes the UPDATE to rows in the caller's tenant.
    const { resolveContextoConsultorio } = await import("./clinica-tenant.server");
    const { medicoId } = await resolveContextoConsultorio(context.supabase, context.userId);
    const { id, ...fields } = data;
    const { data: row, error } = await context.supabase
      .from("pacientes")
      .update({
        nombres: fields.nombres,
        apellidos: fields.apellidos,
        documento_identidad: fields.documento_identidad || null,
        telefono: fields.telefono || null,
        email: fields.email || null,
        fecha_nacimiento: fields.fecha_nacimiento || null,
      })
      .eq("id", id)
      .eq("medico_id", medicoId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row as PacienteRow;
  });

export const eliminarPaciente = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(eliminarPacienteSchema.parse)
  .handler(async ({ context, data }) => {
    const { resolveMedicoTitular, pacienteTieneRegistros, citaTieneRegistros } = await import("./clinica-tenant.server");
    const { medicoId } = await resolveMedicoTitular(context.supabase, context.userId);

    // No se destruye historia clínica, recetas, órdenes ni audio (NTS 139, Ley 29733).
    if (await pacienteTieneRegistros(context.supabase, data.id)) {
      throw new Error(
        "Este paciente tiene historia clínica, recetas, órdenes o audio registrados y no se puede eliminar. Si ya no lo atiendes, déjalo sin citas futuras.",
      );
    }

    const { data: citasPac, error: citasLeer } = await context.supabase
      .from("citas")
      .select("id")
      .eq("paciente_id", data.id)
      .eq("medico_id", medicoId);
    if (citasLeer) throw new Error("No se pudo verificar las citas del paciente.");
    for (const c of citasPac ?? []) {
      if (await citaTieneRegistros(context.supabase, c.id)) {
        throw new Error("El paciente tiene citas con pagos o atención registrados y no se puede eliminar.");
      }
    }

    // Citas reference the paciente, so remove them first (no cascade in DB).
    const { error: citasError } = await context.supabase
      .from("citas")
      .delete()
      .eq("paciente_id", data.id)
      .eq("medico_id", medicoId);
    if (citasError) throw new Error("No se pudieron eliminar las citas del paciente.");

    const { data: borrados, error } = await context.supabase
      .from("pacientes")
      .delete()
      .eq("id", data.id)
      .eq("medico_id", medicoId)
      .select("id");
    if (error) throw new Error("No se pudo eliminar el paciente.");
    if (!borrados || borrados.length === 0) {
      throw new Error("No se encontró el paciente o no tienes permiso para eliminarlo.");
    }
    return { id: data.id };
  });
