CREATE TABLE public.suporte_publico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  email text NOT NULL,
  telefone text NOT NULL,
  mensagem text NOT NULL,
  pagina text,
  status text NOT NULL DEFAULT 'aberto',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.suporte_publico TO anon;
GRANT INSERT, SELECT, UPDATE ON public.suporte_publico TO authenticated;
GRANT ALL ON public.suporte_publico TO service_role;

ALTER TABLE public.suporte_publico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "suporte_publico_insert_anon" ON public.suporte_publico
FOR INSERT TO anon, authenticated
WITH CHECK (
  length(nome) BETWEEN 1 AND 100
  AND length(email) BETWEEN 3 AND 255
  AND length(telefone) BETWEEN 8 AND 30
  AND length(mensagem) BETWEEN 1 AND 2000
);

CREATE POLICY "suporte_publico_owner_select" ON public.suporte_publico
FOR SELECT TO authenticated
USING (public.is_platform_owner());

CREATE POLICY "suporte_publico_owner_update" ON public.suporte_publico
FOR UPDATE TO authenticated
USING (public.is_platform_owner())
WITH CHECK (public.is_platform_owner());