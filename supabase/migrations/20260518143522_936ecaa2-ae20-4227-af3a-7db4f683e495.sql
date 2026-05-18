
CREATE TABLE public.subscriber_followups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  recipient_email text NOT NULL,
  sequence_step integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'draft',
  subject text NOT NULL,
  body_html text NOT NULL,
  body_text text,
  ai_rationale text,
  suggested_next_days integer,
  next_followup_at timestamptz,
  sent_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscriber_followups_user ON public.subscriber_followups(user_id, created_at DESC);

ALTER TABLE public.subscriber_followups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read subscriber_followups"
  ON public.subscriber_followups FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins insert subscriber_followups"
  ON public.subscriber_followups FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update subscriber_followups"
  ON public.subscriber_followups FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete subscriber_followups"
  ON public.subscriber_followups FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_subscriber_followups_updated_at
  BEFORE UPDATE ON public.subscriber_followups
  FOR EACH ROW EXECUTE FUNCTION public.update_generic_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.subscriber_followups;
