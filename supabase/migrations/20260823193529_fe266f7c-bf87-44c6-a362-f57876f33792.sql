DROP VIEW IF EXISTS public.user_integrations_status;

CREATE VIEW public.user_integrations_status
WITH (security_invoker = false) AS
SELECT
  user_id,
  provider,
  (metadata->>'email') AS email,
  created_at AS connected_at,
  (access_token IS NOT NULL) AS connected
FROM public.user_integrations
WHERE user_id = auth.uid();

GRANT SELECT ON public.user_integrations_status TO authenticated;