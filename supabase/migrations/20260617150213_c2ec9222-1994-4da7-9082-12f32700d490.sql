
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_integrations'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_integrations', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "user_integrations_service_all"
  ON public.user_integrations
  AS PERMISSIVE FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "user_integrations_deny_client"
  ON public.user_integrations
  AS RESTRICTIVE FOR ALL
  TO authenticated, anon
  USING (false) WITH CHECK (false);

REVOKE ALL ON public.user_integrations FROM authenticated, anon;
GRANT ALL ON public.user_integrations TO service_role;

CREATE OR REPLACE VIEW public.user_integrations_status
WITH (security_invoker = true) AS
SELECT
  user_id,
  provider,
  (metadata->>'email') AS email,
  created_at AS connected_at,
  (access_token IS NOT NULL) AS connected
FROM public.user_integrations;

GRANT SELECT ON public.user_integrations_status TO authenticated;

CREATE POLICY "login_attempts_deny_client"
  ON public.login_attempts AS RESTRICTIVE FOR ALL
  TO authenticated, anon
  USING (false) WITH CHECK (false);

CREATE POLICY "rate_limits_deny_client"
  ON public.rate_limits AS RESTRICTIVE FOR ALL
  TO authenticated, anon
  USING (false) WITH CHECK (false);

CREATE POLICY "suppressed_emails_deny_client"
  ON public.suppressed_emails AS RESTRICTIVE FOR ALL
  TO authenticated, anon
  USING (false) WITH CHECK (false);

CREATE POLICY "email_unsubscribe_tokens_deny_client"
  ON public.email_unsubscribe_tokens AS RESTRICTIVE FOR ALL
  TO authenticated, anon
  USING (false) WITH CHECK (false);
