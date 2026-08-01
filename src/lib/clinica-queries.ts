import { queryOptions } from "@tanstack/react-query";
import { getCitas, getMedicos, getPacientes } from "./clinica.functions";

export const medicosQuery = () =>
  queryOptions({ queryKey: ["medicos"], queryFn: () => getMedicos() });

export const pacientesQuery = () =>
  queryOptions({ queryKey: ["pacientes"], queryFn: () => getPacientes() });

export const citasQuery = () =>
  queryOptions({ queryKey: ["citas"], queryFn: () => getCitas() });

export function nombreCompleto(p?: { nombres: string; apellidos: string } | null) {
  return p ? `${p.nombres} ${p.apellidos}` : "—";
}

export function horaCorta(iso: string) {
  return new Date(iso).toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function fechaCorta(iso: string) {
  return new Date(iso).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
  });
}

export function edad(fecha: string | null) {
  if (!fecha) return "—";
  const d = new Date(fecha);
  const diff = Date.now() - d.getTime();
  return `${Math.floor(diff / (365.25 * 24 * 3600 * 1000))} a`;
}

export function esHoy(iso: string) {
  const a = new Date(iso);
  const b = new Date();
  return a.toDateString() === b.toDateString();
}
