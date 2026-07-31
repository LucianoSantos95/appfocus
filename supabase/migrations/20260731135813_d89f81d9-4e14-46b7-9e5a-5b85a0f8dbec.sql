DROP POLICY IF EXISTS cr_insert_any ON public.custom_requests;

CREATE POLICY cr_insert_any
ON public.custom_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (user_id IS NULL OR user_id = auth.uid());