
-- email_send_log: deny client access
CREATE POLICY "Deny client access to email_send_log"
ON public.email_send_log AS RESTRICTIVE
FOR ALL TO anon, authenticated
USING (false) WITH CHECK (false);

-- email_send_state: deny client access
CREATE POLICY "Deny client access to email_send_state"
ON public.email_send_state AS RESTRICTIVE
FOR ALL TO anon, authenticated
USING (false) WITH CHECK (false);

-- email_automation_log: allow user to read own, deny writes by client
CREATE POLICY "Users can view their own email automation logs"
ON public.email_automation_log
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Deny client writes to email_automation_log"
ON public.email_automation_log AS RESTRICTIVE
FOR INSERT TO anon, authenticated
WITH CHECK (false);

CREATE POLICY "Deny client updates to email_automation_log"
ON public.email_automation_log AS RESTRICTIVE
FOR UPDATE TO anon, authenticated
USING (false) WITH CHECK (false);

CREATE POLICY "Deny client deletes from email_automation_log"
ON public.email_automation_log AS RESTRICTIVE
FOR DELETE TO anon, authenticated
USING (false);

-- subscriber_followups: allow user to read own, deny writes by non-admin clients
CREATE POLICY "Users can view their own subscriber followups"
ON public.subscriber_followups
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Deny non-admin writes to subscriber_followups"
ON public.subscriber_followups AS RESTRICTIVE
FOR INSERT TO anon, authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Deny non-admin updates to subscriber_followups"
ON public.subscriber_followups AS RESTRICTIVE
FOR UPDATE TO anon, authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Deny non-admin deletes from subscriber_followups"
ON public.subscriber_followups AS RESTRICTIVE
FOR DELETE TO anon, authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));
