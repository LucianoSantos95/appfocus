ALTER TABLE public.email_send_log ADD COLUMN IF NOT EXISTS opened_at timestamptz;
ALTER TABLE public.email_send_log ADD COLUMN IF NOT EXISTS open_count integer NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_email_send_log_opened ON public.email_send_log(opened_at);
ALTER TABLE public.email_send_log DROP CONSTRAINT IF EXISTS email_send_log_status_check;
ALTER TABLE public.email_send_log ADD CONSTRAINT email_send_log_status_check
  CHECK (status IN ('pending','sent','failed','dlq','suppressed','bounced','complained'));