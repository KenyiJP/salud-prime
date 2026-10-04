import { z } from "zod";

// ---------------------------------------------------------------------------
// Día 25 — Métricas de conversión de los dos agentes de WhatsApp.
//
// Dos canales aislados a propósito (ver migración
// `20261004200000_dia25_metricas_conversacion.sql`):
//   a) Agente clínico: métricas del consultorio, filtradas por RLS al tenant.
//   b) Bot comercial MediSuite: métricas de la plataforma, solo administradores
//      de plataforma. Estos tipos NO comparten forma con los clínicos para que
//      ningún componente pueda mezclar un canal con el otro por accidente.
// ---------------------------------------------------------------------------

const fechaIso = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida (AAAA-MM-DD).");

export const rangoMetricasSchema = z
  .object({ desde: fechaIso, hasta: fechaIso })
  .refine((v) => v.desde <= v.hasta, { message: "La fecha inicial no puede ser posterior a la final." });

export type RangoMetricas = z.infer<typeof rangoMetricasSchema>;

/** `null` = sin datos suficientes (distinto de 0 %: 0 % es un resultado real). */
export type Porcentaje = number | null;

export interface PuntoSerieClinica {
  dia: string;
  chats_iniciados: number;
  citas_confirmadas: number;
  tiempo_respuesta_promedio_seg: number | null;
}

/**
 * Ingresos atribuidos al agente (suma de tarifas de las citas confirmadas).
 * `citas_sin_tarifa` es un estado válido: el médico no publicó precio para ese
 * tipo de consulta, no es un error ni un dato pendiente.
 */
export interface IngresosAtribuidosClinico {
  monto_pen: number;
  citas_con_tarifa: number;
  citas_sin_tarifa: number;
}

/** `pct = null` cuando no hay horarios configurados o chats que evaluar. */
export interface FueraHorarioClinico {
  chats_fuera_horario: number;
  chats_evaluados: number;
  pct: Porcentaje;
}

export interface PeriodoAnteriorClinico {
  desde: string;
  hasta: string;
  chats_iniciados: number;
  citas_confirmadas: number;
  tasa_conversion_pct: Porcentaje;
  tasa_abandono_pct: Porcentaje;
  tiempo_respuesta_promedio_seg: number | null;
  ingresos_monto_pen: number;
}

export interface MetricasAgenteClinico {
  desde: string;
  hasta: string;
  chats_iniciados: number;
  citas_solicitadas: number;
  citas_confirmadas: number;
  citas_canceladas: number;
  escaladas_humano: number;
  mensajes_paciente: number;
  mensajes_ia: number;
  tasa_conversion_pct: Porcentaje;
  tasa_abandono_pct: Porcentaje;
  tiempo_respuesta_promedio_seg: number | null;
  serie_diaria: PuntoSerieClinica[];
  // Día 25-B. Opcionales: el RPC remoto puede no devolverlos hasta aplicar la migración.
  ingresos_atribuidos?: IngresosAtribuidosClinico | null;
  fuera_horario?: FueraHorarioClinico | null;
  periodo_anterior?: PeriodoAnteriorClinico | null;
}

export interface PuntoSerieComercial {
  dia: string;
  chats_iniciados: number;
  demos_agendadas: number;
}

export interface PeriodoAnteriorComercial {
  desde: string;
  hasta: string;
  chats_iniciados: number;
  demos_agendadas: number;
  escaladas_humano?: number;
  mensajes_lead?: number;
  mensajes_ia?: number;
  tasa_demo_pct: Porcentaje;
  tasa_abandono_pct: Porcentaje;
  tiempo_respuesta_promedio_seg: number | null;
}

export interface MetricasComercialOk {
  ok: true;
  desde: string;
  hasta: string;
  chats_iniciados: number;
  demos_agendadas: number;
  escaladas_humano: number;
  mensajes_lead: number;
  mensajes_ia: number;
  tasa_demo_pct: Porcentaje;
  tasa_abandono_pct: Porcentaje;
  tiempo_respuesta_promedio_seg: number | null;
  funnel_leads: Record<string, number>;
  serie_diaria: PuntoSerieComercial[];
  // Día 25-B. Opcional: ver nota en MetricasAgenteClinico.
  periodo_anterior?: PeriodoAnteriorComercial | null;
}

export interface MetricasComercialRechazo {
  ok: false;
  error_codigo: string;
  error_mensaje: string;
}

export type MetricasComercialResultado = MetricasComercialOk | MetricasComercialRechazo;
