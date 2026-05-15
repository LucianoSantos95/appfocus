
-- Restaurar campanha_clientes (em uso no Marketing)
CREATE TABLE IF NOT EXISTS public.campanha_clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campanha_id uuid NOT NULL,
  cliente_id uuid NOT NULL,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.campanha_clientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users select own campanha_clientes" ON public.campanha_clientes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own campanha_clientes" ON public.campanha_clientes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own campanha_clientes" ON public.campanha_clientes FOR DELETE USING (auth.uid() = user_id);

-- Restringir get_user_engagement
REVOKE EXECUTE ON FUNCTION public.get_user_engagement() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_engagement() TO authenticated;
