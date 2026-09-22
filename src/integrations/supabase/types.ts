export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      atencion_adendas: {
        Row: {
          atencion_id: string
          contenido: string
          created_at: string
          id: string
          medico_id: string
          tenant_id: string
          tipo_adenda: string
        }
        Insert: {
          atencion_id: string
          contenido: string
          created_at?: string
          id?: string
          medico_id: string
          tenant_id: string
          tipo_adenda?: string
        }
        Update: {
          atencion_id?: string
          contenido?: string
          created_at?: string
          id?: string
          medico_id?: string
          tenant_id?: string
          tipo_adenda?: string
        }
        Relationships: [
          {
            foreignKeyName: "atencion_adendas_atencion_id_fkey"
            columns: ["atencion_id"]
            isOneToOne: false
            referencedRelation: "atenciones_medicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atencion_adendas_medico_id_fkey"
            columns: ["medico_id"]
            isOneToOne: false
            referencedRelation: "medicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atencion_adendas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      atenciones_medicas: {
        Row: {
          antecedentes_alergicos: string | null
          antecedentes_familiares: string | null
          antecedentes_patologicos: string | null
          antecedentes_personales: string | null
          antecedentes_quirurgicos: string | null
          campos_especialidad: Json
          cita_id: string | null
          created_at: string
          curso_enfermedad: string | null
          diagnosticos: Json
          estado: string
          estado_general: string | null
          estado_nutricional: string | null
          examen_general: string | null
          examen_regional: Json
          fecha_atencion: string
          firma_digital_url: string | null
          firma_hash: string | null
          firmado_at: string | null
          forma_inicio: string | null
          frecuencia_cardiaca: number | null
          frecuencia_respiratoria: number | null
          funciones_biologicas: Json
          hora_atencion: string
          id: string
          imc: number | null
          indicaciones_generales: string | null
          medicacion_habitual: string | null
          medico_id: string
          motivo_anulacion: string | null
          motivo_consulta: string | null
          numero_atencion: string | null
          paciente_id: string
          perimetro_abdominal: number | null
          peso: number | null
          plan_trabajo: string | null
          plantilla_id: string | null
          plantilla_version: number | null
          presion_arterial_diastolica: number | null
          presion_arterial_sistolica: number | null
          proximo_control: string | null
          relato_cronologico: string | null
          saturacion_oxigeno: number | null
          talla: number | null
          temperatura: number | null
          tenant_id: string
          tiempo_enfermedad: string | null
          tipo_atencion: string
          tratamiento: string | null
          updated_at: string
        }
        Insert: {
          antecedentes_alergicos?: string | null
          antecedentes_familiares?: string | null
          antecedentes_patologicos?: string | null
          antecedentes_personales?: string | null
          antecedentes_quirurgicos?: string | null
          campos_especialidad?: Json
          cita_id?: string | null
          created_at?: string
          curso_enfermedad?: string | null
          diagnosticos?: Json
          estado?: string
          estado_general?: string | null
          estado_nutricional?: string | null
          examen_general?: string | null
          examen_regional?: Json
          fecha_atencion?: string
          firma_digital_url?: string | null
          firma_hash?: string | null
          firmado_at?: string | null
          forma_inicio?: string | null
          frecuencia_cardiaca?: number | null
          frecuencia_respiratoria?: number | null
          funciones_biologicas?: Json
          hora_atencion?: string
          id?: string
          imc?: number | null
          indicaciones_generales?: string | null
          medicacion_habitual?: string | null
          medico_id: string
          motivo_anulacion?: string | null
          motivo_consulta?: string | null
          numero_atencion?: string | null
          paciente_id: string
          perimetro_abdominal?: number | null
          peso?: number | null
          plan_trabajo?: string | null
          plantilla_id?: string | null
          plantilla_version?: number | null
          presion_arterial_diastolica?: number | null
          presion_arterial_sistolica?: number | null
          proximo_control?: string | null
          relato_cronologico?: string | null
          saturacion_oxigeno?: number | null
          talla?: number | null
          temperatura?: number | null
          tenant_id: string
          tiempo_enfermedad?: string | null
          tipo_atencion?: string
          tratamiento?: string | null
          updated_at?: string
        }
        Update: {
          antecedentes_alergicos?: string | null
          antecedentes_familiares?: string | null
          antecedentes_patologicos?: string | null
          antecedentes_personales?: string | null
          antecedentes_quirurgicos?: string | null
          campos_especialidad?: Json
          cita_id?: string | null
          created_at?: string
          curso_enfermedad?: string | null
          diagnosticos?: Json
          estado?: string
          estado_general?: string | null
          estado_nutricional?: string | null
          examen_general?: string | null
          examen_regional?: Json
          fecha_atencion?: string
          firma_digital_url?: string | null
          firma_hash?: string | null
          firmado_at?: string | null
          forma_inicio?: string | null
          frecuencia_cardiaca?: number | null
          frecuencia_respiratoria?: number | null
          funciones_biologicas?: Json
          hora_atencion?: string
          id?: string
          imc?: number | null
          indicaciones_generales?: string | null
          medicacion_habitual?: string | null
          medico_id?: string
          motivo_anulacion?: string | null
          motivo_consulta?: string | null
          numero_atencion?: string | null
          paciente_id?: string
          perimetro_abdominal?: number | null
          peso?: number | null
          plan_trabajo?: string | null
          plantilla_id?: string | null
          plantilla_version?: number | null
          presion_arterial_diastolica?: number | null
          presion_arterial_sistolica?: number | null
          proximo_control?: string | null
          relato_cronologico?: string | null
          saturacion_oxigeno?: number | null
          talla?: number | null
          temperatura?: number | null
          tenant_id?: string
          tiempo_enfermedad?: string | null
          tipo_atencion?: string
          tratamiento?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "atenciones_medicas_cita_id_fkey"
            columns: ["cita_id"]
            isOneToOne: false
            referencedRelation: "citas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atenciones_medicas_medico_id_fkey"
            columns: ["medico_id"]
            isOneToOne: false
            referencedRelation: "medicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atenciones_medicas_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atenciones_medicas_plantilla_id_fkey"
            columns: ["plantilla_id"]
            isOneToOne: false
            referencedRelation: "plantillas_especialidad"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atenciones_medicas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      biologicos_categorias: {
        Row: {
          codigo_origen: string
          id: number
          nombre: string
          requiere_cadena_frio: boolean
          tipo_origen: string | null
        }
        Insert: {
          codigo_origen: string
          id?: never
          nombre: string
          requiere_cadena_frio: boolean
          tipo_origen?: string | null
        }
        Update: {
          codigo_origen?: string
          id?: never
          nombre?: string
          requiere_cadena_frio?: boolean
          tipo_origen?: string | null
        }
        Relationships: []
      }
      biologicos_productos: {
        Row: {
          categoria_id: number
          codigo_origen: string
          condicion_almacenamiento: string | null
          created_at: string
          estado: string
          id: string
          nombre_comercial: string
          nombre_comercial_crudo: string | null
          origen: string
          principio_activo_id: string | null
          registros_sanitarios: number
          updated_at: string
          via_sugerida: string | null
        }
        Insert: {
          categoria_id: number
          codigo_origen: string
          condicion_almacenamiento?: string | null
          created_at?: string
          estado?: string
          id?: string
          nombre_comercial: string
          nombre_comercial_crudo?: string | null
          origen?: string
          principio_activo_id?: string | null
          registros_sanitarios?: number
          updated_at?: string
          via_sugerida?: string | null
        }
        Update: {
          categoria_id?: number
          codigo_origen?: string
          condicion_almacenamiento?: string | null
          created_at?: string
          estado?: string
          id?: string
          nombre_comercial?: string
          nombre_comercial_crudo?: string | null
          origen?: string
          principio_activo_id?: string | null
          registros_sanitarios?: number
          updated_at?: string
          via_sugerida?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "biologicos_productos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "biologicos_categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "biologicos_productos_principio_activo_id_fkey"
            columns: ["principio_activo_id"]
            isOneToOne: false
            referencedRelation: "principios_activos"
            referencedColumns: ["id"]
          },
        ]
      }
      bloqueos_horario: {
        Row: {
          created_at: string | null
          fecha_fin: string
          fecha_inicio: string
          id: string
          medico_id: string
          motivo: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          fecha_fin: string
          fecha_inicio: string
          id?: string
          medico_id: string
          motivo?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          fecha_fin?: string
          fecha_inicio?: string
          id?: string
          medico_id?: string
          motivo?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bloqueos_horario_medico_id_fkey"
            columns: ["medico_id"]
            isOneToOne: false
            referencedRelation: "medicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bloqueos_horario_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      citas: {
        Row: {
          aseguradora_nombre: string | null
          aseguradora_tipo: string | null
          created_at: string
          estado: string
          estado_pago_reserva: string
          fecha_hora: string
          google_event_id: string | null
          id: string
          medico_id: string
          monto_esperado: number | null
          motivo: string | null
          origen_reserva: string
          paciente_id: string
          pago_obligatorio: boolean
          reserva_comentario: string | null
          tenant_id: string
          tipo_consulta_id: string | null
          updated_at: string
        }
        Insert: {
          aseguradora_nombre?: string | null
          aseguradora_tipo?: string | null
          created_at?: string
          estado?: string
          estado_pago_reserva?: string
          fecha_hora: string
          google_event_id?: string | null
          id?: string
          medico_id: string
          monto_esperado?: number | null
          motivo?: string | null
          origen_reserva?: string
          paciente_id: string
          pago_obligatorio?: boolean
          reserva_comentario?: string | null
          tenant_id: string
          tipo_consulta_id?: string | null
          updated_at?: string
        }
        Update: {
          aseguradora_nombre?: string | null
          aseguradora_tipo?: string | null
          created_at?: string
          estado?: string
          estado_pago_reserva?: string
          fecha_hora?: string
          google_event_id?: string | null
          id?: string
          medico_id?: string
          monto_esperado?: number | null
          motivo?: string | null
          origen_reserva?: string
          paciente_id?: string
          pago_obligatorio?: boolean
          reserva_comentario?: string | null
          tenant_id?: string
          tipo_consulta_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "citas_medico_id_fkey"
            columns: ["medico_id"]
            isOneToOne: false
            referencedRelation: "medicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "citas_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "citas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "citas_tipo_consulta_id_fkey"
            columns: ["tipo_consulta_id"]
            isOneToOne: false
            referencedRelation: "tipos_consulta"
            referencedColumns: ["id"]
          },
        ]
      }
      culqi_eventos_procesados: {
        Row: {
          charge_id: string | null
          created_at: string
          detalle_error: string | null
          event_id: string
          id: string
          medico_id: string | null
          order_id: string | null
          payload: Json
          procesado_en: string | null
          referencia_id: string | null
          referencia_tipo: string | null
          resultado: string
          tipo_evento: string
        }
        Insert: {
          charge_id?: string | null
          created_at?: string
          detalle_error?: string | null
          event_id: string
          id?: string
          medico_id?: string | null
          order_id?: string | null
          payload: Json
          procesado_en?: string | null
          referencia_id?: string | null
          referencia_tipo?: string | null
          resultado?: string
          tipo_evento: string
        }
        Update: {
          charge_id?: string | null
          created_at?: string
          detalle_error?: string | null
          event_id?: string
          id?: string
          medico_id?: string | null
          order_id?: string | null
          payload?: Json
          procesado_en?: string | null
          referencia_id?: string | null
          referencia_tipo?: string | null
          resultado?: string
          tipo_evento?: string
        }
        Relationships: [
          {
            foreignKeyName: "culqi_eventos_procesados_medico_id_fkey"
            columns: ["medico_id"]
            isOneToOne: false
            referencedRelation: "medicos"
            referencedColumns: ["id"]
          },
        ]
      }
      estudios_imagen: {
        Row: {
          activo: boolean
          codigo: string
          created_at: string
          id: string
          instrucciones_preparacion: string | null
          lateralidad: string | null
          modalidad: string
          nombre_display: string
          nota_auditoria: string | null
          posicion: string | null
          rank_uso: number
          region: string | null
          requiere_contraste: boolean
          requiere_preparacion: boolean
          sinonimos: string | null
          updated_at: string
        }
        Insert: {
          activo?: boolean
          codigo: string
          created_at?: string
          id?: string
          instrucciones_preparacion?: string | null
          lateralidad?: string | null
          modalidad: string
          nombre_display: string
          nota_auditoria?: string | null
          posicion?: string | null
          rank_uso?: number
          region?: string | null
          requiere_contraste?: boolean
          requiere_preparacion?: boolean
          sinonimos?: string | null
          updated_at?: string
        }
        Update: {
          activo?: boolean
          codigo?: string
          created_at?: string
          id?: string
          instrucciones_preparacion?: string | null
          lateralidad?: string | null
          modalidad?: string
          nombre_display?: string
          nota_auditoria?: string | null
          posicion?: string | null
          rank_uso?: number
          region?: string | null
          requiere_contraste?: boolean
          requiere_preparacion?: boolean
          sinonimos?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      examenes_laboratorio: {
        Row: {
          activo: boolean
          clase: string | null
          componente: string | null
          created_at: string
          estado_loinc: string | null
          fecha_alta: string | null
          fuente: string
          id: string
          loinc_num: string
          muestra: string | null
          nombre_display: string
          nombre_en: string | null
          nombre_es: string | null
          nota_auditoria: string | null
          rank_loinc: number | null
          sinonimos: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          activo?: boolean
          clase?: string | null
          componente?: string | null
          created_at?: string
          estado_loinc?: string | null
          fecha_alta?: string | null
          fuente?: string
          id?: string
          loinc_num: string
          muestra?: string | null
          nombre_display: string
          nombre_en?: string | null
          nombre_es?: string | null
          nota_auditoria?: string | null
          rank_loinc?: number | null
          sinonimos?: string | null
          tipo?: string
          updated_at?: string
        }
        Update: {
          activo?: boolean
          clase?: string | null
          componente?: string | null
          created_at?: string
          estado_loinc?: string | null
          fecha_alta?: string | null
          fuente?: string
          id?: string
          loinc_num?: string
          muestra?: string | null
          nombre_display?: string
          nombre_en?: string | null
          nombre_es?: string | null
          nota_auditoria?: string | null
          rank_loinc?: number | null
          sinonimos?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      formas_farmaceuticas: {
        Row: {
          codigo: string
          id: number
          nombre: string
        }
        Insert: {
          codigo: string
          id?: never
          nombre: string
        }
        Update: {
          codigo?: string
          id?: never
          nombre?: string
        }
        Relationships: []
      }
      google_calendar_credenciales: {
        Row: {
          access_token_expira_en: string | null
          access_token_secret_id: string | null
          created_at: string
          integracion_id: string
          refresh_token_secret_id: string
          updated_at: string
        }
        Insert: {
          access_token_expira_en?: string | null
          access_token_secret_id?: string | null
          created_at?: string
          integracion_id: string
          refresh_token_secret_id: string
          updated_at?: string
        }
        Update: {
          access_token_expira_en?: string | null
          access_token_secret_id?: string | null
          created_at?: string
          integracion_id?: string
          refresh_token_secret_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "google_calendar_credenciales_integracion_id_fkey"
            columns: ["integracion_id"]
            isOneToOne: true
            referencedRelation: "google_calendar_integraciones"
            referencedColumns: ["id"]
          },
        ]
      }
      google_calendar_integraciones: {
        Row: {
          calendar_id: string
          created_at: string
          estado: string
          google_email: string
          id: string
          medico_id: string
          sync_habilitado: boolean
          tenant_id: string
          ultima_sincronizacion: string | null
          ultimo_error: string | null
          updated_at: string
          zona_horaria: string
        }
        Insert: {
          calendar_id?: string
          created_at?: string
          estado?: string
          google_email: string
          id?: string
          medico_id: string
          sync_habilitado?: boolean
          tenant_id: string
          ultima_sincronizacion?: string | null
          ultimo_error?: string | null
          updated_at?: string
          zona_horaria?: string
        }
        Update: {
          calendar_id?: string
          created_at?: string
          estado?: string
          google_email?: string
          id?: string
          medico_id?: string
          sync_habilitado?: boolean
          tenant_id?: string
          ultima_sincronizacion?: string | null
          ultimo_error?: string | null
          updated_at?: string
          zona_horaria?: string
        }
        Relationships: [
          {
            foreignKeyName: "google_calendar_integraciones_medico_id_fkey"
            columns: ["medico_id"]
            isOneToOne: true
            referencedRelation: "medicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "google_calendar_integraciones_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      google_calendar_sync_cola: {
        Row: {
          accion: string
          cita_id: string
          created_at: string
          estado: string
          id: string
          intentos: number
          medico_id: string
          procesado_en: string | null
          proximo_intento: string
          tenant_id: string
          ultimo_error: string | null
        }
        Insert: {
          accion: string
          cita_id: string
          created_at?: string
          estado?: string
          id?: string
          intentos?: number
          medico_id: string
          procesado_en?: string | null
          proximo_intento?: string
          tenant_id: string
          ultimo_error?: string | null
        }
        Update: {
          accion?: string
          cita_id?: string
          created_at?: string
          estado?: string
          id?: string
          intentos?: number
          medico_id?: string
          procesado_en?: string | null
          proximo_intento?: string
          tenant_id?: string
          ultimo_error?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "google_calendar_sync_cola_cita_id_fkey"
            columns: ["cita_id"]
            isOneToOne: false
            referencedRelation: "citas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "google_calendar_sync_cola_medico_id_fkey"
            columns: ["medico_id"]
            isOneToOne: false
            referencedRelation: "medicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "google_calendar_sync_cola_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      google_calendar_sync_log: {
        Row: {
          accion: string
          cita_id: string | null
          created_at: string
          detalle: string | null
          google_event_id: string | null
          id: string
          medico_id: string
          resultado: string
          tenant_id: string
        }
        Insert: {
          accion: string
          cita_id?: string | null
          created_at?: string
          detalle?: string | null
          google_event_id?: string | null
          id?: string
          medico_id: string
          resultado: string
          tenant_id: string
        }
        Update: {
          accion?: string
          cita_id?: string | null
          created_at?: string
          detalle?: string | null
          google_event_id?: string | null
          id?: string
          medico_id?: string
          resultado?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "google_calendar_sync_log_cita_id_fkey"
            columns: ["cita_id"]
            isOneToOne: false
            referencedRelation: "citas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "google_calendar_sync_log_medico_id_fkey"
            columns: ["medico_id"]
            isOneToOne: false
            referencedRelation: "medicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "google_calendar_sync_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      horarios_atencion: {
        Row: {
          activo: boolean | null
          created_at: string | null
          dia_semana: number
          duracion_slot_minutos: number
          hora_fin: string
          hora_inicio: string
          id: string
          medico_id: string
          tenant_id: string
        }
        Insert: {
          activo?: boolean | null
          created_at?: string | null
          dia_semana: number
          duracion_slot_minutos?: number
          hora_fin: string
          hora_inicio: string
          id?: string
          medico_id: string
          tenant_id: string
        }
        Update: {
          activo?: boolean | null
          created_at?: string | null
          dia_semana?: number
          duracion_slot_minutos?: number
          hora_fin?: string
          hora_inicio?: string
          id?: string
          medico_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "horarios_atencion_medico_id_fkey"
            columns: ["medico_id"]
            isOneToOne: false
            referencedRelation: "medicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "horarios_atencion_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_config: {
        Row: {
          animaciones_activas: boolean
          biografia: string | null
          color_fondo: string
          color_primario: string
          color_secundario: string
          created_at: string
          formacion_academica: string | null
          foto_medico_url: string | null
          galeria_fotos_urls: string[]
          id: string
          logo_url: string | null
          mapa_direccion: string | null
          mapa_lat: number | null
          mapa_lng: number | null
          mostrar_boton_reserva: boolean
          mostrar_boton_whatsapp: boolean
          mostrar_cmp: boolean
          mostrar_rne: boolean
          publicado: boolean
          tenant_id: string
          tipografia: string
          updated_at: string
          video_url: string | null
          whatsapp_numero: string | null
        }
        Insert: {
          animaciones_activas?: boolean
          biografia?: string | null
          color_fondo?: string
          color_primario?: string
          color_secundario?: string
          created_at?: string
          formacion_academica?: string | null
          foto_medico_url?: string | null
          galeria_fotos_urls?: string[]
          id?: string
          logo_url?: string | null
          mapa_direccion?: string | null
          mapa_lat?: number | null
          mapa_lng?: number | null
          mostrar_boton_reserva?: boolean
          mostrar_boton_whatsapp?: boolean
          mostrar_cmp?: boolean
          mostrar_rne?: boolean
          publicado?: boolean
          tenant_id: string
          tipografia?: string
          updated_at?: string
          video_url?: string | null
          whatsapp_numero?: string | null
        }
        Update: {
          animaciones_activas?: boolean
          biografia?: string | null
          color_fondo?: string
          color_primario?: string
          color_secundario?: string
          created_at?: string
          formacion_academica?: string | null
          foto_medico_url?: string | null
          galeria_fotos_urls?: string[]
          id?: string
          logo_url?: string | null
          mapa_direccion?: string | null
          mapa_lat?: number | null
          mapa_lng?: number | null
          mostrar_boton_reserva?: boolean
          mostrar_boton_whatsapp?: boolean
          mostrar_cmp?: boolean
          mostrar_rne?: boolean
          publicado?: boolean
          tenant_id?: string
          tipografia?: string
          updated_at?: string
          video_url?: string | null
          whatsapp_numero?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "landing_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_servicios: {
        Row: {
          activo: boolean
          created_at: string
          descripcion: string | null
          duracion_minutos: number | null
          id: string
          landing_config_id: string
          nombre: string
          orden: number
          precio: number | null
          tenant_id: string
          updated_at: string
          visible_en_landing: boolean
        }
        Insert: {
          activo?: boolean
          created_at?: string
          descripcion?: string | null
          duracion_minutos?: number | null
          id?: string
          landing_config_id: string
          nombre: string
          orden?: number
          precio?: number | null
          tenant_id: string
          updated_at?: string
          visible_en_landing?: boolean
        }
        Update: {
          activo?: boolean
          created_at?: string
          descripcion?: string | null
          duracion_minutos?: number | null
          id?: string
          landing_config_id?: string
          nombre?: string
          orden?: number
          precio?: number | null
          tenant_id?: string
          updated_at?: string
          visible_en_landing?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "landing_servicios_landing_config_id_fkey"
            columns: ["landing_config_id"]
            isOneToOne: false
            referencedRelation: "landing_config"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landing_servicios_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_testimonios: {
        Row: {
          aprobado: boolean
          calificacion: number | null
          contenido: string
          created_at: string
          id: string
          landing_config_id: string
          nombre_paciente: string
          orden: number
          origen: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          aprobado?: boolean
          calificacion?: number | null
          contenido: string
          created_at?: string
          id?: string
          landing_config_id: string
          nombre_paciente: string
          orden?: number
          origen?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          aprobado?: boolean
          calificacion?: number | null
          contenido?: string
          created_at?: string
          id?: string
          landing_config_id?: string
          nombre_paciente?: string
          orden?: number
          origen?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "landing_testimonios_landing_config_id_fkey"
            columns: ["landing_config_id"]
            isOneToOne: false
            referencedRelation: "landing_config"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landing_testimonios_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      medicamento_principios_activos: {
        Row: {
          concentracion: string | null
          forma_sal: string | null
          medicamento_id: string
          orden: number
          principio_activo_id: string
        }
        Insert: {
          concentracion?: string | null
          forma_sal?: string | null
          medicamento_id: string
          orden: number
          principio_activo_id: string
        }
        Update: {
          concentracion?: string | null
          forma_sal?: string | null
          medicamento_id?: string
          orden?: number
          principio_activo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medicamento_principios_activos_medicamento_id_fkey"
            columns: ["medicamento_id"]
            isOneToOne: false
            referencedRelation: "medicamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicamento_principios_activos_principio_activo_id_fkey"
            columns: ["principio_activo_id"]
            isOneToOne: false
            referencedRelation: "principios_activos"
            referencedColumns: ["id"]
          },
        ]
      }
      medicamentos: {
        Row: {
          codigo_sismed: string
          created_at: string
          estado: string
          forma_farmaceutica_id: number
          id: string
          nombre: string
          origen: string
          presentacion: string | null
          updated_at: string
          via_administracion_id: number | null
        }
        Insert: {
          codigo_sismed: string
          created_at?: string
          estado?: string
          forma_farmaceutica_id: number
          id?: string
          nombre: string
          origen?: string
          presentacion?: string | null
          updated_at?: string
          via_administracion_id?: number | null
        }
        Update: {
          codigo_sismed?: string
          created_at?: string
          estado?: string
          forma_farmaceutica_id?: number
          id?: string
          nombre?: string
          origen?: string
          presentacion?: string | null
          updated_at?: string
          via_administracion_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "medicamentos_forma_farmaceutica_id_fkey"
            columns: ["forma_farmaceutica_id"]
            isOneToOne: false
            referencedRelation: "formas_farmaceuticas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicamentos_via_administracion_id_fkey"
            columns: ["via_administracion_id"]
            isOneToOne: false
            referencedRelation: "vias_administracion"
            referencedColumns: ["id"]
          },
        ]
      }
      medico_pasarelas_config: {
        Row: {
          activo: boolean
          created_at: string
          id: string
          llave_publica: string
          llave_secreta_secret_id: string | null
          medico_id: string
          modo: string
          proveedor: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          id?: string
          llave_publica: string
          llave_secreta_secret_id?: string | null
          medico_id: string
          modo?: string
          proveedor?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          id?: string
          llave_publica?: string
          llave_secreta_secret_id?: string | null
          medico_id?: string
          modo?: string
          proveedor?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medico_pasarelas_config_medico_id_fkey"
            columns: ["medico_id"]
            isOneToOne: true
            referencedRelation: "medicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medico_pasarelas_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      medicos: {
        Row: {
          apellidos: string
          cmp: string | null
          created_at: string
          email: string | null
          especialidad: string | null
          firma_url: string | null
          id: string
          nombres: string
          rne: string | null
          telefono: string | null
          tenant_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          apellidos: string
          cmp?: string | null
          created_at?: string
          email?: string | null
          especialidad?: string | null
          firma_url?: string | null
          id?: string
          nombres: string
          rne?: string | null
          telefono?: string | null
          tenant_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          apellidos?: string
          cmp?: string | null
          created_at?: string
          email?: string | null
          especialidad?: string | null
          firma_url?: string | null
          id?: string
          nombres?: string
          rne?: string | null
          telefono?: string | null
          tenant_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medicos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      orden_imagen_estudios: {
        Row: {
          created_at: string
          estudio_id: string
          id: string
          nota: string | null
          orden: number
          orden_id: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          estudio_id: string
          id?: string
          nota?: string | null
          orden?: number
          orden_id: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          estudio_id?: string
          id?: string
          nota?: string | null
          orden?: number
          orden_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orden_imagen_estudios_estudio_id_fkey"
            columns: ["estudio_id"]
            isOneToOne: false
            referencedRelation: "estudios_imagen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orden_imagen_estudios_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: false
            referencedRelation: "ordenes_imagen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orden_imagen_estudios_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      orden_laboratorio_examenes: {
        Row: {
          created_at: string
          examen_id: string
          id: string
          orden: number
          orden_id: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          examen_id: string
          id?: string
          orden?: number
          orden_id: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          examen_id?: string
          id?: string
          orden?: number
          orden_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orden_laboratorio_examenes_examen_id_fkey"
            columns: ["examen_id"]
            isOneToOne: false
            referencedRelation: "examenes_laboratorio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orden_laboratorio_examenes_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: false
            referencedRelation: "ordenes_laboratorio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orden_laboratorio_examenes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ordenes_imagen: {
        Row: {
          atencion_id: string | null
          cita_id: string | null
          created_at: string
          diagnostico_presuntivo: string | null
          estado: string
          fecha_orden: string
          id: string
          indicacion_clinica: string | null
          medico_id: string
          observaciones: string | null
          paciente_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          atencion_id?: string | null
          cita_id?: string | null
          created_at?: string
          diagnostico_presuntivo?: string | null
          estado?: string
          fecha_orden?: string
          id?: string
          indicacion_clinica?: string | null
          medico_id: string
          observaciones?: string | null
          paciente_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          atencion_id?: string | null
          cita_id?: string | null
          created_at?: string
          diagnostico_presuntivo?: string | null
          estado?: string
          fecha_orden?: string
          id?: string
          indicacion_clinica?: string | null
          medico_id?: string
          observaciones?: string | null
          paciente_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ordenes_imagen_atencion_id_fkey"
            columns: ["atencion_id"]
            isOneToOne: false
            referencedRelation: "atenciones_medicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_imagen_cita_id_fkey"
            columns: ["cita_id"]
            isOneToOne: false
            referencedRelation: "citas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_imagen_medico_id_fkey"
            columns: ["medico_id"]
            isOneToOne: false
            referencedRelation: "medicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_imagen_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_imagen_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ordenes_laboratorio: {
        Row: {
          atencion_id: string | null
          cita_id: string | null
          created_at: string
          diagnostico_presuntivo: string | null
          estado: string
          fecha_orden: string
          id: string
          medico_id: string
          observaciones: string | null
          paciente_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          atencion_id?: string | null
          cita_id?: string | null
          created_at?: string
          diagnostico_presuntivo?: string | null
          estado?: string
          fecha_orden?: string
          id?: string
          medico_id: string
          observaciones?: string | null
          paciente_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          atencion_id?: string | null
          cita_id?: string | null
          created_at?: string
          diagnostico_presuntivo?: string | null
          estado?: string
          fecha_orden?: string
          id?: string
          medico_id?: string
          observaciones?: string | null
          paciente_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ordenes_laboratorio_atencion_id_fkey"
            columns: ["atencion_id"]
            isOneToOne: false
            referencedRelation: "atenciones_medicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_laboratorio_cita_id_fkey"
            columns: ["cita_id"]
            isOneToOne: false
            referencedRelation: "citas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_laboratorio_medico_id_fkey"
            columns: ["medico_id"]
            isOneToOne: false
            referencedRelation: "medicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_laboratorio_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_laboratorio_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      pacientes: {
        Row: {
          apellidos: string
          contacto_emergencia_nombre: string | null
          contacto_emergencia_telefono: string | null
          created_at: string
          direccion: string | null
          documento_identidad: string | null
          email: string | null
          estado_civil: string | null
          fecha_nacimiento: string | null
          grupo_sanguineo: string | null
          id: string
          medico_id: string | null
          nacionalidad: string
          nombres: string
          numero_historia_clinica: string
          ocupacion: string | null
          sexo: string | null
          telefono: string | null
          tenant_id: string
          tipo_documento: string
          updated_at: string
        }
        Insert: {
          apellidos: string
          contacto_emergencia_nombre?: string | null
          contacto_emergencia_telefono?: string | null
          created_at?: string
          direccion?: string | null
          documento_identidad?: string | null
          email?: string | null
          estado_civil?: string | null
          fecha_nacimiento?: string | null
          grupo_sanguineo?: string | null
          id?: string
          medico_id?: string | null
          nacionalidad?: string
          nombres: string
          numero_historia_clinica: string
          ocupacion?: string | null
          sexo?: string | null
          telefono?: string | null
          tenant_id: string
          tipo_documento?: string
          updated_at?: string
        }
        Update: {
          apellidos?: string
          contacto_emergencia_nombre?: string | null
          contacto_emergencia_telefono?: string | null
          created_at?: string
          direccion?: string | null
          documento_identidad?: string | null
          email?: string | null
          estado_civil?: string | null
          fecha_nacimiento?: string | null
          grupo_sanguineo?: string | null
          id?: string
          medico_id?: string | null
          nacionalidad?: string
          nombres?: string
          numero_historia_clinica?: string
          ocupacion?: string | null
          sexo?: string | null
          telefono?: string | null
          tenant_id?: string
          tipo_documento?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pacientes_medico_id_fkey"
            columns: ["medico_id"]
            isOneToOne: false
            referencedRelation: "medicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pacientes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      planes_suscripcion: {
        Row: {
          activo: boolean
          codigo: string
          created_at: string
          id: string
          incluye_agente_whatsapp_ia: boolean
          incluye_facturacion_sunat: boolean
          incluye_landing_personalizable: boolean
          incluye_voice_scribe: boolean
          max_usuarios: number | null
          moneda: string
          nombre: string
          orden: number
          permite_addon_marca_personal: boolean
          precio_addon_marca_personal: number | null
          precio_mensual: number
          updated_at: string
        }
        Insert: {
          activo?: boolean
          codigo: string
          created_at?: string
          id?: string
          incluye_agente_whatsapp_ia?: boolean
          incluye_facturacion_sunat?: boolean
          incluye_landing_personalizable?: boolean
          incluye_voice_scribe?: boolean
          max_usuarios?: number | null
          moneda?: string
          nombre: string
          orden?: number
          permite_addon_marca_personal?: boolean
          precio_addon_marca_personal?: number | null
          precio_mensual: number
          updated_at?: string
        }
        Update: {
          activo?: boolean
          codigo?: string
          created_at?: string
          id?: string
          incluye_agente_whatsapp_ia?: boolean
          incluye_facturacion_sunat?: boolean
          incluye_landing_personalizable?: boolean
          incluye_voice_scribe?: boolean
          max_usuarios?: number | null
          moneda?: string
          nombre?: string
          orden?: number
          permite_addon_marca_personal?: boolean
          precio_addon_marca_personal?: number | null
          precio_mensual?: number
          updated_at?: string
        }
        Relationships: []
      }
      plantillas_especialidad: {
        Row: {
          activo: boolean
          created_at: string
          descripcion: string | null
          es_default: boolean
          especialidad: string
          esquema: Json
          id: string
          medico_id: string | null
          nombre: string
          tenant_id: string | null
          tipo_plantilla: string
          updated_at: string
          version: number
        }
        Insert: {
          activo?: boolean
          created_at?: string
          descripcion?: string | null
          es_default?: boolean
          especialidad: string
          esquema?: Json
          id?: string
          medico_id?: string | null
          nombre: string
          tenant_id?: string | null
          tipo_plantilla?: string
          updated_at?: string
          version?: number
        }
        Update: {
          activo?: boolean
          created_at?: string
          descripcion?: string | null
          es_default?: boolean
          especialidad?: string
          esquema?: Json
          id?: string
          medico_id?: string | null
          nombre?: string
          tenant_id?: string | null
          tipo_plantilla?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "plantillas_especialidad_medico_id_fkey"
            columns: ["medico_id"]
            isOneToOne: false
            referencedRelation: "medicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plantillas_especialidad_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      principios_activos: {
        Row: {
          id: string
          nombre: string
        }
        Insert: {
          id?: string
          nombre: string
        }
        Update: {
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      receta_medicamentos: {
        Row: {
          cantidad: string | null
          created_at: string
          descripcion_libre: string | null
          dosis: string | null
          duracion: string | null
          frecuencia: string | null
          id: string
          indicaciones: string | null
          medicamento_id: string | null
          orden: number
          receta_id: string
          tenant_id: string
          via_administracion_id: number | null
        }
        Insert: {
          cantidad?: string | null
          created_at?: string
          descripcion_libre?: string | null
          dosis?: string | null
          duracion?: string | null
          frecuencia?: string | null
          id?: string
          indicaciones?: string | null
          medicamento_id?: string | null
          orden?: number
          receta_id: string
          tenant_id: string
          via_administracion_id?: number | null
        }
        Update: {
          cantidad?: string | null
          created_at?: string
          descripcion_libre?: string | null
          dosis?: string | null
          duracion?: string | null
          frecuencia?: string | null
          id?: string
          indicaciones?: string | null
          medicamento_id?: string | null
          orden?: number
          receta_id?: string
          tenant_id?: string
          via_administracion_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "receta_medicamentos_medicamento_id_fkey"
            columns: ["medicamento_id"]
            isOneToOne: false
            referencedRelation: "medicamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receta_medicamentos_receta_id_fkey"
            columns: ["receta_id"]
            isOneToOne: false
            referencedRelation: "recetas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receta_medicamentos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receta_medicamentos_via_administracion_id_fkey"
            columns: ["via_administracion_id"]
            isOneToOne: false
            referencedRelation: "vias_administracion"
            referencedColumns: ["id"]
          },
        ]
      }
      recetas: {
        Row: {
          atencion_id: string | null
          cita_id: string | null
          created_at: string
          diagnostico_presuntivo: string | null
          estado: string
          fecha_emision: string
          id: string
          medico_id: string
          motivo_anulacion: string | null
          observaciones: string | null
          paciente_id: string
          tenant_id: string
          updated_at: string
          vigencia_dias: number
        }
        Insert: {
          atencion_id?: string | null
          cita_id?: string | null
          created_at?: string
          diagnostico_presuntivo?: string | null
          estado?: string
          fecha_emision?: string
          id?: string
          medico_id: string
          motivo_anulacion?: string | null
          observaciones?: string | null
          paciente_id: string
          tenant_id: string
          updated_at?: string
          vigencia_dias?: number
        }
        Update: {
          atencion_id?: string | null
          cita_id?: string | null
          created_at?: string
          diagnostico_presuntivo?: string | null
          estado?: string
          fecha_emision?: string
          id?: string
          medico_id?: string
          motivo_anulacion?: string | null
          observaciones?: string | null
          paciente_id?: string
          tenant_id?: string
          updated_at?: string
          vigencia_dias?: number
        }
        Relationships: [
          {
            foreignKeyName: "recetas_atencion_id_fkey"
            columns: ["atencion_id"]
            isOneToOne: false
            referencedRelation: "atenciones_medicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recetas_cita_id_fkey"
            columns: ["cita_id"]
            isOneToOne: false
            referencedRelation: "citas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recetas_medico_id_fkey"
            columns: ["medico_id"]
            isOneToOne: false
            referencedRelation: "medicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recetas_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recetas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      reclamaciones_web: {
        Row: {
          bien_contratado: string
          codigo: string
          consumidor_apellidos: string
          consumidor_documento: string
          consumidor_domicilio: string
          consumidor_email: string
          consumidor_nombres: string
          consumidor_telefono: string | null
          creado_en: string
          detalle: string
          estado: string
          id: string
          ip_hash: string
          monto_reclamado: number | null
          pedido_consumidor: string
          respondido_en: string | null
          respuesta_proveedor: string | null
          tenant_id: string | null
          tipo: string
        }
        Insert: {
          bien_contratado: string
          codigo: string
          consumidor_apellidos: string
          consumidor_documento: string
          consumidor_domicilio: string
          consumidor_email: string
          consumidor_nombres: string
          consumidor_telefono?: string | null
          creado_en?: string
          detalle: string
          estado?: string
          id?: string
          ip_hash: string
          monto_reclamado?: number | null
          pedido_consumidor: string
          respondido_en?: string | null
          respuesta_proveedor?: string | null
          tenant_id?: string | null
          tipo: string
        }
        Update: {
          bien_contratado?: string
          codigo?: string
          consumidor_apellidos?: string
          consumidor_documento?: string
          consumidor_domicilio?: string
          consumidor_email?: string
          consumidor_nombres?: string
          consumidor_telefono?: string | null
          creado_en?: string
          detalle?: string
          estado?: string
          id?: string
          ip_hash?: string
          monto_reclamado?: number | null
          pedido_consumidor?: string
          respondido_en?: string | null
          respuesta_proveedor?: string | null
          tenant_id?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "reclamaciones_web_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      reclamaciones_web_intentos: {
        Row: {
          creado_en: string
          exitoso: boolean
          id: string
          ip_hash: string
        }
        Insert: {
          creado_en?: string
          exitoso?: boolean
          id?: string
          ip_hash: string
        }
        Update: {
          creado_en?: string
          exitoso?: boolean
          id?: string
          ip_hash?: string
        }
        Relationships: []
      }
      reservas_web_intentos: {
        Row: {
          creado_en: string
          exitoso: boolean
          id: string
          ip_hash: string
          tenant_id: string | null
        }
        Insert: {
          creado_en?: string
          exitoso?: boolean
          id?: string
          ip_hash: string
          tenant_id?: string | null
        }
        Update: {
          creado_en?: string
          exitoso?: boolean
          id?: string
          ip_hash?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reservas_web_intentos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      roles_usuario: {
        Row: {
          created_at: string
          id: string
          rol: Database["public"]["Enums"]["rol_usuario"]
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          rol: Database["public"]["Enums"]["rol_usuario"]
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          rol?: Database["public"]["Enums"]["rol_usuario"]
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roles_usuario_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      suscripciones: {
        Row: {
          addon_marca_personal: boolean
          created_at: string
          estado: string
          fecha_fin: string | null
          fecha_inicio: string
          id: string
          metodo_pago: string | null
          plan_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          addon_marca_personal?: boolean
          created_at?: string
          estado?: string
          fecha_fin?: string | null
          fecha_inicio?: string
          id?: string
          metodo_pago?: string | null
          plan_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          addon_marca_personal?: boolean
          created_at?: string
          estado?: string
          fecha_fin?: string | null
          fecha_inicio?: string
          id?: string
          metodo_pago?: string | null
          plan_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suscripciones_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "planes_suscripcion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suscripciones_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          dominio_personalizado: string | null
          estado_pago: string
          fecha_alta: string
          id: string
          nombre_comercial: string
          plan_suscripcion: string
          slug: string | null
        }
        Insert: {
          dominio_personalizado?: string | null
          estado_pago?: string
          fecha_alta?: string
          id?: string
          nombre_comercial: string
          plan_suscripcion?: string
          slug?: string | null
        }
        Update: {
          dominio_personalizado?: string | null
          estado_pago?: string
          fecha_alta?: string
          id?: string
          nombre_comercial?: string
          plan_suscripcion?: string
          slug?: string | null
        }
        Relationships: []
      }
      tipos_consulta: {
        Row: {
          activo: boolean | null
          created_at: string | null
          duracion_minutos: number
          id: string
          nombre: string
          precio_consulta: number | null
          requiere_pago_adelantado: boolean
          tenant_id: string
        }
        Insert: {
          activo?: boolean | null
          created_at?: string | null
          duracion_minutos?: number
          id?: string
          nombre: string
          precio_consulta?: number | null
          requiere_pago_adelantado?: boolean
          tenant_id: string
        }
        Update: {
          activo?: boolean | null
          created_at?: string | null
          duracion_minutos?: number
          id?: string
          nombre?: string
          precio_consulta?: number | null
          requiere_pago_adelantado?: boolean
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tipos_consulta_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      transacciones_suscripcion: {
        Row: {
          created_at: string
          culqi_charge_id: string | null
          culqi_order_id: string | null
          estado: string
          id: string
          metadata: Json
          metodo_pago: string | null
          moneda: string
          monto: number
          periodo_fin: string | null
          periodo_inicio: string | null
          suscripcion_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          culqi_charge_id?: string | null
          culqi_order_id?: string | null
          estado?: string
          id?: string
          metadata?: Json
          metodo_pago?: string | null
          moneda?: string
          monto: number
          periodo_fin?: string | null
          periodo_inicio?: string | null
          suscripcion_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          culqi_charge_id?: string | null
          culqi_order_id?: string | null
          estado?: string
          id?: string
          metadata?: Json
          metodo_pago?: string | null
          moneda?: string
          monto?: number
          periodo_fin?: string | null
          periodo_inicio?: string | null
          suscripcion_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transacciones_suscripcion_suscripcion_id_fkey"
            columns: ["suscripcion_id"]
            isOneToOne: false
            referencedRelation: "suscripciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacciones_suscripcion_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      vias_administracion: {
        Row: {
          id: number
          nombre: string
        }
        Insert: {
          id?: never
          nombre: string
        }
        Update: {
          id?: never
          nombre?: string
        }
        Relationships: []
      }
      whatsapp_credenciales: {
        Row: {
          access_token_expira_en: string | null
          access_token_secret_id: string
          created_at: string
          integracion_id: string
          updated_at: string
        }
        Insert: {
          access_token_expira_en?: string | null
          access_token_secret_id: string
          created_at?: string
          integracion_id: string
          updated_at?: string
        }
        Update: {
          access_token_expira_en?: string | null
          access_token_secret_id?: string
          created_at?: string
          integracion_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_credenciales_integracion_id_fkey"
            columns: ["integracion_id"]
            isOneToOne: true
            referencedRelation: "whatsapp_integraciones"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_integraciones: {
        Row: {
          created_at: string
          estado: string
          id: string
          medico_id: string
          numero_visible: string | null
          phone_number_id: string
          tenant_id: string
          ultimo_error: string | null
          updated_at: string
          waba_id: string
        }
        Insert: {
          created_at?: string
          estado?: string
          id?: string
          medico_id: string
          numero_visible?: string | null
          phone_number_id: string
          tenant_id: string
          ultimo_error?: string | null
          updated_at?: string
          waba_id: string
        }
        Update: {
          created_at?: string
          estado?: string
          id?: string
          medico_id?: string
          numero_visible?: string | null
          phone_number_id?: string
          tenant_id?: string
          ultimo_error?: string | null
          updated_at?: string
          waba_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_integraciones_medico_id_fkey"
            columns: ["medico_id"]
            isOneToOne: true
            referencedRelation: "medicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_integraciones_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_webhook_events: {
        Row: {
          created_at: string
          detalle_error: string | null
          estado: string
          id: string
          medico_id: string | null
          message_id: string
          payload: Json
          phone_number_id: string
          procesado_en: string | null
          tenant_id: string | null
        }
        Insert: {
          created_at?: string
          detalle_error?: string | null
          estado?: string
          id?: string
          medico_id?: string | null
          message_id: string
          payload: Json
          phone_number_id: string
          procesado_en?: string | null
          tenant_id?: string | null
        }
        Update: {
          created_at?: string
          detalle_error?: string | null
          estado?: string
          id?: string
          medico_id?: string | null
          message_id?: string
          payload?: Json
          phone_number_id?: string
          procesado_en?: string | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_webhook_events_medico_id_fkey"
            columns: ["medico_id"]
            isOneToOne: false
            referencedRelation: "medicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_webhook_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      catalogo_busqueda_medicamentos: {
        Row: {
          categoria: string | null
          estado: string | null
          fuente: string | null
          id: string | null
          nombre: string | null
          presentacion: string | null
        }
        Relationships: []
      }
      landing_publica: {
        Row: {
          animaciones_activas: boolean | null
          apellidos: string | null
          biografia: string | null
          cmp: string | null
          color_fondo: string | null
          color_primario: string | null
          color_secundario: string | null
          dominio_personalizado: string | null
          especialidad: string | null
          formacion_academica: string | null
          foto_medico_url: string | null
          galeria_fotos_urls: string[] | null
          logo_url: string | null
          mapa_direccion: string | null
          mapa_lat: number | null
          mapa_lng: number | null
          mostrar_boton_reserva: boolean | null
          mostrar_boton_whatsapp: boolean | null
          nombres: string | null
          rne: string | null
          slug: string | null
          tenant_id: string | null
          tipografia: string | null
          video_url: string | null
          whatsapp_numero: string | null
        }
        Relationships: [
          {
            foreignKeyName: "landing_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_servicios_publica: {
        Row: {
          descripcion: string | null
          duracion_minutos: number | null
          nombre: string | null
          orden: number | null
          precio: number | null
          tenant_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "landing_servicios_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_testimonios_publica: {
        Row: {
          calificacion: number | null
          contenido: string | null
          nombre_paciente: string | null
          orden: number | null
          tenant_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "landing_testimonios_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      culqi_guardar_pasarela_config: {
        Args: {
          p_llave_publica: string
          p_llave_secreta: string
          p_medico_id: string
          p_modo?: string
          p_tenant_id: string
        }
        Returns: string
      }
      culqi_obtener_llave_secreta: {
        Args: { p_medico_id: string }
        Returns: string
      }
      culqi_procesar_evento_charge: {
        Args: {
          p_charge_id: string
          p_event_id: string
          p_exitoso: boolean
          p_medico_id: string
          p_metodo_pago: string
          p_moneda: string
          p_monto: number
          p_order_id: string
          p_payload: Json
          p_referencia_id: string
          p_referencia_tipo: string
          p_tipo_evento: string
        }
        Returns: {
          mensaje: string
          ok: boolean
          resultado: string
        }[]
      }
      dblink: { Args: { "": string }; Returns: Record<string, unknown>[] }
      dblink_cancel_query: { Args: { "": string }; Returns: string }
      dblink_close: { Args: { "": string }; Returns: string }
      dblink_connect: { Args: { "": string }; Returns: string }
      dblink_connect_u: { Args: { "": string }; Returns: string }
      dblink_current_query: { Args: never; Returns: string }
      dblink_disconnect:
        | { Args: never; Returns: string }
        | { Args: { "": string }; Returns: string }
      dblink_error_message: { Args: { "": string }; Returns: string }
      dblink_exec: { Args: { "": string }; Returns: string }
      dblink_fdw_validator: {
        Args: { catalog: unknown; options: string[] }
        Returns: undefined
      }
      dblink_get_connections: { Args: never; Returns: string[] }
      dblink_get_notify:
        | { Args: { conname: string }; Returns: Record<string, unknown>[] }
        | { Args: never; Returns: Record<string, unknown>[] }
      dblink_get_pkey: {
        Args: { "": string }
        Returns: Database["public"]["CompositeTypes"]["dblink_pkey_results"][]
        SetofOptions: {
          from: "*"
          to: "dblink_pkey_results"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      dblink_get_result: {
        Args: { "": string }
        Returns: Record<string, unknown>[]
      }
      dblink_is_busy: { Args: { "": string }; Returns: number }
      f_unaccent: { Args: { "": string }; Returns: string }
      gcal_guardar_credenciales: {
        Args: {
          p_calendar_id?: string
          p_google_email: string
          p_medico_id: string
          p_refresh_token: string
          p_tenant_id: string
          p_zona_horaria?: string
        }
        Returns: string
      }
      gcal_marcar_fallo_cola: {
        Args: { p_cola_id: string; p_error: string }
        Returns: undefined
      }
      gcal_obtener_refresh_token: {
        Args: { p_integracion_id: string }
        Returns: string
      }
      gcal_revocar_integracion: {
        Args: { p_integracion_id: string }
        Returns: undefined
      }
      obtener_slots_disponibles: {
        Args: {
          p_anticipacion_minutos?: number
          p_fecha: string
          p_slug: string
          p_tipo_consulta_id?: string
        }
        Returns: {
          fin: string
          inicio: string
        }[]
      }
      obtener_tipos_consulta_publicos: {
        Args: { p_slug: string }
        Returns: {
          duracion_minutos: number
          id: string
          nombre: string
        }[]
      }
      registrar_intento_reclamacion: {
        Args: { p_exitoso: boolean; p_ip_hash: string }
        Returns: undefined
      }
      registrar_intento_reserva: {
        Args: { p_exitoso: boolean; p_ip_hash: string; p_tenant_id: string }
        Returns: undefined
      }
      registrar_reclamacion_web: {
        Args: {
          p_bien_contratado: string
          p_consumidor_apellidos: string
          p_consumidor_documento: string
          p_consumidor_domicilio: string
          p_consumidor_email: string
          p_consumidor_nombres: string
          p_consumidor_telefono?: string
          p_detalle: string
          p_ip_hash: string
          p_monto_reclamado?: number
          p_pedido_consumidor: string
          p_slug?: string
          p_tipo: string
        }
        Returns: {
          codigo: string
          error_codigo: string
          error_mensaje: string
          ok: boolean
        }[]
      }
      registrar_reserva_web: {
        Args: {
          p_apellidos: string
          p_aseguradora_nombre?: string
          p_aseguradora_tipo?: string
          p_comentario?: string
          p_documento_identidad?: string
          p_email?: string
          p_inicio: string
          p_ip_hash: string
          p_nombres: string
          p_slug: string
          p_telefono: string
          p_tipo_consulta_id?: string
        }
        Returns: {
          cita_id: string
          error_codigo: string
          error_mensaje: string
          estado: string
          fecha_hora: string
          medico_nombre: string
          ok: boolean
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      unaccent: { Args: { "": string }; Returns: string }
    }
    Enums: {
      rol_usuario: "founder" | "medico" | "community_manager" | "asistente"
    }
    CompositeTypes: {
      dblink_pkey_results: {
        position: number | null
        colname: string | null
      }
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      rol_usuario: ["founder", "medico", "community_manager", "asistente"],
    },
  },
} as const
