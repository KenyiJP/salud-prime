import { queryOptions, useMutation, useQuery } from "@tanstack/react-query";
import {
  getSlotsDisponiblesServerFn,
  getTiposConsultaPublicosServerFn,
  registrarReservaWebServerFn,
  registrarReclamacionWebServerFn,
} from "./landing-marca.server";
import type {
  ObtenerSlotsInput,
  RegistrarReservaWebInput,
  RegistrarReclamacionWebInput,
} from "./landing-marca-schemas";

/**
 * Hooks del flujo de reserva pública (Día 18b). Viven en un archivo propio
 * (no en `landing-marca.queries.ts`, que ya es el de administración del
 * Panel de Marca del Día 16) porque estos corren en el navegador de un
 * visitante anónimo sin JWT de MediSuite.
 */

export const tiposConsultaPublicosQuery = (slug: string) =>
  queryOptions({
    queryKey: ["reserva-publica", "tipos-consulta", slug] as const,
    queryFn: () => getTiposConsultaPublicosServerFn({ data: { slug } }),
    staleTime: 5 * 60 * 1000,
  });

export function useTiposConsultaPublicos(slug: string) {
  return useQuery(tiposConsultaPublicosQuery(slug));
}

export const slotsDisponiblesQuery = (input: ObtenerSlotsInput) =>
  queryOptions({
    queryKey: [
      "reserva-publica",
      "slots",
      input.slug,
      input.fecha,
      input.tipo_consulta_id ?? null,
    ] as const,
    queryFn: () => getSlotsDisponiblesServerFn({ data: input }),
    staleTime: 30 * 1000,
  });

export function useSlotsDisponibles(input: ObtenerSlotsInput, enabled: boolean) {
  return useQuery({ ...slotsDisponiblesQuery(input), enabled });
}

export function useRegistrarReservaWeb() {
  return useMutation({
    mutationFn: (input: RegistrarReservaWebInput) => registrarReservaWebServerFn({ data: input }),
  });
}

/** Formulario público del Libro de Reclamaciones (Día 21B, Indecopi). */
export function useRegistrarReclamacionWeb() {
  return useMutation({
    mutationFn: (input: RegistrarReclamacionWebInput) =>
      registrarReclamacionWebServerFn({ data: input }),
  });
}
