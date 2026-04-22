
CREATE TABLE public.user_milestones (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  milestone_key text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  reached_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, milestone_key)
);

CREATE INDEX idx_user_milestones_user_id ON public.user_milestones(user_id);
CREATE INDEX idx_user_milestones_key ON public.user_milestones(milestone_key);

ALTER TABLE public.user_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own milestones"
ON public.user_milestones FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own milestones"
ON public.user_milestones FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all milestones"
ON public.user_milestones FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
