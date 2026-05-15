
-- 1. LIMPEZA: tabela órfã sem UI consumidora
DROP TABLE IF EXISTS public.campanha_clientes;

-- 2. ENGAJAMENTO: view a partir do audit_log
CREATE OR REPLACE VIEW public.vw_user_engagement
WITH (security_invoker=on) AS
SELECT
  p.user_id,
  p.display_name,
  au.email,
  s.plan,
  COUNT(al.*) FILTER (WHERE al.created_at > now() - interval '90 days') AS total_actions_90d,
  COUNT(al.*) FILTER (WHERE al.created_at > now() - interval '30 days') AS total_actions_30d,
  COUNT(DISTINCT date_trunc('day', al.created_at)) FILTER (WHERE al.created_at > now() - interval '30 days') AS active_days_30d,
  MAX(al.created_at) AS last_active_at,
  MIN(al.created_at) AS first_seen_at,
  COALESCE(jsonb_object_agg(al.module, action_count) FILTER (WHERE al.module IS NOT NULL), '{}'::jsonb) AS actions_by_module,
  CASE
    WHEN COUNT(DISTINCT date_trunc('day', al.created_at)) FILTER (WHERE al.created_at > now() - interval '30 days') >= 15 THEN 'power'
    WHEN COUNT(DISTINCT date_trunc('day', al.created_at)) FILTER (WHERE al.created_at > now() - interval '30 days') BETWEEN 5 AND 14 THEN 'recorrente'
    WHEN COUNT(DISTINCT date_trunc('day', al.created_at)) FILTER (WHERE al.created_at > now() - interval '30 days') BETWEEN 1 AND 4 THEN 'casual'
    ELSE 'inativo'
  END AS classificacao
FROM public.profiles p
LEFT JOIN auth.users au ON au.id = p.user_id
LEFT JOIN public.subscriptions s ON s.user_id = p.user_id
LEFT JOIN LATERAL (
  SELECT al.*, COUNT(*) OVER (PARTITION BY al.user_id, al.module) AS action_count
  FROM public.audit_log al
  WHERE al.user_id = p.user_id
) al ON true
GROUP BY p.user_id, p.display_name, au.email, s.plan;

-- Restringir leitura a admins via função wrapper
CREATE OR REPLACE FUNCTION public.get_user_engagement()
RETURNS SETOF public.vw_user_engagement
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT * FROM public.vw_user_engagement
  WHERE public.has_role(auth.uid(), 'admin'::app_role);
$$;

-- 3. PROJETOS: vínculo com cliente
ALTER TABLE public.projetos ADD COLUMN IF NOT EXISTS cliente_id uuid;
CREATE INDEX IF NOT EXISTS idx_projetos_cliente_id ON public.projetos(cliente_id);

-- 4. CAMPANHAS: campos de performance
ALTER TABLE public.campanhas ADD COLUMN IF NOT EXISTS leads_gerados integer NOT NULL DEFAULT 0;
ALTER TABLE public.campanhas ADD COLUMN IF NOT EXISTS conversoes integer NOT NULL DEFAULT 0;
ALTER TABLE public.campanhas ADD COLUMN IF NOT EXISTS receita_atribuida numeric NOT NULL DEFAULT 0;

-- 5. CONTEÚDOS: workflow de aprovação
ALTER TABLE public.conteudos ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'pendente';
ALTER TABLE public.conteudos ADD COLUMN IF NOT EXISTS approval_feedback text;

-- 6. CLIENT RECORDINGS: tabela e bucket
CREATE TABLE IF NOT EXISTS public.client_recordings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  cliente_id uuid NOT NULL,
  audio_url text NOT NULL,
  storage_path text NOT NULL,
  transcript text,
  summary text,
  next_actions text,
  duration_sec integer,
  status text NOT NULL DEFAULT 'pendente',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.client_recordings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users select own recordings" ON public.client_recordings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own recordings" ON public.client_recordings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own recordings" ON public.client_recordings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own recordings" ON public.client_recordings FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Service role manages recordings" ON public.client_recordings FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE INDEX IF NOT EXISTS idx_client_recordings_cliente_id ON public.client_recordings(cliente_id);
CREATE TRIGGER update_client_recordings_updated_at BEFORE UPDATE ON public.client_recordings FOR EACH ROW EXECUTE FUNCTION public.update_generic_updated_at();

INSERT INTO storage.buckets (id, name, public) VALUES ('client-recordings', 'client-recordings', false) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Users read own recordings" ON storage.objects FOR SELECT USING (bucket_id = 'client-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users upload own recordings" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'client-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own recordings" ON storage.objects FOR DELETE USING (bucket_id = 'client-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);
