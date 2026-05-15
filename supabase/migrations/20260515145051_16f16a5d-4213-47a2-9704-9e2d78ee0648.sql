CREATE TABLE IF NOT EXISTS public.campanha_clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  campanha_id uuid NOT NULL,
  cliente_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(campanha_id, cliente_id)
);

ALTER TABLE public.campanha_clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own campanha_clientes" ON public.campanha_clientes
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own campanha_clientes" ON public.campanha_clientes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own campanha_clientes" ON public.campanha_clientes
  FOR DELETE USING (auth.uid() = user_id);