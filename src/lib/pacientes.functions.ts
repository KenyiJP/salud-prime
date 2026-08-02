import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  actualizarPacienteSchema,
  nuevoPacienteSchema,
  type PacienteRow,
} from "./clinica-schemas";

export const getPacientes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { resolveMedicoId } = await import("./clinica-tenant.server");
    const medicoId = await resolveMedicoId(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("pacientes")
      .select("*")
      .eq("medico_id", medicoId)
      .order("nombre_completo");
    if (error) throw new Error(error.message);
    return (data ?? []) as PacienteRow[];
  });

export const crearPaciente = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(nuevoPacienteSchema.parse)
  .handler(async ({ context, data }) => {
    const { resolveMedicoId } = await import("./clinica-tenant.server");
    const medicoId = await resolveMedicoId(context.supabase, context.userId);
    const { data: row, error } = await context.supabase
      .from("pacientes")
      .insert({
        medico_id: medicoId,
        nombre_completo: data.nombre_completo,
        dni: data.dni || null,
        telefono_whatsapp: data.telefono_whatsapp,
        email: data.email || null,
        antecedentes_alergias: data.antecedentes_alergias || null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row as PacienteRow;
  });

export const actualizarPaciente = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(actualizarPacienteSchema.parse)
  .handler(async ({ context, data }) => {
    // medico_id is never accepted from the client and is not part of this
    // update payload — RLS also scopes the UPDATE to rows already owned by
    // the authenticated médico, so a patient can never be reassigned.
    const { id, ...fields } = data;
    const { data: row, error } = await context.supabase
      .from("pacientes")
      .update({
        nombre_completo: fields.nombre_completo,
        dni: fields.dni || null,
        telefono_whatsapp: fields.telefono_whatsapp,
        email: fields.email || null,
        antecedentes_alergias: fields.antecedentes_alergias || null,
      })
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row as PacienteRow;
  });
