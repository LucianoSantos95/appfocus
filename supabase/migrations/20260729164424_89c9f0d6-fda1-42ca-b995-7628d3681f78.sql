
-- 1. Fix cross-tenant write on sales_touchpoints
DROP POLICY IF EXISTS "Admins insert touchpoints" ON public.sales_touchpoints;
CREATE POLICY "Insert own touchpoints or admin"
  ON public.sales_touchpoints
  FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR (user_id = auth.uid() AND created_by = auth.uid())
  );

-- 2. Revoke EXECUTE on internal SECURITY DEFINER functions from anon/authenticated.
--    Kept public (needed by frontend): check_login_rate_limit, record_login_attempt,
--    has_role, log_audit_event, get_user_engagement, recompute_funnel_stage.
--    Trigger-only or backend-only functions listed below.
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb)              FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint)              FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb)  FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.verify_cron_token(text)                 FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.populate_demo_data()                    FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.assign_admin_role()                     FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user()                       FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_user_sign_in()                   FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.claim_orphan_clients()                  FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_login_attempts()            FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_rate_limits()                   FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_default_subscription()           FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_paid_plan_for_exports()         FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.init_funnel_stage()                     FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_funnel_from_subscription()         FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.record_signup_milestone()               FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_generic_updated_at()             FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_clientes_updated_at()            FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_integration_tokens(uuid, text)      FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.upsert_integration(uuid, text, text, text, timestamptz, text, jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_integration_access_token(uuid, text, text, timestamptz) FROM anon, authenticated;

-- 3. Add TTL cleanup for client_errors to prevent flood
CREATE OR REPLACE FUNCTION public.cleanup_old_client_errors()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.client_errors WHERE created_at < now() - interval '30 days';
$$;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_client_errors() FROM anon, authenticated;
