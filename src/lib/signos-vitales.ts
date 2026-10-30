// Signos vitales de enfermería (Día 29, Etapa 3). Valida y normaliza EXACTAMENTE
// lo que valida la RPC `atencion_registrar_signos_vitales` (rangos y enteros);
// la base sigue siendo la barrera real. Sin React ni red: se prueba con
// `node src/lib/signos-vitales.test.mjs` (Node >= 22.18).

export type CampoSigno =
  | "presion_arterial_sistolica"
  | "presion_arterial_diastolica"
  | "frecuencia_cardiaca"
  | "frecuencia_respiratoria"
  | "temperatura"
  | "saturacion_oxigeno"
  | "peso"
  | "talla"
  | "perimetro_abdominal";

export const CAMPOS_SIGNOS: ReadonlyArray<{
  clave: CampoSigno;
  etiqueta: string;
  unidad: string;
  min: number;
  max: number;
  entero: boolean;
}> = [
  { clave: "presion_arterial_sistolica", etiqueta: "PA sistólica", unidad: "mmHg", min: 50, max: 300, entero: true },
  { clave: "presion_arterial_diastolica", etiqueta: "PA diastólica", unidad: "mmHg", min: 20, max: 200, entero: true },
  { clave: "frecuencia_cardiaca", etiqueta: "Frecuencia cardíaca", unidad: "lpm", min: 20, max: 250, entero: true },
  { clave: "frecuencia_respiratoria", etiqueta: "Frecuencia respiratoria", unidad: "rpm", min: 4, max: 80, entero: true },
  { clave: "temperatura", etiqueta: "Temperatura", unidad: "°C", min: 30, max: 45, entero: false },
  { clave: "saturacion_oxigeno", etiqueta: "Saturación de O₂", unidad: "%", min: 50, max: 100, entero: true },
  { clave: "peso", etiqueta: "Peso", unidad: "kg", min: 0.5, max: 400, entero: false },
  { clave: "talla", etiqueta: "Talla", unidad: "cm", min: 30, max: 260, entero: false },
  { clave: "perimetro_abdominal", etiqueta: "Perímetro abdominal", unidad: "cm", min: 20, max: 250, entero: false },
];

/** Acepta coma decimal; vacío o inválido → null. */
export function aNumero(texto: string): number | null {
  const t = texto.trim().replace(",", ".");
  if (t === "") return null;
  if (!/^\d+(\.\d+)?$/.test(t)) return Number.NaN;
  return Number(t);
}

/**
 * La base guarda la talla en METROS (numeric(4,2): 170 desbordaría la columna).
 * El formulario pide centímetros; un valor ≤ 3 se interpreta como metros.
 */
export function tallaAMetros(valor: number): number {
  const m = valor > 3 ? valor / 100 : valor;
  return Math.round(m * 100) / 100;
}

export type ResultadoSignos =
  | { ok: true; datos: Partial<Record<CampoSigno, number>> }
  | { ok: false; errores: Partial<Record<CampoSigno | "general", string>> };

export function prepararSignos(entrada: Partial<Record<CampoSigno, string>>): ResultadoSignos {
  const datos: Partial<Record<CampoSigno, number>> = {};
  const errores: Partial<Record<CampoSigno | "general", string>> = {};

  for (const c of CAMPOS_SIGNOS) {
    const n = aNumero(entrada[c.clave] ?? "");
    if (n === null) continue;
    if (Number.isNaN(n)) {
      errores[c.clave] = "Solo números.";
      continue;
    }
    if (c.clave === "talla") {
      const m = tallaAMetros(n);
      if (m < 0.3 || m > 2.6) errores.talla = "Talla fuera de rango (30–260 cm).";
      else datos.talla = m;
      continue;
    }
    if (c.entero && !Number.isInteger(n)) {
      errores[c.clave] = "Debe ser un número entero.";
      continue;
    }
    if (n < c.min || n > c.max) {
      errores[c.clave] = `Fuera de rango (${c.min}–${c.max} ${c.unidad}).`;
      continue;
    }
    datos[c.clave] = c.clave === "temperatura" ? Math.round(n * 10) / 10 : n;
  }

  const s = datos.presion_arterial_sistolica;
  const d = datos.presion_arterial_diastolica;
  if (s !== undefined && d !== undefined && d >= s) {
    errores.presion_arterial_diastolica = "La diastólica debe ser menor que la sistólica.";
  }
  // El IMC se guarda en numeric(4,1) (máx. 999,9): una relación peso/talla absurda
  // desbordaría el campo dentro de la RPC. Se rechaza antes con un mensaje claro.
  if (datos.peso !== undefined && datos.talla !== undefined) {
    const imc = datos.peso / (datos.talla * datos.talla);
    if (imc > 120) errores.talla = "Peso y talla no son coherentes entre sí. Revísalos (talla en cm).";
  }
  // Si solo llega una presión, la RPC la compara con la ya guardada en la atención.
  if (Object.keys(errores).length === 0 && Object.keys(datos).length === 0) {
    errores.general = "Ingresa al menos un signo vital.";
  }
  return Object.keys(errores).length > 0 ? { ok: false, errores } : { ok: true, datos };
}

export const MENSAJE_SIGNOS: Record<string, string> = {
  no_autorizado: "Tu rol no puede registrar signos vitales en este consultorio.",
  cita_no_encontrada: "No se encontró la cita.",
  atencion_cerrada: "La atención ya fue firmada o anulada; no admite cambios.",
  dato_invalido: "Algún valor está fuera de rango fisiológico. Revísalo.",
};

export function mensajeSignos(codigo: string | undefined | null): string {
  return (codigo && MENSAJE_SIGNOS[codigo]) || "No se pudo guardar. Inténtalo de nuevo.";
}
