DROP POLICY IF EXISTS "advisor_interesse_public_email_update" ON public.advisor_interesse;
REVOKE UPDATE ON public.advisor_interesse FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.advisor_interesse_set_email(p_id uuid, p_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.advisor_interesse
  SET email = lower(trim(p_email))
  WHERE id = p_id
    AND email IS NULL
    AND created_at > now() - interval '1 hour';
END;
$$;

GRANT EXECUTE ON FUNCTION public.advisor_interesse_set_email(uuid, text) TO anon, authenticated;