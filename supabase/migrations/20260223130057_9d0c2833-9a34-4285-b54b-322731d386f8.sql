
-- Fix rate_limits: add RLS policy for authenticated users to manage their own rate limits
CREATE POLICY "Users can manage own rate limits"
  ON public.rate_limits FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow service role to manage all rate limits (for cleanup function)
CREATE POLICY "Service role can manage all rate limits"
  ON public.rate_limits FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
