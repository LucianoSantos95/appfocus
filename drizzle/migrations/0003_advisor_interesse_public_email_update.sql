GRANT UPDATE (email) ON public.advisor_interesse TO anon, authenticated;

CREATE POLICY "advisor_interesse_public_email_update"
ON public.advisor_interesse FOR UPDATE
TO anon, authenticated
USING (email IS NULL AND resposta = true AND created_at > now() - interval '1 hour')
WITH CHECK (resposta = true);