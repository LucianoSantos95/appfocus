CREATE TABLE public.feedbacks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT,
  email TEXT,
  mensagem TEXT NOT NULL,
  avaliacao INTEGER CHECK (avaliacao >= 1 AND avaliacao <= 5),
  pagina TEXT DEFAULT '/',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Permitir insercao publica (sem autenticacao)
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir insercao publica" ON public.feedbacks
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir leitura publica" ON public.feedbacks
  FOR SELECT USING (true);