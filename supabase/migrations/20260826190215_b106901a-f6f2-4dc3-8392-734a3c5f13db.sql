DROP POLICY IF EXISTS "Deny client access to email_send_log" ON public.email_send_log;

CREATE POLICY "Deny client access to email_send_log"
ON public.email_send_log
AS RESTRICTIVE
FOR ALL
TO anon, authenticated
USING (public.is_platform_owner())
WITH CHECK (false);

CREATE POLICY "Platform owner can read send log"
ON public.email_send_log
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (public.is_platform_owner());

GRANT SELECT ON public.email_send_log TO authenticated;