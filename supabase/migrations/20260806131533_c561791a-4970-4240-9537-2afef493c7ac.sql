DROP POLICY IF EXISTS cr_select_admin ON public.custom_requests;
DROP POLICY IF EXISTS cr_update_admin ON public.custom_requests;
CREATE POLICY cr_select_owner ON public.custom_requests FOR SELECT TO authenticated USING (public.is_platform_owner());
CREATE POLICY cr_update_owner ON public.custom_requests FOR UPDATE TO authenticated USING (public.is_platform_owner()) WITH CHECK (public.is_platform_owner());