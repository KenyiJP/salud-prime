import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  actualizarLandingConfig,
  actualizarLandingServicio,
  actualizarLandingTestimonio,
  actualizarTenantSlug,
  crearLandingServicio,
  crearLandingTestimonio,
  eliminarLandingServicio,
  eliminarLandingTestimonio,
  getLandingConfig,
  getLandingServicios,
  getLandingTestimonios,
  getTenantSlug,
  reordenarLandingServicios,
  reordenarLandingTestimonios,
  verificarSlugDisponible,
} from "./landing-marca.functions";
import type {
  LandingConfigInput,
  LandingServicioInput,
  LandingTestimonioInput,
} from "./landing-marca-schemas";

const KEYS = {
  config: ["landing-config"] as const,
  servicios: ["landing-servicios"] as const,
  testimonios: ["landing-testimonios"] as const,
  slug: ["tenant-slug"] as const,
};

export function landingConfigQuery() {
  return { queryKey: KEYS.config, queryFn: () => getLandingConfig() };
}
export function useLandingConfigQuery() {
  return useQuery(landingConfigQuery());
}

export function useActualizarLandingConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: LandingConfigInput) => actualizarLandingConfig({ data: input }),
    onSuccess: (data) => {
      queryClient.setQueryData(KEYS.config, data);
      toast.success("Cambios guardados.");
    },
    onError: (error: Error) => toast.error(error.message || "No se pudo guardar."),
  });
}

export function landingServiciosQuery() {
  return { queryKey: KEYS.servicios, queryFn: () => getLandingServicios() };
}
export function useLandingServiciosQuery() {
  return useQuery(landingServiciosQuery());
}

export function useCrearLandingServicio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: LandingServicioInput) => crearLandingServicio({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.servicios });
      toast.success("Servicio agregado.");
    },
    onError: (error: Error) => toast.error(error.message || "No se pudo crear el servicio."),
  });
}

export function useActualizarLandingServicio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; cambios: Partial<LandingServicioInput> }) =>
      actualizarLandingServicio({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.servicios });
    },
    onError: (error: Error) =>
      toast.error(error.message || "No se pudo actualizar el servicio."),
  });
}

export function useEliminarLandingServicio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => eliminarLandingServicio({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.servicios });
      toast.success("Servicio eliminado.");
    },
    onError: (error: Error) => toast.error(error.message || "No se pudo eliminar."),
  });
}

export function useReordenarLandingServicios() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => reordenarLandingServicios({ data: { ids } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.servicios });
    },
    onError: (error: Error) => toast.error(error.message || "No se pudo reordenar."),
  });
}

export function landingTestimoniosQuery() {
  return { queryKey: KEYS.testimonios, queryFn: () => getLandingTestimonios() };
}
export function useLandingTestimoniosQuery() {
  return useQuery(landingTestimoniosQuery());
}

export function useCrearLandingTestimonio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: LandingTestimonioInput) => crearLandingTestimonio({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.testimonios });
      toast.success("Testimonio agregado.");
    },
    onError: (error: Error) => toast.error(error.message || "No se pudo crear el testimonio."),
  });
}

export function useActualizarLandingTestimonio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; cambios: Partial<LandingTestimonioInput> }) =>
      actualizarLandingTestimonio({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.testimonios });
    },
    onError: (error: Error) =>
      toast.error(error.message || "No se pudo actualizar el testimonio."),
  });
}

export function useEliminarLandingTestimonio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => eliminarLandingTestimonio({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.testimonios });
      toast.success("Testimonio eliminado.");
    },
    onError: (error: Error) => toast.error(error.message || "No se pudo eliminar."),
  });
}

export function useReordenarLandingTestimonios() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => reordenarLandingTestimonios({ data: { ids } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.testimonios });
    },
    onError: (error: Error) => toast.error(error.message || "No se pudo reordenar."),
  });
}

export function tenantSlugQuery() {
  return { queryKey: KEYS.slug, queryFn: () => getTenantSlug() };
}
export function useTenantSlugQuery() {
  return useQuery(tenantSlugQuery());
}

export function useVerificarSlugDisponible() {
  return useMutation({
    mutationFn: (slug: string) => verificarSlugDisponible({ data: { slug } }),
  });
}

export function useActualizarTenantSlug() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => actualizarTenantSlug({ data: { slug } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.slug });
      toast.success("Slug actualizado. Tu web pública usará esta dirección.");
    },
    onError: (error: Error) => toast.error(error.message || "No se pudo actualizar el slug."),
  });
}
