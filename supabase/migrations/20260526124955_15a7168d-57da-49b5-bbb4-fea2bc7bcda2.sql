
-- 1) Feedbacks: prevent email-spoofing exposure
DROP POLICY IF EXISTS "Anyone can submit feedback" ON public.feedbacks;

CREATE POLICY "Anon can submit feedback without email"
ON public.feedbacks FOR INSERT TO anon
WITH CHECK (email IS NULL);

CREATE POLICY "Authenticated can submit own feedback"
ON public.feedbacks FOR INSERT TO authenticated
WITH CHECK (
  email IS NULL
  OR email = (SELECT u.email FROM auth.users u WHERE u.id = auth.uid())::text
);

-- 2) Storage policies for client-recordings: restrict to authenticated explicitly
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND policyname IN (
        'Users read own recordings',
        'Users upload own recordings',
        'Users update own recordings',
        'Users delete own recordings'
      )
  LOOP
    EXECUTE format('DROP POLICY %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Users read own recordings"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'client-recordings' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users upload own recordings"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'client-recordings' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own recordings"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'client-recordings' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own recordings"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'client-recordings' AND (auth.uid())::text = (storage.foldername(name))[1]);
