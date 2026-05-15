
-- ============================================================
-- 1. STORAGE BUCKETS: private + ownership-scoped
-- ============================================================

UPDATE storage.buckets SET public = false
WHERE id IN ('relatorios-pdf', 'colaborador-docs', 'projeto-anexos');

-- Drop existing permissive policies on these buckets
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND (
        policyname ILIKE '%relatorios-pdf%' OR
        policyname ILIKE '%relatorios pdf%' OR
        policyname ILIKE '%colaborador%' OR
        policyname ILIKE '%projeto-anexos%' OR
        policyname ILIKE '%projeto anexos%' OR
        policyname ILIKE '%anexos%'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

-- relatorios-pdf: paths start with `${user_id}/...`
CREATE POLICY "relatorios_pdf_owner_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'relatorios-pdf' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "relatorios_pdf_owner_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'relatorios-pdf' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "relatorios_pdf_owner_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'relatorios-pdf' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "relatorios_pdf_service_all" ON storage.objects
  FOR ALL TO public
  USING (bucket_id = 'relatorios-pdf' AND auth.role() = 'service_role')
  WITH CHECK (bucket_id = 'relatorios-pdf' AND auth.role() = 'service_role');

-- colaborador-docs: paths start with `${colaborador_id}/...`
CREATE POLICY "colaborador_docs_owner_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'colaborador-docs'
    AND EXISTS (
      SELECT 1 FROM public.colaboradores c
      WHERE c.id::text = (storage.foldername(name))[1]
        AND c.user_id = auth.uid()
    )
  );
CREATE POLICY "colaborador_docs_owner_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'colaborador-docs'
    AND EXISTS (
      SELECT 1 FROM public.colaboradores c
      WHERE c.id::text = (storage.foldername(name))[1]
        AND c.user_id = auth.uid()
    )
  );
CREATE POLICY "colaborador_docs_owner_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'colaborador-docs'
    AND EXISTS (
      SELECT 1 FROM public.colaboradores c
      WHERE c.id::text = (storage.foldername(name))[1]
        AND c.user_id = auth.uid()
    )
  );

-- projeto-anexos: paths start with `${projeto_id}/...`
CREATE POLICY "projeto_anexos_owner_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'projeto-anexos'
    AND EXISTS (
      SELECT 1 FROM public.projetos p
      WHERE p.id::text = (storage.foldername(name))[1]
        AND p.user_id = auth.uid()
    )
  );
CREATE POLICY "projeto_anexos_owner_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'projeto-anexos'
    AND EXISTS (
      SELECT 1 FROM public.projetos p
      WHERE p.id::text = (storage.foldername(name))[1]
        AND p.user_id = auth.uid()
    )
  );
CREATE POLICY "projeto_anexos_owner_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'projeto-anexos'
    AND EXISTS (
      SELECT 1 FROM public.projetos p
      WHERE p.id::text = (storage.foldername(name))[1]
        AND p.user_id = auth.uid()
    )
  );

-- ============================================================
-- 2. SUBSCRIPTIONS: remove user-facing UPDATE
-- ============================================================
DROP POLICY IF EXISTS "Users can update own subscription" ON public.subscriptions;

-- ============================================================
-- 3. LOGIN_ATTEMPTS: only service role / definer function may insert
-- ============================================================
DROP POLICY IF EXISTS "Anon can insert login_attempts" ON public.login_attempts;
-- record_login_attempt is SECURITY DEFINER and bypasses RLS — keep that as the only path.

-- ============================================================
-- 4. RATE_LIMITS: only service role manages
-- ============================================================
DROP POLICY IF EXISTS "Users can manage own rate limits" ON public.rate_limits;

-- ============================================================
-- 5. AUDIT_LOG: explicit service-role insert policy
-- ============================================================
DROP POLICY IF EXISTS "Service role can insert audit_log" ON public.audit_log;
CREATE POLICY "Service role can insert audit_log" ON public.audit_log
  FOR INSERT TO public
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================
-- 6. Fix mutable search_path on email queue helper functions
-- ============================================================
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pgmq;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pgmq;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pgmq;

-- ============================================================
-- 7. Revoke EXECUTE on internal SECURITY DEFINER functions from anon/authenticated
--    Keep record_login_attempt + check_login_rate_limit callable (login flow).
--    Keep has_role + log_audit_event callable (used by RLS / app triggers).
-- ============================================================
REVOKE EXECUTE ON FUNCTION public.cleanup_rate_limits() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_engagement() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.populate_demo_data() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.claim_orphan_clients() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_login_attempts() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.assign_admin_role() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_default_subscription() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_clientes_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_generic_updated_at() FROM PUBLIC, anon, authenticated;
