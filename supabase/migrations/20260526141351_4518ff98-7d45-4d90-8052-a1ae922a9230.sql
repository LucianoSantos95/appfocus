
CREATE TABLE IF NOT EXISTS public.email_automation_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  automation_type text NOT NULL,
  sequence_step integer NOT NULL DEFAULT 1,
  template_name text NOT NULL,
  recipient_email text NOT NULL,
  status text NOT NULL DEFAULT 'sent',
  metadata jsonb DEFAULT '{}'::jsonb,
  sent_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS email_automation_log_uniq
  ON public.email_automation_log (user_id, automation_type, sequence_step, (metadata->>'week_key'));

CREATE INDEX IF NOT EXISTS email_automation_log_user_idx
  ON public.email_automation_log (user_id, automation_type);

GRANT SELECT ON public.email_automation_log TO authenticated;
GRANT ALL ON public.email_automation_log TO service_role;

ALTER TABLE public.email_automation_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read email_automation_log"
  ON public.email_automation_log FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role manages email_automation_log"
  ON public.email_automation_log FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.onboarding_sessions
  ADD COLUMN IF NOT EXISTS last_reengagement_step integer NOT NULL DEFAULT 0;
