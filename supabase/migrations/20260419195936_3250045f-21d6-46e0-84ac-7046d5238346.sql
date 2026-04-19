
-- Tabela de contatos recorrentes para envio de relatórios
CREATE TABLE public.relatorio_contatos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  cargo TEXT,
  canais_preferidos TEXT[] DEFAULT ARRAY['email']::TEXT[],
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.relatorio_contatos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own relatorio_contatos" ON public.relatorio_contatos
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own relatorio_contatos" ON public.relatorio_contatos
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own relatorio_contatos" ON public.relatorio_contatos
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own relatorio_contatos" ON public.relatorio_contatos
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER trg_relatorio_contatos_updated_at
  BEFORE UPDATE ON public.relatorio_contatos
  FOR EACH ROW EXECUTE FUNCTION public.update_generic_updated_at();

-- Tabela de auditoria dos envios
CREATE TABLE public.relatorios_enviados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  modulo TEXT NOT NULL,
  secao TEXT NOT NULL,
  formato TEXT NOT NULL,
  canal TEXT NOT NULL,
  destinatario TEXT NOT NULL,
  destinatario_nome TEXT,
  status TEXT NOT NULL DEFAULT 'enviado',
  pdf_url TEXT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.relatorios_enviados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own relatorios_enviados" ON public.relatorios_enviados
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own relatorios_enviados" ON public.relatorios_enviados
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role can manage relatorios_enviados" ON public.relatorios_enviados
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX idx_relatorios_enviados_user_created ON public.relatorios_enviados(user_id, created_at DESC);
CREATE INDEX idx_relatorio_contatos_user ON public.relatorio_contatos(user_id);

-- Bucket público para PDFs enviados via WhatsApp
INSERT INTO storage.buckets (id, name, public) VALUES ('relatorios-pdf', 'relatorios-pdf', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can read relatorios-pdf" ON storage.objects
  FOR SELECT USING (bucket_id = 'relatorios-pdf');
CREATE POLICY "Users can upload own relatorios-pdf" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'relatorios-pdf' AND auth.uid()::text = (storage.foldername(name))[1]
  );
CREATE POLICY "Service role full access relatorios-pdf" ON storage.objects
  FOR ALL TO service_role USING (bucket_id = 'relatorios-pdf') WITH CHECK (bucket_id = 'relatorios-pdf');
