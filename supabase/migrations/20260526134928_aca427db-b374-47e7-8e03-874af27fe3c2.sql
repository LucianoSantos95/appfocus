
-- Fix storage UPDATE policies: restrict to authenticated role
DROP POLICY IF EXISTS "colaborador_docs_owner_update" ON storage.objects;
CREATE POLICY "colaborador_docs_owner_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'colaborador-docs'
  AND EXISTS (
    SELECT 1 FROM public.colaboradores c
    WHERE c.id::text = (storage.foldername(name))[1]
      AND c.user_id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'colaborador-docs'
  AND EXISTS (
    SELECT 1 FROM public.colaboradores c
    WHERE c.id::text = (storage.foldername(name))[1]
      AND c.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "projeto_anexos_owner_update" ON storage.objects;
CREATE POLICY "projeto_anexos_owner_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'projeto-anexos'
  AND EXISTS (
    SELECT 1 FROM public.projetos p
    WHERE p.id::text = (storage.foldername(name))[1]
      AND p.user_id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'projeto-anexos'
  AND EXISTS (
    SELECT 1 FROM public.projetos p
    WHERE p.id::text = (storage.foldername(name))[1]
      AND p.user_id = auth.uid()
  )
);

-- Feedbacks: add user_id and re-scope policies to auth.uid()
ALTER TABLE public.feedbacks ADD COLUMN IF NOT EXISTS user_id uuid;

-- Backfill user_id from auth.users by email when possible
UPDATE public.feedbacks f
SET user_id = u.id
FROM auth.users u
WHERE f.user_id IS NULL AND f.email IS NOT NULL AND lower(u.email) = lower(f.email);

-- Drop old email-based policies
DROP POLICY IF EXISTS "Users can read their own feedback" ON public.feedbacks;
DROP POLICY IF EXISTS "Authors can delete own feedbacks" ON public.feedbacks;
DROP POLICY IF EXISTS "Authenticated can submit own feedback" ON public.feedbacks;
DROP POLICY IF EXISTS "Anon can submit feedback without email" ON public.feedbacks;

-- New policies based on user_id
CREATE POLICY "Anon can submit feedback (no user, no email)"
ON public.feedbacks
FOR INSERT
TO anon
WITH CHECK (user_id IS NULL AND email IS NULL);

CREATE POLICY "Authenticated submit own feedback"
ON public.feedbacks
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND (
    email IS NULL
    OR email = (SELECT u.email FROM auth.users u WHERE u.id = auth.uid())::text
  )
);

CREATE POLICY "Users read own feedbacks"
ON public.feedbacks
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users delete own feedbacks"
ON public.feedbacks
FOR DELETE
TO authenticated
USING (user_id = auth.uid());
