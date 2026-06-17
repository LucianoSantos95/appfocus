CREATE POLICY "Block direct inserts by clients on audit_log"
ON public.audit_log
AS RESTRICTIVE
FOR INSERT
TO authenticated, anon
WITH CHECK (false);