DROP TABLE IF EXISTS public.citas;
DROP TABLE IF EXISTS public.pacientes;
DROP TABLE IF EXISTS public.medicos;

CREATE TABLE public.medicos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre_completo text NOT NULL,
  especialidad text,
  cmp_colegiatura text,
  email text,
  telefono_contacto text,
  created_at timestamptz DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.medicos TO authenticated;
GRANT ALL ON public.medicos TO service_role;
ALTER TABLE public.medicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "medicos_select_own" ON public.medicos
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "medicos_insert_own" ON public.medicos
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "medicos_update_own" ON public.medicos
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.pacientes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  medico_id uuid NOT NULL REFERENCES public.medicos(id) ON DELETE CASCADE,
  nombre_completo text NOT NULL,
  dni text,
  telefono_whatsapp text NOT NULL,
  email text,
  antecedentes_alergias text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX pacientes_medico_id_idx ON public.pacientes (medico_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pacientes TO authenticated;
GRANT ALL ON public.pacientes TO service_role;
ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pacientes_own_medico" ON public.pacientes
  FOR ALL TO authenticated
  USING (medico_id IN (SELECT m.id FROM public.medicos m WHERE m.user_id = auth.uid()))
  WITH CHECK (medico_id IN (SELECT m.id FROM public.medicos m WHERE m.user_id = auth.uid()));

CREATE TABLE public.citas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  medico_id uuid NOT NULL REFERENCES public.medicos(id) ON DELETE CASCADE,
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  fecha_hora timestamptz NOT NULL,
  motivo_consulta text,
  estado text DEFAULT 'pendiente',
  monto_pago numeric,
  pago_confirmado boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX citas_medico_id_idx ON public.citas (medico_id);
CREATE INDEX citas_paciente_id_idx ON public.citas (paciente_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.citas TO authenticated;
GRANT ALL ON public.citas TO service_role;
ALTER TABLE public.citas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "citas_own_medico" ON public.citas
  FOR ALL TO authenticated
  USING (medico_id IN (SELECT m.id FROM public.medicos m WHERE m.user_id = auth.uid()))
  WITH CHECK (medico_id IN (SELECT m.id FROM public.medicos m WHERE m.user_id = auth.uid()));