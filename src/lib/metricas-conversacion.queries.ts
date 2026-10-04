import { useQuery } from "@tanstack/react-query";
import {
  getEsAdminPlataforma,
  getMetricasAgenteClinico,
  getMetricasComercial,
} from "./metricas-conversacion.functions";
import type { RangoMetricas } from "./metricas-conversacion-schemas";

const KEYS = {
  clinico: (r: RangoMetricas) => ["metricas-agente-clinico", r.desde, r.hasta] as const,
  comercial: (r: RangoMetricas) => ["metricas-comercial", r.desde, r.hasta] as const,
  adminPlataforma: ["es-admin-plataforma"] as const,
};

export function useMetricasAgenteClinicoQuery(rango: RangoMetricas) {
  return useQuery({
    queryKey: KEYS.clinico(rango),
    queryFn: () => getMetricasAgenteClinico({ data: rango }),
    staleTime: 60_000,
  });
}

export function useMetricasComercialQuery(rango: RangoMetricas, habilitado: boolean) {
  return useQuery({
    queryKey: KEYS.comercial(rango),
    queryFn: () => getMetricasComercial({ data: rango }),
    enabled: habilitado,
    staleTime: 60_000,
  });
}

export function useEsAdminPlataformaQuery() {
  return useQuery({
    queryKey: KEYS.adminPlataforma,
    queryFn: () => getEsAdminPlataforma(),
    staleTime: 10 * 60_000,
  });
}
