import { supabase } from "@/integrations/supabase/client";
import { MAX_ARCHIVO_BYTES, TIPOS_IMAGEN_PERMITIDOS } from "./landing-marca-schemas";

/**
 * Sube una imagen al bucket público `landing-media` bajo
 * `{tenant_id}/{carpeta}/{timestamp}-{nombre}`. RLS en `storage.objects` solo
 * deja escribir dentro de la carpeta del propio tenant (primer segmento de la
 * ruta), así que `tenantId` siempre viene del contexto resuelto en servidor,
 * nunca de un valor libre del formulario.
 */
export async function subirImagenLanding(
  tenantId: string,
  carpeta: "identidad" | "portada" | "galeria",
  archivo: File,
): Promise<string> {
  if (!TIPOS_IMAGEN_PERMITIDOS.includes(archivo.type as (typeof TIPOS_IMAGEN_PERMITIDOS)[number])) {
    throw new Error("Usa una imagen PNG, JPEG o WEBP.");
  }
  if (archivo.size > MAX_ARCHIVO_BYTES) {
    throw new Error("La imagen no debe pasar de 5 MB.");
  }

  const extension = archivo.name.split(".").pop()?.toLowerCase() || "png";
  const nombreSeguro = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
  const ruta = `${tenantId}/${carpeta}/${nombreSeguro}`;

  const { error } = await supabase.storage.from("landing-media").upload(ruta, archivo, {
    upsert: false,
    contentType: archivo.type,
  });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from("landing-media").getPublicUrl(ruta);
  return data.publicUrl;
}

/** Borra un archivo del bucket a partir de su URL pública, si aplica. */
export async function eliminarImagenLanding(url: string | null): Promise<void> {
  if (!url) return;
  const marcador = "/landing-media/";
  const idx = url.indexOf(marcador);
  if (idx === -1) return;
  const ruta = decodeURIComponent(url.slice(idx + marcador.length));
  await supabase.storage.from("landing-media").remove([ruta]);
}
