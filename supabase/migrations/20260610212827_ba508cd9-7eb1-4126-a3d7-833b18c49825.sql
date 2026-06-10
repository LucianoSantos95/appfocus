
-- Explicitly deny INSERT/UPDATE/DELETE on user_roles for authenticated users (privilege escalation prevention).
-- Writes must occur only via service_role (edge functions / admin code).
CREATE POLICY "Deny client inserts on user_roles"
  ON public.user_roles
  AS RESTRICTIVE
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (false);

CREATE POLICY "Deny client updates on user_roles"
  ON public.user_roles
  AS RESTRICTIVE
  FOR UPDATE
  TO authenticated, anon
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Deny client deletes on user_roles"
  ON public.user_roles
  AS RESTRICTIVE
  FOR DELETE
  TO authenticated, anon
  USING (false);

-- Explicitly deny INSERT/DELETE on subscriptions for clients. Provisioning is server-side only.
CREATE POLICY "Deny client inserts on subscriptions"
  ON public.subscriptions
  AS RESTRICTIVE
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (false);

CREATE POLICY "Deny client deletes on subscriptions"
  ON public.subscriptions
  AS RESTRICTIVE
  FOR DELETE
  TO authenticated, anon
  USING (false);
