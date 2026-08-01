import { createServerFn } from "@tanstack/react-start";

export type Medico = {
  id: string;
  nombres: string;
  apellidos: string;
  especialidad: string;
  cmp: string | null;
};

export type PacienteRow = {
  id: string;
  nombres: string;
  apellidos: string;
  dni: string | null;
  fecha_nacimiento: string | null;
  sexo: string | null;
  telefono: string | null;
  medicos: { nombres: string; apellidos: string; especialidad: string } | null;
};

export type CitaRow = {
  id: string;
  inicio: string;
  duracion_min: number;
  motivo: string | null;
  estado: string;
  pacientes: { nombres: string; apellidos: string; dni: string | null } | null;
  medicos: { nombres: string; apellidos: string; especialidad: string } | null;
};

export const getMedicos = createServerFn({ method: "GET" }).handler(async () => {
  const { createPublicClient } = await import("./clinica.server");
  const { data, error } = await createPublicClient()
    .from("medicos")
    .select("id, nombres, apellidos, especialidad, cmp")
    .order("apellidos");
  if (error) throw new Error(error.message);
  return (data ?? []) as Medico[];
});

export const getPacientes = createServerFn({ method: "GET" }).handler(async () => {
  const { createPublicClient } = await import("./clinica.server");
  const { data, error } = await createPublicClient()
    .from("pacientes")
    .select(
      "id, nombres, apellidos, dni, fecha_nacimiento, sexo, telefono, medicos(nombres, apellidos, especialidad)",
    )
    .order("apellidos");
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as PacienteRow[];
});

export const getCitas = createServerFn({ method: "GET" }).handler(async () => {
  const { createPublicClient } = await import("./clinica.server");
  const { data, error } = await createPublicClient()
    .from("citas")
    .select(
      "id, inicio, duracion_min, motivo, estado, pacientes(nombres, apellidos, dni), medicos(nombres, apellidos, especialidad)",
    )
    .order("inicio");
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as CitaRow[];
});
