DROP FUNCTION IF EXISTS public.get_user_engagement();
DROP VIEW IF EXISTS public.vw_user_engagement;

CREATE VIEW public.vw_user_engagement
WITH (security_invoker = on) AS
SELECT
  p.user_id,
  p.display_name,
  s.plan,
  count(al.*) FILTER (WHERE al.created_at > (now() - interval '90 days')) AS total_actions_90d,
  count(al.*) FILTER (WHERE al.created_at > (now() - interval '30 days')) AS total_actions_30d,
  count(DISTINCT date_trunc('day', al.created_at)) FILTER (WHERE al.created_at > (now() - interval '30 days')) AS active_days_30d,
  max(al.created_at) AS last_active_at,
  min(al.created_at) AS first_seen_at,
  COALESCE(
    jsonb_object_agg(al.module, al.action_count) FILTER (WHERE al.module IS NOT NULL),
    '{}'::jsonb
  ) AS actions_by_module,
  CASE
    WHEN count(DISTINCT date_trunc('day', al.created_at)) FILTER (WHERE al.created_at > (now() - interval '30 days')) >= 15 THEN 'power'
    WHEN count(DISTINCT date_trunc('day', al.created_at)) FILTER (WHERE al.created_at > (now() - interval '30 days')) BETWEEN 5 AND 14 THEN 'recorrente'
    WHEN count(DISTINCT date_trunc('day', al.created_at)) FILTER (WHERE al.created_at > (now() - interval '30 days')) BETWEEN 1 AND 4 THEN 'casual'
    ELSE 'inativo'
  END AS classificacao
FROM public.profiles p
LEFT JOIN public.subscriptions s ON s.user_id = p.user_id
LEFT JOIN LATERAL (
  SELECT
    al_1.id, al_1.user_id, al_1.action, al_1.module, al_1.record_id,
    al_1.details, al_1.created_at,
    count(*) OVER (PARTITION BY al_1.user_id, al_1.module) AS action_count
  FROM public.audit_log al_1
  WHERE al_1.user_id = p.user_id
) al ON true
GROUP BY p.user_id, p.display_name, s.plan;

CREATE OR REPLACE FUNCTION public.get_user_engagement()
RETURNS SETOF public.vw_user_engagement
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT * FROM public.vw_user_engagement
  WHERE public.has_role(auth.uid(), 'admin'::app_role);
$function$;