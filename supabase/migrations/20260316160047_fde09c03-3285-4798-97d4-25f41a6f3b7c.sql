
-- 1. Create storage bucket for colaborador documents
INSERT INTO storage.buckets (id, name, public) VALUES ('colaborador-docs', 'colaborador-docs', true);

-- 2. Create storage bucket for projeto attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('projeto-anexos', 'projeto-anexos', true);

-- 3. Add documents column to colaboradores
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS documents jsonb DEFAULT '[]'::jsonb;

-- 4. Add attachments column to projetos
ALTER TABLE public.projetos ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]'::jsonb;

-- 5. Add meeting_notes column to clientes
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS meeting_notes text;

-- 6. Create conteudos table for marketing content calendar
CREATE TABLE IF NOT EXISTS public.conteudos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  title text NOT NULL,
  description text,
  platform text,
  scheduled_date date,
  status text NOT NULL DEFAULT 'rascunho',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.conteudos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own conteudos" ON public.conteudos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own conteudos" ON public.conteudos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own conteudos" ON public.conteudos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own conteudos" ON public.conteudos FOR DELETE USING (auth.uid() = user_id);

-- 7. Add updated_at trigger for conteudos
CREATE TRIGGER update_conteudos_updated_at
  BEFORE UPDATE ON public.conteudos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_generic_updated_at();

-- 8. Storage RLS policies for colaborador-docs
CREATE POLICY "Users can upload colaborador docs" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'colaborador-docs');
CREATE POLICY "Users can view colaborador docs" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'colaborador-docs');
CREATE POLICY "Users can delete colaborador docs" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'colaborador-docs');

-- 9. Storage RLS policies for projeto-anexos
CREATE POLICY "Users can upload projeto anexos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'projeto-anexos');
CREATE POLICY "Users can view projeto anexos" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'projeto-anexos');
CREATE POLICY "Users can delete projeto anexos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'projeto-anexos');
