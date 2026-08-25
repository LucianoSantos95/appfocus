DROP POLICY IF EXISTS "Anon can submit feedback (no user, no email)" ON public.feedbacks;
CREATE POLICY "Anon can submit feedback with optional email"
ON public.feedbacks FOR INSERT TO anon
WITH CHECK (user_id IS NULL);
GRANT INSERT ON public.feedbacks TO anon;