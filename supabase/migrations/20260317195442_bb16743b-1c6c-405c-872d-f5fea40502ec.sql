
-- 1. Login attempts table for rate limiting
CREATE TABLE public.login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  attempted_at timestamp with time zone NOT NULL DEFAULT now(),
  ip_address text
);

ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage login_attempts" ON public.login_attempts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Anon can insert login_attempts" ON public.login_attempts
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE INDEX idx_login_attempts_email_time ON public.login_attempts (email, attempted_at);

-- Auto cleanup trigger for old login attempts
CREATE OR REPLACE FUNCTION public.cleanup_old_login_attempts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.login_attempts WHERE attempted_at < now() - interval '1 hour';
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_cleanup_login_attempts
  AFTER INSERT ON public.login_attempts
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.cleanup_old_login_attempts();

-- Rate limit check function
CREATE OR REPLACE FUNCTION public.check_login_rate_limit(p_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  attempt_count integer;
  oldest_attempt timestamp with time zone;
  wait_seconds integer;
BEGIN
  SELECT count(*), min(attempted_at) INTO attempt_count, oldest_attempt
  FROM public.login_attempts
  WHERE email = lower(p_email) AND attempted_at > now() - interval '5 minutes';

  IF attempt_count >= 5 THEN
    wait_seconds := EXTRACT(EPOCH FROM (oldest_attempt + interval '5 minutes' - now()))::integer;
    IF wait_seconds < 0 THEN wait_seconds := 0; END IF;
    RETURN jsonb_build_object('allowed', false, 'wait_seconds', wait_seconds, 'attempts', attempt_count);
  END IF;

  RETURN jsonb_build_object('allowed', true, 'attempts', attempt_count);
END;
$$;

-- Record login attempt function
CREATE OR REPLACE FUNCTION public.record_login_attempt(p_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.login_attempts (email) VALUES (lower(p_email));
END;
$$;

-- 2. Audit log table
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  module text NOT NULL,
  record_id text,
  details jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audit logs" ON public.audit_log
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all audit logs" ON public.audit_log
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE INDEX idx_audit_log_user ON public.audit_log (user_id, created_at DESC);

-- Audit log insert function (SECURITY DEFINER so RLS doesn't block inserts)
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_action text,
  p_module text,
  p_record_id text DEFAULT NULL,
  p_details jsonb DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.audit_log (user_id, action, module, record_id, details)
  VALUES (auth.uid(), p_action, p_module, p_record_id, p_details);
END;
$$;
