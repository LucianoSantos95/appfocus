
-- support_tickets: allow admins to update/delete; service_role full access
CREATE POLICY "Admins can update support tickets"
  ON public.support_tickets FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete support tickets"
  ON public.support_tickets FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role manages support tickets"
  ON public.support_tickets FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- suppressed_emails: allow service_role to update/delete for lifecycle management
CREATE POLICY "Service role updates suppressed emails"
  ON public.suppressed_emails FOR UPDATE
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role deletes suppressed emails"
  ON public.suppressed_emails FOR DELETE
  TO service_role
  USING (true);
