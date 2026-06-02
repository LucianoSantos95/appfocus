CREATE TABLE public.cancellation_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  plano_anterior TEXT NOT NULL,
  motivo TEXT NOT NULL,
  comentario TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.cancellation_feedback TO authenticated;
GRANT ALL ON public.cancellation_feedback TO service_role;

ALTER TABLE public.cancellation_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own cancellation_feedback"
ON public.cancellation_feedback
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own cancellation_feedback"
ON public.cancellation_feedback
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all cancellation_feedback"
ON public.cancellation_feedback
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_cancellation_feedback_created_at ON public.cancellation_feedback(created_at DESC);
CREATE INDEX idx_cancellation_feedback_user_id ON public.cancellation_feedback(user_id);