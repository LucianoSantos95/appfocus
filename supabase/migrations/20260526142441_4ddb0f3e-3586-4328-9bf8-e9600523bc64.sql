
CREATE OR REPLACE FUNCTION public.verify_cron_token(p_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  stored text;
BEGIN
  SELECT decrypted_secret INTO stored FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key' LIMIT 1;
  RETURN stored IS NOT NULL AND p_token = stored;
END;
$$;

REVOKE ALL ON FUNCTION public.verify_cron_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_cron_token(text) TO service_role;
