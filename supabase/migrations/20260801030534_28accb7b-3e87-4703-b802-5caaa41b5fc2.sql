CREATE TABLE public.medicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombres text NOT NULL,
  apellidos text NOT NULL,
  especialidad text NOT NULL,
  cmp text,
  email text,
  telefono text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.pacientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombres text NOT NULL,
  apellidos text NOT NULL,
  dni text UNIQUE,
  fecha_nacimiento date,
  sexo text,
  telefono text,
  email text,
  medico_id uuid REFERENCES public.medicos(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.citas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  medico_id uuid NOT NULL REFERENCES public.medicos(id) ON DELETE CASCADE,
  inicio timestamptz NOT NULL,
  duracion_min integer NOT NULL DEFAULT 30,
  motivo text,
  estado text NOT NULL DEFAULT 'programada',
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pacientes_medico ON public.pacientes(medico_id);
CREATE INDEX idx_citas_inicio ON public.citas(inicio);
CREATE INDEX idx_citas_paciente ON public.citas(paciente_id);
CREATE INDEX idx_citas_medico ON public.citas(medico_id);

GRANT SELECT ON public.medicos TO anon;
GRANT SELECT ON public.pacientes TO anon;
GRANT SELECT ON public.citas TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.medicos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pacientes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.citas TO authenticated;
GRANT ALL ON public.medicos TO service_role;
GRANT ALL ON public.pacientes TO service_role;
GRANT ALL ON public.citas TO service_role;

ALTER TABLE public.medicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "medicos_public_read" ON public.medicos FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "medicos_write_auth" ON public.medicos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "pacientes_public_read" ON public.pacientes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "pacientes_write_auth" ON public.pacientes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "citas_public_read" ON public.citas FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "citas_write_auth" ON public.citas FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_medicos_updated BEFORE UPDATE ON public.medicos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_pacientes_updated BEFORE UPDATE ON public.pacientes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_citas_updated BEFORE UPDATE ON public.citas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.medicos (id, nombres, apellidos, especialidad, cmp, email, telefono) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Carmen', 'Rojas Delgado', 'Medicina Interna', 'CMP 48213', 'carmen.rojas@medisuite.pe', '+51 987 654 321'),
  ('22222222-2222-2222-2222-222222222222', 'Julio', 'Mendoza Paredes', 'Cardiología', 'CMP 51902', 'julio.mendoza@medisuite.pe', '+51 964 112 887');

INSERT INTO public.pacientes (id, nombres, apellidos, dni, fecha_nacimiento, sexo, telefono, email, medico_id) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Luis', 'Fernández Torres', '45872311', '1978-04-12', 'M', '+51 999 111 222', 'luis.fernandez@example.pe', '11111111-1111-1111-1111-111111111111'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'Ana', 'Quispe Huamán', '70981234', '1995-09-03', 'F', '+51 988 333 444', 'ana.quispe@example.pe', '11111111-1111-1111-1111-111111111111'),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'Carlos', 'Vega Ramírez', '09887654', '1962-01-25', 'M', '+51 977 555 666', 'carlos.vega@example.pe', '22222222-2222-2222-2222-222222222222'),
  ('aaaaaaaa-0000-0000-0000-000000000004', 'María', 'Salazar Ríos', '73114526', '2001-07-19', 'F', '+51 966 777 888', 'maria.salazar@example.pe', '22222222-2222-2222-2222-222222222222');

INSERT INTO public.citas (paciente_id, medico_id, inicio, duracion_min, motivo, estado) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', now() + interval '2 hours', 30, 'Control mensual', 'programada'),
  ('aaaaaaaa-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', now() + interval '3 hours', 45, 'Primera consulta', 'programada'),
  ('aaaaaaaa-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', now() + interval '5 hours', 30, 'Resultados de laboratorio', 'programada'),
  ('aaaaaaaa-0000-0000-0000-000000000004', '22222222-2222-2222-2222-222222222222', now() + interval '1 day', 30, 'Evaluación cardiológica', 'programada'),
  ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', now() - interval '2 days', 30, 'Chequeo general', 'completada');