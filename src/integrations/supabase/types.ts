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
      citas: {
        Row: {
          created_at: string
          estado: string
          fecha_hora: string
          id: string
          medico_id: string
          motivo: string | null
          paciente_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          estado?: string
          fecha_hora: string
          id?: string
          medico_id: string
          motivo?: string | null
          paciente_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          estado?: string
          fecha_hora?: string
          id?: string
          medico_id?: string
          motivo?: string | null
          paciente_id?: string
          tenant_id?: string
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
      tenants: {
        Row: {
          dominio_personalizado: string | null
          estado_pago: string
          fecha_alta: string
          id: string
          nombre_comercial: string
          plan_suscripcion: string
        }
        Insert: {
          dominio_personalizado?: string | null
          estado_pago?: string
          fecha_alta?: string
          id?: string
          nombre_comercial: string
          plan_suscripcion?: string
        }
        Update: {
          dominio_personalizado?: string | null
          estado_pago?: string
          fecha_alta?: string
          id?: string
          nombre_comercial?: string
          plan_suscripcion?: string
        }
        Relationships: []
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
    }
    Functions: {
      f_unaccent: { Args: { "": string }; Returns: string }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      unaccent: { Args: { "": string }; Returns: string }
    }
    Enums: {
      rol_usuario: "founder" | "medico" | "community_manager" | "asistente"
    }
    CompositeTypes: {
      [_ in never]: never
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
  public: {
    Enums: {
      rol_usuario: ["founder", "medico", "community_manager", "asistente"],
    },
  },
} as const
